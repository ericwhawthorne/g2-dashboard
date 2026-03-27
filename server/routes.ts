import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import type { DashboardData, PipelineRole, AwaitingNote, RecentReply, SystemHealthItem } from "@shared/schema";

const RF_API_KEY = "aec5480609260ec2d09f16aaede75bd7";
const RF_BASE = "https://recruiterflow.com/api/external";
const CACHE_PATH = "/tmp/dashboard_data.json";
const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

const TRACKING_DIR = "/home/user/workspace/cron_tracking";

// Excluded stages — candidates in these are NOT "active"
const EXCLUDED_STAGES = new Set([
  "Sourced",
  "Applied",
  "Disqualified",
  "Rejected",
  "Withdrawn",
  "Archived",
  "Hired",
]);

// Stages that count as "at client submission"
const CLIENT_SUBMISSION_STAGES = new Set([
  "Client Submission",
  "Ready for Client Submission",
  "Ready for Company Submission",
]);

function readJsonFile(filePath: string): any {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function rfFetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${RF_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${RF_API_KEY}` },
  });
  if (!res.ok) throw new Error(`RF API ${endpoint}: ${res.status}`);
  return res.json();
}

async function fetchPipelineForJob(jobId: number): Promise<any[]> {
  try {
    const data = await rfFetch(`/candidate/list`, {
      job_id: String(jobId),
      limit: "500",
    });
    return data?.results || data || [];
  } catch {
    return [];
  }
}

function countResumesThisWeek(): number {
  const data = readJsonFile(path.join(TRACKING_DIR, "all_roles_resumes_received.json"));
  if (!data) return 0;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let count = 0;
  for (const entry of Object.values(data) as any[]) {
    const ts = entry.timestamp ? new Date(entry.timestamp) : null;
    if (ts && ts >= oneWeekAgo) count++;
  }
  return count;
}

function countRepliesThisWeek(): { count: number; recent: RecentReply[] } {
  const data = readJsonFile(path.join(TRACKING_DIR, "all_campaigns_replied_leads.json"));
  if (!data) return { count: 0, recent: [] };
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const roleMap = readJsonFile(path.join(TRACKING_DIR, "unified_role_map.json")) || {};

  let count = 0;
  const replies: RecentReply[] = [];

  for (const entry of Object.values(data) as any[]) {
    const ts = entry.timestamp ? new Date(entry.timestamp) : null;
    if (ts && ts >= oneWeekAgo) {
      count++;
      replies.push({
        name: `${entry.first_name || ""} ${entry.last_name || ""}`.trim(),
        client: entry.client || "",
        role: entry.role_name || "",
        timestamp: entry.timestamp,
      });
    }
  }

  // Sort by timestamp descending, take 20
  replies.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return { count, recent: replies.slice(0, 20) };
}

function getAwaitingNotes(): AwaitingNote[] {
  const resumeData = readJsonFile(path.join(TRACKING_DIR, "all_roles_resumes_received.json"));
  if (!resumeData) return [];
  const awaiting: AwaitingNote[] = [];
  for (const entry of Object.values(resumeData) as any[]) {
    if (entry.status === "awaiting_notes" || (entry.has_rf_notes === false && entry.status !== "complete")) {
      awaiting.push({
        name: entry.candidate_name || "Unknown",
        client: entry.client || "Unknown",
        role: entry.role_name || "Unknown",
      });
    }
  }
  // Also check the recheck state for the definitive list
  const recheckState = readJsonFile(path.join(TRACKING_DIR, "awaiting_notes_recheck_state.json"));
  if (recheckState?.last_still_waiting?.length) {
    const existingNames = new Set(awaiting.map((a) => a.name));
    for (const name of recheckState.last_still_waiting) {
      if (!existingNames.has(name)) {
        // Find in resume data
        const entry = Object.values(resumeData).find((e: any) => e.candidate_name === name) as any;
        awaiting.push({
          name,
          client: entry?.client || "Unknown",
          role: entry?.role_name || "Unknown",
        });
      }
    }
  }
  // Deduplicate by name
  const seen = new Set<string>();
  return awaiting.filter((a) => {
    if (seen.has(a.name)) return false;
    seen.add(a.name);
    return true;
  });
}

function getSystemHealth(): Record<string, SystemHealthItem> {
  const now = Date.now();
  const health: Record<string, SystemHealthItem> = {};

  const checks: Array<{ name: string; file: string; field: string }> = [
    { name: "Resume Monitor", file: "ff2af13d/state.json", field: "last_run" },
    { name: "Reply Monitor", file: "b0efe547/last_run.json", field: "last_run" },
    { name: "Awaiting Notes", file: "awaiting_notes_recheck_state.json", field: "last_run" },
    { name: "RF Cache Sync", file: "rf_sync_state.json", field: "last_synced" },
  ];

  for (const check of checks) {
    const data = readJsonFile(path.join(TRACKING_DIR, check.file));
    const lastRun = data?.[check.field];
    if (!lastRun) {
      health[check.name] = { last_run: "never", age_minutes: 9999, status: "error" };
      continue;
    }
    const ageMin = Math.round((now - new Date(lastRun).getTime()) / 60000);
    let status: "ok" | "stale" | "error" = "ok";
    if (ageMin > 720) status = "error";
    else if (ageMin > 120) status = "stale";
    health[check.name] = {
      last_run: lastRun.slice(0, 16),
      age_minutes: ageMin,
      status,
    };
  }

  return health;
}

async function buildDashboardData(): Promise<DashboardData> {
  // Get job IDs from sync state or role map
  const syncState = readJsonFile(path.join(TRACKING_DIR, "rf_sync_state.json"));
  const jobIds: number[] = syncState?.job_ids || [7, 8, 9, 11, 12, 13, 17, 20, 21, 23, 24, 32];

  const roleMap = readJsonFile(path.join(TRACKING_DIR, "unified_role_map.json")) || {};

  // Build role lookup: job_id -> { client, role_name }
  const roleLookup: Record<number, { client: string; role: string }> = {};
  for (const [client, roles] of Object.entries(roleMap) as [string, any[]][]) {
    if (!Array.isArray(roles)) continue;
    for (const r of roles) {
      if (r.rf_job_id) {
        roleLookup[r.rf_job_id] = { client: r.client || client, role: r.role_name };
      }
    }
  }

  // Fetch pipelines in parallel
  const pipelineResults = await Promise.all(
    jobIds.map(async (jobId) => {
      const candidates = await fetchPipelineForJob(jobId);
      return { jobId, candidates };
    })
  );

  const pipeline: Record<string, PipelineRole> = {};
  let totalActive = 0;
  let atClientSubmission = 0;

  for (const { jobId, candidates } of pipelineResults) {
    const info = roleLookup[jobId] || { client: `Job ${jobId}`, role: `Role ${jobId}` };
    const stageCounts: Record<string, number> = {};
    const activeCandidates: Array<{ name: string; rf_id: number; stage: string }> = [];

    for (const c of candidates) {
      const stage = c.stage_name || c.stage || "Unknown";
      if (EXCLUDED_STAGES.has(stage)) continue;

      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      activeCandidates.push({
        name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.name || "Unknown",
        rf_id: c.id || c.rf_id || 0,
        stage,
      });

      totalActive++;
      if (CLIENT_SUBMISSION_STAGES.has(stage)) atClientSubmission++;
    }

    if (activeCandidates.length > 0) {
      pipeline[String(jobId)] = {
        client: info.client,
        role: info.role,
        stage_counts: stageCounts,
        total_active: activeCandidates.length,
        candidates: activeCandidates,
      };
    }
  }

  const resumesThisWeek = countResumesThisWeek();
  const { count: repliesThisWeek, recent: recentReplies } = countRepliesThisWeek();
  const awaitingNotes = getAwaitingNotes();
  const systemHealth = getSystemHealth();

  return {
    generated_at: new Date().toISOString(),
    summary: {
      total_active_candidates: totalActive,
      at_client_submission: atClientSubmission,
      resumes_this_week: resumesThisWeek,
      replies_this_week: repliesThisWeek,
      awaiting_notes_count: awaitingNotes.length,
      active_roles: Object.keys(pipeline).length,
    },
    pipeline,
    awaiting_notes: awaitingNotes,
    recent_replies: recentReplies,
    system_health: systemHealth,
  };
}

async function getDashboardData(): Promise<DashboardData> {
  // Check cache
  try {
    const stat = fs.statSync(CACHE_PATH);
    const age = Date.now() - stat.mtimeMs;
    if (age < CACHE_MAX_AGE_MS) {
      const cached = readJsonFile(CACHE_PATH);
      if (cached) {
        // Recalculate system health live (it's fast)
        cached.system_health = getSystemHealth();
        return cached;
      }
    }
  } catch {
    // No cache
  }

  // Build fresh data
  const data = await buildDashboardData();

  // Write cache
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2));
  } catch {
    // Non-critical
  }

  return data;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/dashboard", async (_req, res) => {
    try {
      const data = await getDashboardData();
      res.json(data);
    } catch (err: any) {
      console.error("Dashboard API error:", err);
      // Fallback to cached data even if stale
      const cached = readJsonFile(CACHE_PATH);
      if (cached) {
        cached.system_health = getSystemHealth();
        res.json(cached);
      } else {
        res.status(500).json({ error: "Failed to fetch dashboard data" });
      }
    }
  });

  app.get("/api/health", async (_req, res) => {
    try {
      const health = getSystemHealth();
      res.json(health);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch health data" });
    }
  });

  return httpServer;
}
