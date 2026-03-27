import type { RecentReply } from "@shared/schema";
import { MessageSquare } from "lucide-react";

interface ActivityFeedProps {
  replies: RecentReply[];
}

export function ActivityFeed({ replies }: ActivityFeedProps) {
  return (
    <div className="bg-card border rounded-lg" data-testid="panel-activity-feed">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <MessageSquare className="h-4 w-4" style={{ color: "#1D424A" }} />
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Recent Replies
        </h2>
        <span className="ml-auto text-xs text-muted-foreground">Past 7 days</span>
      </div>
      <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
        {replies.length === 0 ? (
          <div className="py-6 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No recent replies</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {replies.map((reply, idx) => (
              <li
                key={`${reply.name}-${reply.timestamp}-${idx}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                data-testid={`reply-${idx}`}
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ backgroundColor: "#E8F6F7", color: "#1D424A" }}
                >
                  {getInitials(reply.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{reply.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {reply.client && reply.role
                      ? `${reply.client} — ${reply.role}`
                      : reply.client || reply.role || "Campaign reply"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {formatDate(reply.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

function formatDate(ts: string): string {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return ts;
  }
}
