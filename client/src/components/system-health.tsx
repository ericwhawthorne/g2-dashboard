import type { SystemHealthItem } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SystemHealthProps {
  health: Record<string, SystemHealthItem>;
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "ok"
      ? "#22c55e"
      : status === "stale"
        ? "#eab308"
        : "#ef4444";
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
      style={{ backgroundColor: color }}
      title={status}
    />
  );
}

function formatAge(minutes: number): string {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SystemHealth({ health: initialHealth }: SystemHealthProps) {
  const [expanded, setExpanded] = useState(false);

  // Poll health independently more often
  const { data: health } = useQuery<Record<string, SystemHealthItem>>({
    queryKey: ["/api/health"],
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
    initialData: initialHealth,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/health");
      return res.json();
    },
  });

  const entries = Object.entries(health || initialHealth);

  // Quick summary: count of green/yellow/red
  const okCount = entries.filter(([, v]) => v.status === "ok").length;
  const allOk = okCount === entries.length;

  return (
    <div className="border-t bg-card" data-testid="panel-system-health">
      <button
        className="w-full flex items-center justify-between px-6 py-2 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid="button-toggle-health"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium uppercase tracking-wider">System Health</span>
          <div className="flex items-center gap-1.5">
            {entries.map(([name, item]) => (
              <StatusDot key={name} status={item.status} />
            ))}
          </div>
          {allOk && <span className="text-green-600">All systems operational</span>}
          {!allOk && (
            <span className="text-yellow-600">
              {entries.length - okCount} service{entries.length - okCount > 1 ? "s" : ""} need attention
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
      </button>
      {expanded && (
        <div className="px-6 pb-3 pt-1">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {entries.map(([name, item]) => (
              <div
                key={name}
                className="flex items-center gap-2 text-xs"
                data-testid={`health-${name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <StatusDot status={item.status} />
                <div>
                  <span className="font-medium text-foreground">{name}</span>
                  <span className="text-muted-foreground ml-1.5">
                    {formatAge(item.age_minutes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
