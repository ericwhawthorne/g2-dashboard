import type { StaleScreen } from "@shared/schema";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { SectionHeader } from "./submission-readiness";

interface StaleScreenProps {
  staleScreen: StaleScreen[];
}

function staleBadgeStyle(biz_days: number) {
  if (biz_days >= 10) return { backgroundColor: "hsl(0, 85%, 93%)", color: "hsl(0, 72%, 35%)" };
  if (biz_days >= 7) return { backgroundColor: "hsl(25, 95%, 92%)", color: "hsl(25, 72%, 35%)" };
  return { backgroundColor: "hsl(43, 96%, 92%)", color: "hsl(43, 72%, 35%)" };
}

export function StaleScreenPanel({ staleScreen }: StaleScreenProps) {
  // Group by client+role
  const groups: Record<string, { client: string; role: string; candidates: StaleScreen[] }> = {};
  for (const c of staleScreen) {
    const key = `${c.client}::${c.role}`;
    if (!groups[key]) groups[key] = { client: c.client, role: c.role, candidates: [] };
    groups[key].candidates.push(c);
  }

  return (
    <div className="space-y-3">
      <SectionHeader title="Stale Recruiter Screen" count={staleScreen.length} subtitle="3+ business days" />
      {staleScreen.length === 0 ? (
        <div className="bg-card border rounded-lg p-4 text-sm text-muted-foreground">
          No candidates stuck in Recruiter Screen.
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(groups).map(([key, group]) => (
            <div key={key} className="bg-card border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(43, 72%, 45%)" }} />
                <span className="text-xs font-semibold text-foreground">{group.client}</span>
                <span className="text-xs text-muted-foreground">— {group.role}</span>
                <span className="ml-auto text-xs font-medium tabular-nums text-muted-foreground">{group.candidates.length} candidate{group.candidates.length !== 1 ? "s" : ""}</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/10">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Candidate</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Entered</th>
                    <th className="px-3 py-2 font-medium text-muted-foreground text-center">Days</th>
                    <th className="px-3 py-2 font-medium text-muted-foreground text-center">RF</th>
                  </tr>
                </thead>
                <tbody>
                  {group.candidates.map((c) => (
                    <tr key={c.rf_id} className="border-b last:border-0 hover:bg-muted/20 transition-colors" data-testid={`stale-${c.rf_id}`}>
                      <td className="px-4 py-2.5 font-medium text-foreground">{c.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{c.entered_at}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold tabular-nums" style={staleBadgeStyle(c.biz_days)}>
                          {c.biz_days}d
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <a href={c.rf_link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center justify-center hover:text-primary transition-colors text-muted-foreground"
                          data-testid={`link-stale-${c.rf_id}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
