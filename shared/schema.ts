import { z } from "zod";

// Dashboard data types — no DB needed, all data comes from RF API + tracking files

export const candidateSchema = z.object({
  name: z.string(),
  rf_id: z.number(),
  stage: z.string(),
});

export const pipelineRoleSchema = z.object({
  client: z.string(),
  role: z.string(),
  stage_counts: z.record(z.string(), z.number()),
  total_active: z.number(),
  candidates: z.array(candidateSchema),
});

export const awaitingNoteSchema = z.object({
  name: z.string(),
  client: z.string(),
  role: z.string(),
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

export const dashboardSummarySchema = z.object({
  total_active_candidates: z.number(),
  at_client_submission: z.number(),
  resumes_this_week: z.number(),
  replies_this_week: z.number(),
  awaiting_notes_count: z.number(),
  active_roles: z.number(),
});

export const dashboardDataSchema = z.object({
  generated_at: z.string(),
  summary: dashboardSummarySchema,
  pipeline: z.record(z.string(), pipelineRoleSchema),
  awaiting_notes: z.array(awaitingNoteSchema),
  recent_replies: z.array(recentReplySchema),
  system_health: z.record(z.string(), systemHealthItemSchema),
});

export type Candidate = z.infer<typeof candidateSchema>;
export type PipelineRole = z.infer<typeof pipelineRoleSchema>;
export type AwaitingNote = z.infer<typeof awaitingNoteSchema>;
export type RecentReply = z.infer<typeof recentReplySchema>;
export type SystemHealthItem = z.infer<typeof systemHealthItemSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type DashboardData = z.infer<typeof dashboardDataSchema>;
