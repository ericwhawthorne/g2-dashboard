import { z } from "zod";

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

export const stalledInterviewSchema = z.object({
  name: z.string(),
  rf_id: z.number(),
  client: z.string(),
  role: z.string(),
  biz_days: z.number(),
  entered_at: z.string(),
  rf_link: z.string(),
});

export const effectivenessMetricsSchema = z.object({
  submissions_this_week: z.number(),
  submissions_last_week: z.number(),
  client_interviews_this_week: z.number(),
  client_interviews_last_week: z.number(),
  avg_days_to_submission: z.number(),
  candidates_hired_total: z.number(),
  offers_active: z.number(),
});

export const cronHealthItemSchema = z.object({
  name: z.string(),
  last_run: z.string(),
  age_minutes: z.number(),
  run_count: z.number(),
  status: z.enum(["ok", "stale", "error"]),
  last_result: z.string().optional(),
});

// Client health card
export const clientHealthSchema = z.object({
  client: z.string(),
  roles: z.array(z.string()),
  in_interview: z.number(),
  sent_to_client: z.number(),
  at_submission: z.number(),
  stalled: z.number(),
  last_movement_days: z.number(),
  last_movement_name: z.string(),
  last_movement_stage: z.string(),
  last_movement_at: z.string(),
});

// BD pipeline reply
export const bdReplySchema = z.object({
  name: z.string(),
  email: z.string(),
  company: z.string(),
  days_since_reply: z.number(),
  timestamp: z.string(),
  status: z.enum(["warm", "cold"]),
});

// Today's priorities item
export const priorityItemSchema = z.object({
  type: z.enum(["resume_gap", "stalled_interview", "stale_screen", "awaiting_notes", "follow_up"]),
  urgency: z.enum(["high", "normal", "low"]),
  label: z.string(),
  sub: z.string(),
  rf_link: z.string().optional(),
});

export const dashboardSummarySchema = z.object({
  total_active_candidates: z.number(),
  at_client_submission: z.number(),
  resumes_this_week: z.number(),
  replies_this_week: z.number(),
  bd_replies_this_week: z.number().optional(),
  awaiting_notes_count: z.number(),
  active_roles: z.number(),
  recently_moved_count: z.number(),
  stale_screen_count: z.number(),
  resume_gaps_count: z.number(),
  stalled_interviews_count: z.number(),
  offers_active: z.number(),
  candidates_hired_total: z.number(),
});

export const dashboardDataSchema = z.object({
  generated_at: z.string(),
  summary: dashboardSummarySchema,
  pipeline: z.record(z.string(), pipelineRoleSchema),
  awaiting_notes: z.array(awaitingNoteSchema),
  recent_replies: z.array(recentReplySchema),
  system_health: z.record(z.string(), systemHealthItemSchema),
  cron_health: z.array(cronHealthItemSchema),
  submission_ready: z.record(z.string(), submissionRoleSchema),
  recently_moved: z.array(recentlyMovedSchema),
  stale_screen: z.array(staleScreenSchema),
  stalled_interviews: z.array(stalledInterviewSchema),
  resume_gaps: z.array(resumeGapSchema),
  follow_ups: z.array(followUpSchema),
  effectiveness: effectivenessMetricsSchema,
  client_health: z.array(clientHealthSchema).optional(),
  bd_replies: z.array(bdReplySchema).optional(),
  priorities: z.array(priorityItemSchema).optional(),
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
export type StalledInterview = z.infer<typeof stalledInterviewSchema>;
export type ResumeGap = z.infer<typeof resumeGapSchema>;
export type FollowUp = z.infer<typeof followUpSchema>;
export type CronHealthItem = z.infer<typeof cronHealthItemSchema>;
export type EffectivenessMetrics = z.infer<typeof effectivenessMetricsSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type ClientHealth = z.infer<typeof clientHealthSchema>;
export type BdReply = z.infer<typeof bdReplySchema>;
export type PriorityItem = z.infer<typeof priorityItemSchema>;
export type DashboardData = z.infer<typeof dashboardDataSchema>;
