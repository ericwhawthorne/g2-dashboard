import type { DashboardSummary } from "@shared/schema";
import { Users, FileCheck, FileText, MessageSquareReply } from "lucide-react";

interface KPIBarProps {
  summary: DashboardSummary;
}

const kpiConfig = [
  {
    key: "total_active_candidates" as const,
    label: "Active Candidates",
    icon: Users,
    description: "Across all pipelines",
  },
  {
    key: "at_client_submission" as const,
    label: "At Client Submission",
    icon: FileCheck,
    description: "Ready / submitted",
  },
  {
    key: "resumes_this_week" as const,
    label: "Resumes This Week",
    icon: FileText,
    description: "Past 7 days",
  },
  {
    key: "replies_this_week" as const,
    label: "Replies This Week",
    icon: MessageSquareReply,
    description: "Campaign responses",
  },
];

export function KPIBar({ summary }: KPIBarProps) {
  return (
    <div className="px-6 py-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiConfig.map((kpi) => {
          const Icon = kpi.icon;
          const value = summary[kpi.key];
          return (
            <div
              key={kpi.key}
              className="bg-card border border-l-[3px] rounded-lg p-4 transition-colors"
              style={{ borderLeftColor: "hsl(186, 38%, 78%)" }}
              data-testid={`kpi-${kpi.key}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-bold tabular-nums mt-1 text-foreground">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.description}</p>
                </div>
                <div className="p-2 rounded-md" style={{ backgroundColor: "hsl(184, 48%, 94%)" }}>
                  <Icon className="h-4 w-4" style={{ color: "hsl(191, 43%, 20%)" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
