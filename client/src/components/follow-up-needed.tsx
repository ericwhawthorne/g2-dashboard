import type { FollowUp } from "@shared/schema";
import { Clock } from "lucide-react";
import { SectionHeader } from "./submission-readiness";

interface FollowUpNeededProps {
  followUps: FollowUp[];
}

function daysBadgeStyle(days: number) {
  if (days >= 7) return { backgroundColor: "hsl(0, 85%, 93%)", color: "hsl(0, 72%, 35%)" };
  if (days >= 5) return { backgroundColor: "hsl(25, 95%, 92%)", color: "hsl(25, 72%, 35%)" };
  return { backgroundColor: "hsl(43, 96%, 92%)", color: "hsl(43, 72%, 35%)" };
}

export function FollowUpNeededPanel({ followUps }: FollowUpNeededProps) {
  return (
    <div className="space-y-3">
      <SectionHeader title="Follow-Up Needed" count={followUps.length} subtitle="No booking yet" />
      {followUps.length === 0 ? (
        <div className="bg-card border rounded-lg p-4 text-sm text-muted-foreground">
          No outstanding follow-ups.
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Client / Role</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Sent</th>
                <th className="px-3 py-2 font-medium text-muted-foreground text-center">Days</th>
              </tr>
            </thead>
            <tbody>
              {followUps.map((f, i) => (
                <tr
                  key={`${f.email}-${i}`}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  data-testid={`followup-${i}`}
                >
                  <td className="px-4 py-2.5 font-medium text-foreground truncate max-w-[200px]">{f.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <span className="font-medium text-foreground">{f.client}</span>
                    {f.role && (
                      <>
                        <span className="mx-1 text-muted-foreground/50">·</span>
                        {f.role}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{f.tracked_at}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold tabular-nums"
                      style={daysBadgeStyle(f.biz_days)}>
                      <Clock className="h-2.5 w-2.5" />
                      {f.biz_days}d
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
