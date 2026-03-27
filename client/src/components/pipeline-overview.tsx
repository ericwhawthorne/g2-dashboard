import type { PipelineRole } from "@shared/schema";
import { Building2, Users } from "lucide-react";

interface PipelineOverviewProps {
  pipeline: Record<string, PipelineRole>;
}

// Stage order for consistent display
const STAGE_ORDER = [
  "Recruiter Screen",
  "Ready for Client Submission",
  "Ready for Company Submission",
  "Client Submission",
  "Sent to Client",
  "Sent to client for review",
  "Client Interview",
  "Offer",
];

// Muted teal color palette for stages
const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  "Recruiter Screen": { bg: "#E8F6F7", text: "#1D424A" },
  "Ready for Client Submission": { bg: "#D4EEEF", text: "#1D424A" },
  "Ready for Company Submission": { bg: "#D4EEEF", text: "#1D424A" },
  "Client Submission": { bg: "#ADDADF", text: "#1D424A" },
  "Sent to Client": { bg: "#8ACCD3", text: "#1D424A" },
  "Sent to client for review": { bg: "#8ACCD3", text: "#1D424A" },
  "Client Interview": { bg: "#5EBAC4", text: "#FFFFFF" },
  "Offer": { bg: "#1D424A", text: "#FFFFFF" },
};

const DEFAULT_STAGE_COLOR = { bg: "#E8F6F7", text: "#1D424A" };

export function PipelineOverview({ pipeline }: PipelineOverviewProps) {
  // Sort roles by total active descending
  const sortedRoles = Object.entries(pipeline).sort(
    ([, a], [, b]) => b.total_active - a.total_active
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Pipeline Overview
        </h2>
        <span className="text-xs text-muted-foreground">
          {sortedRoles.length} active roles
        </span>
      </div>
      <div className="space-y-3">
        {sortedRoles.map(([jobId, role]) => (
          <PipelineCard key={jobId} jobId={jobId} role={role} />
        ))}
      </div>
    </div>
  );
}

function PipelineCard({ jobId, role }: { jobId: string; role: PipelineRole }) {
  // Sort stages by the defined order
  const sortedStages = Object.entries(role.stage_counts).sort(([a], [b]) => {
    const ai = STAGE_ORDER.indexOf(a);
    const bi = STAGE_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  // Calculate bar widths
  const maxCount = Math.max(...Object.values(role.stage_counts));

  return (
    <div
      className="bg-card border rounded-lg p-4 transition-all hover:shadow-sm"
      data-testid={`pipeline-card-${jobId}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate" data-testid={`text-role-name-${jobId}`}>
              {role.role}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{role.client}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-bold tabular-nums text-foreground" data-testid={`text-active-count-${jobId}`}>
            {role.total_active}
          </span>
        </div>
      </div>

      {/* Stage badges / horizontal bar */}
      <div className="flex flex-wrap gap-1.5">
        {sortedStages.map(([stage, count]) => {
          const colors = STAGE_COLORS[stage] || DEFAULT_STAGE_COLOR;
          return (
            <div
              key={stage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
              style={{ backgroundColor: colors.bg, color: colors.text }}
              data-testid={`badge-stage-${jobId}-${stage}`}
            >
              <span>{abbreviateStage(stage)}</span>
              <span className="font-bold tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function abbreviateStage(stage: string): string {
  const map: Record<string, string> = {
    "Recruiter Screen": "Screen",
    "Ready for Client Submission": "Ready",
    "Ready for Company Submission": "Ready",
    "Client Submission": "Submitted",
    "Sent to Client": "Sent",
    "Sent to client for review": "Sent",
    "Client Interview": "Interview",
    "Offer": "Offer",
  };
  return map[stage] || stage;
}
