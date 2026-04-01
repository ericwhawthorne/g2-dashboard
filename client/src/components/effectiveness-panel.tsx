import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EffectivenessMetrics } from "@shared/schema";

function Trend({ current, previous, label }: { current: number; previous: number; label: string }) {
  const diff = current - previous;
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const color = diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-muted-foreground";
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-bold text-foreground">{current}</span>
        <div className={`flex items-center gap-0.5 text-xs font-medium mb-0.5 ${color}`}>
          <Icon className="h-3 w-3" />
          <span>{previous > 0 ? `${Math.abs(Math.round(((current - previous) / previous) * 100))}% vs last wk` : `${previous} last wk`}</span>
        </div>
      </div>
    </div>
  );
}

export function EffectivenessPanel({ data }: { data: EffectivenessMetrics }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          Effectiveness This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Trend current={data.submissions_this_week} previous={data.submissions_last_week} label="Submissions" />
          <Trend current={data.client_interviews_this_week} previous={data.client_interviews_last_week} label="Client Interviews" />
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground">Avg Days to Submission</p>
            <span className="text-2xl font-bold text-foreground">
              {data.avg_days_to_submission > 0 ? `${data.avg_days_to_submission}d` : "—"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground">Active Offers</p>
            <span className="text-2xl font-bold text-foreground">{data.offers_active}</span>
          </div>
          <div className="flex flex-col gap-0.5 col-span-2 border-t pt-3">
            <p className="text-xs text-muted-foreground">Total Candidates Hired (All Time)</p>
            <span className="text-2xl font-bold text-foreground">{data.candidates_hired_total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
