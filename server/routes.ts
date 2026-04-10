import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import type {
  DashboardData, PipelineRole, AwaitingNote, RecentReply, SystemHealthItem,
  SubmissionCandidate, SubmissionRole, RecentlyMoved, StaleScreen, ResumeGap,
  FollowUp, StalledInterview, CronHealthItem, EffectivenessMetrics
} from "@shared/schema";

const RF_API_KEY = process.env.RF_API_KEY || "aec5480609260ec2d09f16aaede75bd7";
const RF_BASE = "https://api.recruiterflow.com/api/external";
// In-memory storage — survives normal operation, repopulates after restart via cron pings
let _cronHealth: Record<string, any> = {};
let _trackingSnapshot: Record<string, any> = {};
let _dashboardCache: { data: any; ts: number } | null = null;
const CACHE_MAX_AGE_MS = 3 * 60 * 1000;

// Active job IDs — update when roles open/close
// Inactive: 7 (Integral FS, on hold), 13 (Causal, closed), 15 (Great Question, closed),
//           19 (IFH, complete), 20 (DemandTec CTO, closed), 23 (Integral SE, on hold), 24 (Integral IL, on hold)
const JOB_IDS = [8, 11, 12, 16, 17, 18, 32];

const ROLE_LOOKUP: Record<number, { client: string; role: string }> = {
  // Active roles
  8:  { client: "Venn", role: "Senior Account Executive" },
  11: { client: "Venn", role: "Director of QA" },
  12: { client: "Valence", role: "Principal Product Manager, Enterprise" },
  16: { client: "Sentra", role: "Research Scientist" },
  17: { client: "Neon Health", role: "Account Executive" },
  18: { client: "Valence", role: "Principal Product Designer" },
  32: { client: "Mural Health", role: "VP of Engineering" },
};

const EXCLUDED_STAGES = new Set(["Sourced", "Applied", "Disqualified", "Rejected", "Withdrawn", "Archived"]);
const CLIENT_SUBMISSION_STAGES = new Set(["Client Submission", "Ready for Client Submission", "Ready for Company Submission"]);
const ABOVE_SCREEN_STAGES = new Set([
  "Client Submission", "Ready for Company Submission", "Ready for Client Submission",
  "Sent to Client", "Client Interview", "Offer", "Hired", "Sent to client for review",
]);

function readJsonFile(filePath: string): any {
  try { return JSON.parse(fs.readFileSync(filePath, "utf-8")); }
  catch { return null; }
}

// In-memory accessors
function getCronHealth(): Record<string, any> { return _cronHealth; }
function getTrackingSnapshot(): Record<string, any> { return _trackingSnapshot; }

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
  } catch { return []; }
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
  if (isNaN(start.getTime())) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur < now) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day > 0 && day < 6) count++;
  }
  return count;
}

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  if (isNaN(start.getTime())) return 0;
  return Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
}

