import type { DashboardSummary } from "@shared/schema";
import { Users, FileCheck, FileText, MessageSquareReply, Clock, AlertTriangle, FileX } from "lucide-react";

interface KPIBarProps {
  summary: DashboardSummary;
}

const kpiConfig = [
  {
    key: "total_active_candidates" as const,
    label: "Active",
    icon: Users,
    description: "All pipelines",
  },
  {
    key: "at_client_submission" as const,
    label: "Submitted",
    icon: FileCheck,
    description: "Client Submission",
  },
  {
    key: "resumes_this_week" as const,
    label: "Resumes",
    icon: FileText,
    description: "This week",
  },
  {
    key: "replies_this_week" as const,
    label: "Replies",
    icon: MessageSquareReply,
    description: "This week",
  },
  {
    key: "recently_moved_count" as const,
    label: "New Submissions",
    icon: FileCheck,
    description: "Past 7 days",
  },
  {
    key: "stale_screen_count" as const,
    label: "Stale Screen",
    icon: AlertTriangle,
    description: "3+ biz days",
    alert: true,
  },
  {
    key: "resume_gaps_count" as const,
    label: "Doc Gaps",
    icon: FileX,
    description: "Missing docs",
    alert: true,
  },
  {
    key: "awaiting_notes_count" as const,
    label: "Awaiting Notes",
    icon: Clock,
    description: "No RF notes yet",
    alert: true,
  },
];

export function KPIBar({ summary }: KPIBarProps) {
  return (
    <div className="px-6 py-4 border-b">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpiConfig.map((kpi) => {
          const Icon = kpi.icon;
          const value = summary[kpi.key] ?? 0;
          const isAlert = kpi.alert && value > 0;
          return (
            <div
              key={kpi.key}
              className="bg-card border rounded-lg p-3 transition-colors"
              style={{
                borderLeftWidth: "3px",
                borderLeftColor: isAlert ? "hsl(25, 80%, 60%)" : "hsl(186, 38%, 78%)",
              }}
              data-testid={`kpi-${kpi.key}`}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-tight truncate">
                    {kpi.label}
                  </p>
                  <p
                    className="text-xl font-bold tabular-nums mt-1"
                    style={{ color: isAlert ? "hsl(25, 72%, 35%)" : "hsl(191, 43%, 20%)" }}
                  >
                    {value}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{kpi.description}</p>
                </div>
                <div
                  className="p-1.5 rounded-md shrink-0"
                  style={{
                    backgroundColor: isAlert ? "hsl(25, 80%, 92%)" : "hsl(184, 48%, 94%)",
                  }}
                >
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: isAlert ? "hsl(25, 72%, 35%)" : "hsl(191, 43%, 20%)" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
