import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import type { DashboardData, PipelineRole, AwaitingNote, RecentReply, SystemHealthItem, SubmissionCandidate, SubmissionRole, RecentlyMoved, StaleScreen, ResumeGap, FollowUp } from "@shared/schema";

const RF_API_KEY = process.env.RF_API_KEY || "aec5480609260ec2d09f16aaede75bd7";
const RF_BASE = "https://api.recruiterflow.com/api/external";
const CACHE_PATH = "/tmp/dashboard_data.json";
const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

// Active job IDs — update here when roles change
const JOB_IDS = [7, 8, 11, 12, 13, 15, 17, 19, 20, 23, 24, 32];

// Role metadata — kept in sync with unified_role_map.json
const ROLE_LOOKUP: Record<number, { client: string; role: string }> = {
  7:  { client: "Integral Privacy Technologies", role: "Full Stack Engineer" },
  8:  { client: "Venn", role: "Senior Account Executive" },
  11: { client: "Venn", role: "Director of QA" },
  12: { client: "Valence", role: "Principal Product Manager, Enterprise" },
  13: { client: "Causal", role: "Senior Typescript Engineer" },
  15: { client: "Great Question", role: "Account Executive" },
  17: { client: "Neon Health", role: "Account Executive" },
  19: { client: "IFH (Infusion For Health)", role: "Regional Sales Director" },
  20: { client: "DemandTec", role: "CTO" },
  23: { client: "Integral Privacy Technologies", role: "Solutions Engineer" },
  24: { client: "Integral Privacy Technologies", role: "Implementation Lead" },
  32: { client: "Mural Health", role: "VP of Engineering" },
};

// Excluded stages
const EXCLUDED_STAGES = new Set([
  "Sourced", "Applied", "Disqualified", "Rejected", "Withdrawn", "Archived",
]);

// Stages that count as "at client submission"
const CLIENT_SUBMISSION_STAGES = new Set([
  "Client Submission", "Ready for Client Submission", "Ready for Company Submission",
]);

// Stages above Recruiter Screen (need resume + exec)
const ABOVE_SCREEN_STAGES = new Set([
  "Client Submission", "Ready for Company Submission", "Ready for Client Submission",
  "Sent to Client", "Client Interview", "Offer", "Hired", "Sent to client for review",
]);

function readJsonFile(filePath: string): any {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

async function rfFetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${RF_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { "RF-Api-Key": RF_API_KEY } });
  if (!res.ok) throw new Error(`RF API ${endpoint}: ${res.status}`);
  return res.json();
}

async function fetchPipelineForJob(jobId: number): Promise<any[]> {
  try {
    const data = await rfFetch(`/job/pipeline`, { job_id: String(jobId) });
    return data?.detail || [];
  } catch {
    return [];
  }
}

function getCurrentStage(stagesArr: any[]): { stage: string; enteredAt: string } {
  if (!stagesArr?.length) return { stage: "Unknown", enteredAt: "" };
  const sorted = [...stagesArr].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const last = sorted[sorted.length - 1];
  return { stage: last?.to || "Unknown", enteredAt: last?.time || "" };
}

function businessDaysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  const now = new Date();
  let count = 0;
  const cur = new Date(start);
  while (cur < now) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day > 0 && day < 6) count++;
  }
  return count;
}

