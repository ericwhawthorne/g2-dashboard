import type { RecentlyMoved } from "@shared/schema";
import { ExternalLink, ArrowRight } from "lucide-react";
import { SectionHeader } from "./submission-readiness";

interface RecentlyMovedProps {
  recentlyMoved: RecentlyMoved[];
}

export function RecentlyMovedPanel({ recentlyMoved }: RecentlyMovedProps) {
  return (
    <div className="space-y-3">
      <SectionHeader title="Recently Submitted" count={recentlyMoved.length} subtitle="Past 7 days" />
      {recentlyMoved.length === 0 ? (
        <div className="bg-card border rounded-lg p-4 text-sm text-muted-foreground">
          No candidates moved to Client Submission in the past 7 days.
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Candidate</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Client / Role</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date</th>
                <th className="px-3 py-2 font-medium text-muted-foreground text-center">RF</th>
              </tr>
            </thead>
            <tbody>
              {recentlyMoved.map((c) => (
                <tr
                  key={`${c.rf_id}-${c.moved_at}`}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  data-testid={`recently-moved-${c.rf_id}`}
                >
                  <td className="px-4 py-2.5 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <span className="font-medium text-foreground">{c.client}</span>
                    <span className="mx-1 text-muted-foreground/50">·</span>
                    {c.role}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{c.moved_at}</td>
                  <td className="px-3 py-2.5 text-center">
                    <a
                      href={c.rf_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center hover:text-primary transition-colors text-muted-foreground"
                      data-testid={`link-recently-moved-${c.rf_id}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
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
