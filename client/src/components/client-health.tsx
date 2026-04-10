import type { ClientHealth } from "@shared/schema";
import { Users, AlertTriangle, Clock, ArrowRight } from "lucide-react";

interface Props {
  clients: ClientHealth[];
}

function DaysBadge({ days }: { days: number }) {
  if (days === 0) return <span className="text-xs text-green-600 font-medium">Today</span>;
  if (days <= 2) return <span className="text-xs text-green-600 font-medium">{days}d ago</span>;
  if (days <= 5) return <span className="text-xs text-amber-600 font-medium">{days}d ago</span>;
  return <span className="text-xs text-red-600 font-medium">{days}d ago</span>;
}

function StalledBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">
      <AlertTriangle className="h-3 w-3" />
      {count} stalled
    </span>
  );
}

export function ClientHealthPanel({ clients }: Props) {
  if (!clients?.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">Client Status</span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{clients.length} active</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {clients.map((c) => (
          <div key={c.client} className="bg-card border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b">
              <div>
                <span className="text-sm font-semibold text-foreground">{c.client}</span>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                  {c.roles.join(" · ")}
                </p>
              </div>
              <StalledBadge count={c.stalled} />
            </div>

            {/* Stage counts */}
            <div className="grid grid-cols-3 divide-x text-center py-2">
              <div className="px-2">
                <p className="text-lg font-bold text-foreground tabular-nums">{c.in_interview}</p>
                <p className="text-xs text-muted-foreground">In Interview</p>
              </div>
              <div className="px-2">
                <p className="text-lg font-bold text-foreground tabular-nums">{c.sent_to_client}</p>
                <p className="text-xs text-muted-foreground">Sent to Client</p>
              </div>
              <div className="px-2">
                <p className="text-lg font-bold text-foreground tabular-nums">{c.at_submission}</p>
                <p className="text-xs text-muted-foreground">Submitted</p>
              </div>
            </div>

            {/* Last movement */}
            {c.last_movement_name && (
              <div className="flex items-center gap-2 px-4 py-2 border-t bg-muted/10">
                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {c.last_movement_name}
                  <span className="mx-1 text-muted-foreground/50">→</span>
                  {c.last_movement_stage}
                </span>
                <DaysBadge days={c.last_movement_days} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
