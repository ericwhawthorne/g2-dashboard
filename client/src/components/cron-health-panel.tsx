import { CheckCircle, AlertCircle, XCircle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CronHealthItem } from "@shared/schema";

function StatusIcon({ status }: { status: string }) {
  if (status === "ok") return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === "stale") return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />;
  return <XCircle className="h-3.5 w-3.5 text-red-500" />;
}

function formatAge(minutes: number): string {
  if (minutes >= 9999) return "never";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
}

export function CronHealthPanel({ items }: { items: CronHealthItem[] }) {
  if (!items?.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Automation Health
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">Cron pings not yet received. Data will appear after the next scheduled run.</p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...items].sort((a, b) => b.age_minutes - a.age_minutes);
  const hasIssues = sorted.some(i => i.status !== "ok");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Automation Health
          {hasIssues && (
            <span className="ml-auto text-xs font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Issues
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {sorted.map((item) => (
            <div key={item.name} className="flex items-center justify-between py-1 border-b last:border-0">
              <div className="flex items-center gap-2">
                <StatusIcon status={item.status} />
                <div>
                  <p className="text-xs font-medium text-foreground">{item.name}</p>
                  {item.last_result && (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.last_result}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{formatAge(item.age_minutes)}</p>
                <p className="text-xs text-muted-foreground">run #{item.run_count}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