async function buildDashboardData(): Promise<DashboardData> {
  const pipelineResults = await Promise.all(
    JOB_IDS.map(async (jobId) => {
      const candidates = await fetchPipelineForJob(jobId);
      return { jobId, candidates };
    })
  );

  const pipeline: Record<string, PipelineRole> = {};
  let totalActive = 0;
  let atClientSubmission = 0;
  let offersActive = 0;
  let candidatesHiredTotal = 0;

  for (const { jobId, candidates } of pipelineResults) {
    const info = ROLE_LOOKUP[jobId] || { client: `Job ${jobId}`, role: `Role ${jobId}` };
    const stageCounts: Record<string, number> = {};
    const activeCandidates: Array<{ name: string; rf_id: number; stage: string; rf_link: string }> = [];

    for (const c of candidates) {
      const cand = c.candidate || c;
      const { stage } = getCurrentStage(c.stages || []);

      // Count hired and offers even though excluded from active
      if (stage === "Hired") { candidatesHiredTotal++; continue; }
      if (stage === "Offer") offersActive++;
      if (EXCLUDED_STAGES.has(stage)) continue;

      const rfId = cand.id || 0;
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      activeCandidates.push({
        name: cand.name || `${cand.first_name || ""} ${cand.last_name || ""}`.trim() || "Unknown",
        rf_id: rfId,
        stage,
        rf_link: `https://recruiterflow.com/prospect/${rfId}`,
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
        rf_link: `https://recruiterflow.com/db_415de1da982a52aab7da4868fc19db91/jobs/${jobId}`,
      };
    }
  }

  // File cache for candidates above Recruiter Screen
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

  await Promise.all(
    candidatesForFileCheck.slice(0, 80).map(async (rfId) => {
      try {
        const d = await rfFetch(`/candidate/get`, { id: String(rfId) });
        fileCache[rfId] = d?.files || [];
      } catch { fileCache[rfId] = []; }
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

  const submissionReady: Record<string, SubmissionRole> = {};
  const recentlyMoved: RecentlyMoved[] = [];
  const staleScreen: StaleScreen[] = [];
  const stalledInterviews: StalledInterview[] = [];
  const resumeGaps: ResumeGap[] = [];
  const awaitingNotes: AwaitingNote[] = [];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // Effectiveness metrics accumulators
  let submissionsThisWeek = 0;
  let submissionsLastWeek = 0;
  let clientInterviewsThisWeek = 0;
  let clientInterviewsLastWeek = 0;
  const daysToSubmissionList: number[] = [];

  for (const { jobId, candidates } of pipelineResults) {
    const info = ROLE_LOOKUP[jobId] || { client: `Job ${jobId}`, role: `Role ${jobId}` };
    const roleKey = String(jobId);

    for (const c of candidates) {
      const cand = c.candidate || c;
      const stagesArr = c.stages || [];
      const { stage, enteredAt } = getCurrentStage(stagesArr);
      const rfId = cand.id || 0;
      const name = cand.name || "Unknown";
      const rfLink = `https://recruiterflow.com/prospect/${rfId}`;

      if (EXCLUDED_STAGES.has(stage) && stage !== "Hired") continue;

      // Effectiveness: count stage entries this week / last week
      if (enteredAt) {
        const enteredDate = new Date(enteredAt);
        if (CLIENT_SUBMISSION_STAGES.has(stage)) {
          if (enteredDate >= oneWeekAgo) submissionsThisWeek++;
          else if (enteredDate >= twoWeeksAgo) submissionsLastWeek++;

          // Time to submission: find when they entered Recruiter Screen
          const screenStage = stagesArr.find((s: any) => s.to === "Recruiter Screen");
          if (screenStage?.time) {
            const days = daysSince(screenStage.time) - daysSince(enteredAt);
            if (days > 0 && days < 180) daysToSubmissionList.push(days);
          }
        }
        if (stage === "Client Interview") {
          if (enteredDate >= oneWeekAgo) clientInterviewsThisWeek++;
          else if (enteredDate >= twoWeeksAgo) clientInterviewsLastWeek++;
        }
      }

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
        // Awaiting notes: has resume in RF, no exec summary
        if (rfId && fileCache[rfId]) {
          const { hasResume, hasExec } = checkFiles(rfId);
          if (hasResume && !hasExec && !awaitingNotes.find(a => a.name === name)) {
            awaitingNotes.push({
              name, client: info.client, role: info.role,
              rf_link: rfLink,
            });
          }
        }
      } else if (stage === "Client Interview") {
        // Stalled: at Client Interview 5+ biz days with no movement
        const bd = businessDaysSince(enteredAt);
        if (bd >= 5) {
          stalledInterviews.push({
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

  // Sort
  recentlyMoved.sort((a, b) => b.moved_at.localeCompare(a.moved_at));
  staleScreen.sort((a, b) => b.biz_days - a.biz_days);
  stalledInterviews.sort((a, b) => b.biz_days - a.biz_days);
  resumeGaps.sort((a, b) => {
    const order = [...ABOVE_SCREEN_STAGES];
    return order.indexOf(b.stage) - order.indexOf(a.stage);
  });

  const avgDaysToSubmission = daysToSubmissionList.length > 0
    ? Math.round(daysToSubmissionList.reduce((a, b) => a + b, 0) / daysToSubmissionList.length)
    : 0;

  const effectiveness: EffectivenessMetrics = {
    submissions_this_week: submissionsThisWeek,
    submissions_last_week: submissionsLastWeek,
    client_interviews_this_week: clientInterviewsThisWeek,
    client_interviews_last_week: clientInterviewsLastWeek,
    avg_days_to_submission: avgDaysToSubmission,
    candidates_hired_total: candidatesHiredTotal,
    offers_active: offersActive,
  };

  // Cron health — from POST endpoint or empty
  const cronHealthRaw = getCronHealth();
  const cronHealth: CronHealthItem[] = Object.entries(cronHealthRaw).map(([name, v]: [string, any]) => {
    const ageMin = v.last_run
      ? Math.round((Date.now() - new Date(v.last_run).getTime()) / 60000)
      : 9999;
    let status: "ok" | "stale" | "error" = "ok";
    if (ageMin > 1440) status = "error";
    else if (ageMin > 480) status = "stale";
    return {
      name,
      last_run: v.last_run || "never",
      age_minutes: ageMin,
      run_count: v.run_count || 0,
      status,
      last_result: v.last_result || "",
    };
  });

  // Tracking snapshot (from POST endpoint)
  const snapshot = getTrackingSnapshot();

  return {
    generated_at: new Date().toISOString(),
    summary: {
      total_active_candidates: totalActive,
      at_client_submission: atClientSubmission,
      resumes_this_week: snapshot.resumes_this_week ?? 0,
      replies_this_week: snapshot.replies_this_week ?? 0,
      bd_replies_this_week: snapshot.bd_replies_this_week ?? 0,
      awaiting_notes_count: awaitingNotes.length,
      active_roles: Object.keys(pipeline).length,
      recently_moved_count: recentlyMoved.length,
      stale_screen_count: staleScreen.length,
      resume_gaps_count: resumeGaps.length,
      stalled_interviews_count: stalledInterviews.length,
      offers_active: offersActive,
      candidates_hired_total: candidatesHiredTotal,
    },
    pipeline,
    awaiting_notes: awaitingNotes,
    recent_replies: snapshot.recent_replies ?? [],
    system_health: { "RF API": { last_run: new Date().toISOString().slice(0, 16), age_minutes: 0, status: "ok" } },
    cron_health: cronHealth,
    submission_ready: submissionReady,
    recently_moved: recentlyMoved,
    stale_screen: staleScreen,
    stalled_interviews: stalledInterviews,
    resume_gaps: resumeGaps,
    follow_ups: snapshot.follow_ups ?? [],
    effectiveness,
  };
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    const stat = fs.statSync(CACHE_PATH);
    if (Date.now() - stat.mtimeMs < CACHE_MAX_AGE_MS) {
      const cached = _dashboardCache?.data;
      if (cached) return cached;
    }
  } catch { /* no cache */ }

  const data = await buildDashboardData();
  _dashboardCache = { data, ts: Date.now() };
  return data;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Main dashboard endpoint
  app.get("/api/dashboard", async (_req, res) => {
    try {
      res.json(await getDashboardData());
    } catch (err: any) {
      console.error("Dashboard API error:", err);
      const cached = _dashboardCache?.data;
      if (cached) res.json(cached);
      else res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Cron health POST endpoint — called by each cron after every run
  // Body: { cron_id, name, last_run, run_count, last_result }
  app.post("/api/cron-ping", (req, res) => {
    try {
      const { name, last_run, run_count, last_result } = req.body;
      if (!name) return res.status(400).json({ error: "name required" });
      const health = getCronHealth();
      health[name] = { last_run, run_count, last_result, updated_at: new Date().toISOString() };
      fs.writeFileSync(CRON_HEALTH_PATH, JSON.stringify(health, null, 2));
      // Bust dashboard cache so next request reflects updated cron health
      _dashboardCache = null;
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Tracking snapshot POST endpoint — called by morning briefing cron
  // Body: { resumes_this_week, replies_this_week, recent_replies, follow_ups }
  app.post("/api/tracking-snapshot", (req, res) => {
    try {
      const snapshot = req.body;
      _trackingSnapshot = { ...snapshot, updated_at: new Date().toISOString() };
      _dashboardCache = null;
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}
