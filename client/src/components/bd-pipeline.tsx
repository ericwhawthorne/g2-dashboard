import type { BdReply } from "@shared/schema";
import { ExternalLink, Flame, Snowflake } from "lucide-react";

interface Props {
  replies: BdReply[];
}

function StatusBadge({ status, days }: { status: "warm" | "cold"; days: number }) {
  if (status === "warm") {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
        <Flame className="h-3 w-3" />
        {days}d — warm
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-medium">
      <Snowflake className="h-3 w-3" />
      {days}d — cold
    </span>
  );
}

export function BdPipelinePanel({ replies }: Props) {
  if (!replies?.length) {
    return (
      <div className="bg-card border rounded-lg p-4">
        <p className="text-xs font-semibold text-foreground mb-2">BD Pipeline</p>
        <p className="text-sm text-muted-foreground">No BD replies tracked yet.</p>
      </div>
    );
  }

  const warm = replies.filter(r => r.status === "warm");
  const cold = replies.filter(r => r.status === "cold");

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/20">
        <span className="text-sm font-semibold text-foreground">BD Pipeline</span>
        {warm.length > 0 && (
          <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
            {warm.length} warm
          </span>
        )}
        {cold.length > 0 && (
          <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-medium">
            {cold.length} cold
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{replies.length} total replies</span>
      </div>
      <div className="divide-y">
        {replies.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{r.name || r.email}</p>
              <p className="text-xs text-muted-foreground truncate">
                {r.company ? `${r.company} — ` : ""}{r.email}
              </p>
            </div>
            <StatusBadge status={r.status} days={r.days_since_reply} />
          </div>
        ))}
      </div>
    </div>
  );
}
