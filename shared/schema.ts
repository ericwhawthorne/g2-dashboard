import { z } from "zod";

// Dashboard data types — no DB needed, all data comes from RF API + tracking files

export const candidateSchema = z.object({
  name: z.string(),
  rf_id: z.number(),
  stage: z.string(),
  rf_link: z.string().optional(),
});

export const pipelineRoleSchema = z.object({
  client: z.string(),
  role: z.string(),
  stage_counts: z.record(z.string(), z.number()),
  total_active: z.number(),
  candidates: z.array(candidateSchema),
  rf_link: z.string().optional(),
});

export const awaitingNoteSchema = z.object({
  name: z.string(),
  client: z.string(),
  role: z.string(),
  rf_link: z.string().optional(),
});

export const recentReplySchema = z.object({
  name: z.string(),
  client: z.string(),
  role: z.string(),
  timestamp: z.string(),
});

export const systemHealthItemSchema = z.object({
  last_run: z.string(),
  age_minutes: z.number(),
  status: z.enum(["ok", "stale", "error"]),
});

export const submissionCandidateSchema = z.object({
  name: z.string(),
  rf_id: z.number(),
  stage: z.string(),
  has_resume: z.boolean().nullable(),
  has_exec: z.boolean().nullable(),
  rf_link: z.string(),
  entered_at: z.string(),
});

export const submissionRoleSchema = z.object({
  client: z.string(),
  role: z.string(),
  candidates: z.array(submissionCandidateSchema),
});

export const recentlyMovedSchema = z.object({
  name: z.string(),
  rf_id: z.number(),
  client: z.string(),
  role: z.string(),
  stage: z.string(),
  moved_at: z.string(),
  rf_link: z.string(),
});

export const staleScreenSchema = z.object({
  name: z.string(),
  rf_id: z.number(),
  client: z.string(),
  role: z.string(),
  biz_days: z.number(),
  entered_at: z.string(),
  rf_link: z.string(),
});

export const resumeGapSchema = z.object({
  name: z.string(),
  rf_id: z.number(),
  client: z.string(),
  role: z.string(),
  stage: z.string(),
  has_resume: z.boolean().nullable(),
  has_exec: z.boolean().nullable(),
  rf_link: z.string(),
});

export const followUpSchema = z.object({
  email: z.string(),
  client: z.string(),
  role: z.string(),
  biz_days: z.number(),
  tracked_at: z.string(),
});

export const dashboardSummarySchema = z.object({
  total_active_candidates: z.number(),
  at_client_submission: z.number(),
  resumes_this_week: z.number(),
  replies_this_week: z.number(),
  awaiting_notes_count: z.number(),
  active_roles: z.number(),
  recently_moved_count: z.number(),
  stale_screen_count: z.number(),
  resume_gaps_count: z.number(),
});

export const dashboardDataSchema = z.object({
  generated_at: z.string(),
  summary: dashboardSummarySchema,
  pipeline: z.record(z.string(), pipelineRoleSchema),
  awaiting_notes: z.array(awaitingNoteSchema),
  recent_replies: z.array(recentReplySchema),
  system_health: z.record(z.string(), systemHealthItemSchema),
  submission_ready: z.record(z.string(), submissionRoleSchema),
  recently_moved: z.array(recentlyMovedSchema),
  stale_screen: z.array(staleScreenSchema),
  resume_gaps: z.array(resumeGapSchema),
  follow_ups: z.array(followUpSchema),
});

export type Candidate = z.infer<typeof candidateSchema>;
export type PipelineRole = z.infer<typeof pipelineRoleSchema>;
export type AwaitingNote = z.infer<typeof awaitingNoteSchema>;
export type RecentReply = z.infer<typeof recentReplySchema>;
export type SystemHealthItem = z.infer<typeof systemHealthItemSchema>;
export type SubmissionCandidate = z.infer<typeof submissionCandidateSchema>;
export type SubmissionRole = z.infer<typeof submissionRoleSchema>;
export type RecentlyMoved = z.infer<typeof recentlyMovedSchema>;
export type StaleScreen = z.infer<typeof staleScreenSchema>;
export type ResumeGap = z.infer<typeof resumeGapSchema>;
export type FollowUp = z.infer<typeof followUpSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type DashboardData = z.infer<typeof dashboardDataSchema>;
