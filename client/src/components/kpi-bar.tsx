import { Users, CheckSquare, FileText, MessageSquare, Clock, AlertTriangle, TrendingUp, Award } from "lucide-react";
import type { DashboardSummary } from "@shared/schema";

interface KPIBarProps {
  summary: DashboardSummary;
}

interface KPICardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  alert?: boolean;
  highlight?: boolean;
}

function KPICard({ label, value, icon: Icon, alert, highlight }: KPICardProps) {
  return (
    <div className={`flex flex-col gap-1 px-4 py-3 rounded-lg border ${
      alert ? "border-red-200 bg-red-50" :
      highlight ? "border-emerald-200 bg-emerald-50" :
      "border-border bg-card"
    }`}>
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${alert ? "text-red-500" : highlight ? "text-emerald-500" : "text-muted-foreground"}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={`text-2xl font-bold ${alert ? "text-red-600" : highlight ? "text-emerald-600" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

export function KPIBar({ summary }: KPIBarProps) {
  return (
    <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 px-6 py-3 border-b bg-background">
      <KPICard label="Active" value={summary.total_active_candidates} icon={Users} />
      <KPICard label="At Submission" value={summary.at_client_submission} icon={CheckSquare} highlight={summary.at_client_submission > 0} />
      <KPICard label="Offers Out" value={summary.offers_active} icon={Award} highlight={summary.offers_active > 0} />
      <KPICard label="Hired Total" value={summary.candidates_hired_total} icon={TrendingUp} />
      <KPICard label="Stale Screen" value={summary.stale_screen_count} icon={Clock} alert={summary.stale_screen_count > 5} />
      <KPICard label="Stalled Interviews" value={summary.stalled_interviews_count} icon={AlertTriangle} alert={summary.stalled_interviews_count > 0} />
      <KPICard label="Resume Gaps" value={summary.resume_gaps_count} icon={FileText} alert={summary.resume_gaps_count > 0} />
      <KPICard label="Awaiting Notes" value={summary.awaiting_notes_count} icon={MessageSquare} alert={summary.awaiting_notes_count > 0} />
    </div>
  );
}