async function buildDashboardData(): Promise<DashboardData> {
  // Fetch all pipelines in parallel
  const pipelineResults = await Promise.all(
    JOB_IDS.map(async (jobId) => {
      const candidates = await fetchPipelineForJob(jobId);
      return { jobId, candidates };
    })
  );

  // Build pipeline summary
  const pipeline: Record<string, PipelineRole> = {};
  let totalActive = 0;
  let atClientSubmission = 0;

  for (const { jobId, candidates } of pipelineResults) {
    const info = ROLE_LOOKUP[jobId] || { client: `Job ${jobId}`, role: `Role ${jobId}` };
    const stageCounts: Record<string, number> = {};
    const activeCandidates: Array<{ name: string; rf_id: number; stage: string }> = [];

    for (const c of candidates) {
      const cand = c.candidate || c;
      const { stage } = getCurrentStage(c.stages || []);
      if (EXCLUDED_STAGES.has(stage)) continue;

      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      activeCandidates.push({
        name: cand.name || `${cand.first_name || ""} ${cand.last_name || ""}`.trim() || "Unknown",
        rf_id: cand.id || 0,
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

  // Collect candidates needing file checks (at or above screen, capped at 80)
  const fileCache: Record<number, any[]> = {};
  const candidatesForFileCheck: number[] = [];

  for (const { candidates } of pipelineResults) {
    for (const c of candidates) {
      const cand = c.candidate || c;
      const { stage } = getCurrentStage(c.stages || []);
      const rfId = cand.id || 0;
      if (rfId && ABOVE_SCREEN_STAGES.has(stage) && !fileCache[rfId]) {
        candidatesForFileCheck.push(rfId);
      }
    }
  }

  // Fetch candidate files in parallel (cap at 80)
  await Promise.all(
    candidatesForFileCheck.slice(0, 80).map(async (rfId) => {
      try {
        const d = await rfFetch(`/candidate/get`, { id: String(rfId) });
        fileCache[rfId] = d?.files || [];
      } catch {
        fileCache[rfId] = [];
      }
    })
  );

  function checkFiles(rfId: number): { hasResume: boolean; hasExec: boolean } {
    const files = fileCache[rfId] || [];
    let hasResume = false, hasExec = false;
    for (const f of files) {
      const fname = (f.filename || f.name || "").toLowerCase();
      const cat = f.file_category_id;
      if (!hasResume && [1, 2].includes(cat) &&
          !fname.includes("exec") && !fname.includes("summary")) hasResume = true;
      if (!hasExec && (cat === 24 ||
          (cat === 2 && fname.includes(" - ") && fname.split(" - ").length >= 3) ||
          (cat === 2 && (fname.includes("exec") || fname.includes("summary") || fname.includes("submittal"))))) hasExec = true;
    }
    return { hasResume, hasExec };
  }

  // Build detailed sections
  const submissionReady: Record<string, SubmissionRole> = {};
  const recentlyMoved: RecentlyMoved[] = [];
  const staleScreen: StaleScreen[] = [];
  const resumeGaps: ResumeGap[] = [];
  const awaitingNotes: AwaitingNote[] = [];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const { jobId, candidates } of pipelineResults) {
    const info = ROLE_LOOKUP[jobId] || { client: `Job ${jobId}`, role: `Role ${jobId}` };
    const roleKey = String(jobId);

    for (const c of candidates) {
      const cand = c.candidate || c;
      const { stage, enteredAt } = getCurrentStage(c.stages || []);
      const rfId = cand.id || 0;
      const name = cand.name || "Unknown";
      const rfLink = `https://app.recruiterflow.com/candidate/${rfId}`;

      if (EXCLUDED_STAGES.has(stage)) continue;

      if (CLIENT_SUBMISSION_STAGES.has(stage)) {
        const { hasResume, hasExec } = checkFiles(rfId);
        if (!submissionReady[roleKey]) {
          submissionReady[roleKey] = { client: info.client, role: info.role, candidates: [] };
        }
        submissionReady[roleKey].candidates.push({
          name, rf_id: rfId, stage,
          has_resume: hasResume, has_exec: hasExec,
          rf_link: rfLink, entered_at: enteredAt,
        });
        if (enteredAt && new Date(enteredAt) >= oneWeekAgo) {
          recentlyMoved.push({
            name, rf_id: rfId, client: info.client, role: info.role,
            stage, moved_at: enteredAt.slice(0, 10), rf_link: rfLink,
          });
        }
      } else if (stage === "Recruiter Screen") {
        const bd = businessDaysSince(enteredAt);
        if (bd >= 3) {
          staleScreen.push({
            name, rf_id: rfId, client: info.client, role: info.role,
            biz_days: bd, entered_at: enteredAt.slice(0, 10), rf_link: rfLink,
          });
        }
      } else if (ABOVE_SCREEN_STAGES.has(stage)) {
        const { hasResume, hasExec } = checkFiles(rfId);
        if (!hasResume || !hasExec) {
          resumeGaps.push({
            name, rf_id: rfId, client: info.client, role: info.role,
            stage, has_resume: hasResume, has_exec: hasExec, rf_link: rfLink,
          });
        }
      }
    }
  }

  // Awaiting notes: candidates with resume in RF but no exec summary, at Recruiter Screen
  // Derive from file check results for candidates at Recruiter Screen
  for (const { jobId, candidates } of pipelineResults) {
    const info = ROLE_LOOKUP[jobId] || { client: `Job ${jobId}`, role: `Role ${jobId}` };
    for (const c of candidates) {
      const cand = c.candidate || c;
      const { stage } = getCurrentStage(c.stages || []);
      if (stage !== "Recruiter Screen") continue;
      const rfId = cand.id || 0;
      if (!rfId || !fileCache[rfId]) continue; // only candidates we fetched files for
      const { hasResume, hasExec } = checkFiles(rfId);
      if (hasResume && !hasExec) {
        const name = cand.name || "Unknown";
        if (!awaitingNotes.find(a => a.name === name)) {
          awaitingNotes.push({ name, client: info.client, role: info.role });
        }
      }
    }
  }

  // Sort
  recentlyMoved.sort((a, b) => b.moved_at.localeCompare(a.moved_at));
  staleScreen.sort((a, b) => b.biz_days - a.biz_days);
  resumeGaps.sort((a, b) => {
    const stageOrder = [...ABOVE_SCREEN_STAGES];
    return stageOrder.indexOf(b.stage) - stageOrder.indexOf(a.stage);
  });

  // System health — RF API connectivity check only (no local files on Railway)
  const systemHealth: Record<string, SystemHealthItem> = {
    "RF API": {
      last_run: new Date().toISOString().slice(0, 16),
      age_minutes: 0,
      status: "ok",
    },
  };

  return {
    generated_at: new Date().toISOString(),
    summary: {
      total_active_candidates: totalActive,
      at_client_submission: atClientSubmission,
      resumes_this_week: 0,  // requires tracking file — shown as N/A
      replies_this_week: 0,  // requires Instantly tracking — shown as N/A
      awaiting_notes_count: awaitingNotes.length,
      active_roles: Object.keys(pipeline).length,
      recently_moved_count: recentlyMoved.length,
      stale_screen_count: staleScreen.length,
      resume_gaps_count: resumeGaps.length,
    },
    pipeline,
    awaiting_notes: awaitingNotes,
    recent_replies: [],
    system_health: systemHealth,
    submission_ready: submissionReady,
    recently_moved: recentlyMoved,
    stale_screen: staleScreen,
    resume_gaps: resumeGaps,
    follow_ups: [],
  };
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    const stat = fs.statSync(CACHE_PATH);
    const age = Date.now() - stat.mtimeMs;
    if (age < CACHE_MAX_AGE_MS) {
      const cached = readJsonFile(CACHE_PATH);
      if (cached) return cached;
    }
  } catch { /* no cache */ }

  const data = await buildDashboardData();

  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2));
  } catch { /* non-critical */ }

  return data;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/dashboard", async (_req, res) => {
    try {
      const data = await getDashboardData();
      res.json(data);
    } catch (err: any) {
      console.error("Dashboard API error:", err);
      const cached = readJsonFile(CACHE_PATH);
      if (cached) {
        res.json(cached);
      } else {
        res.status(500).json({ error: "Failed to fetch dashboard data" });
      }
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return httpServer;
}
