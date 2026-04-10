import type { ResumeGap } from "@shared/schema";
import { ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { SectionHeader } from "./submission-readiness";

interface ResumeGapsProps {
  resumeGaps: ResumeGap[];
}

// Stage urgency — candidates past screen missing docs
const STAGE_URGENCY: Record<string, number> = {
  "Offer": 5,
  "Client Interview": 4,
  "Sent to Client": 3,
  "Sent to client for review": 3,
  "Client Submission": 2,
  "Ready for Company Submission": 2,
  "Ready for Client Submission": 2,
};

export function ResumeGapsPanel({ resumeGaps }: ResumeGapsProps) {
  // Sort by urgency
  const sorted = [...resumeGaps].sort((a, b) => {
    const ua = STAGE_URGENCY[a.stage] || 1;
    const ub = STAGE_URGENCY[b.stage] || 1;
    return ub - ua;
  });

  return (
    <div className="space-y-3">
      <SectionHeader title="Missing Documents" count={resumeGaps.length} subtitle="Recruiter Screen" />
      {resumeGaps.length === 0 ? (
        <div className="bg-card border rounded-lg p-4 text-sm text-muted-foreground">
          All candidates in Recruiter Screen have a resume on file.
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Candidate</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Client / Role</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Stage</th>
                <th className="px-3 py-2 font-medium text-muted-foreground text-center">Resume</th>
                <th className="px-3 py-2 font-medium text-muted-foreground text-center">Exec</th>
                <th className="px-3 py-2 font-medium text-muted-foreground text-center">RF</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr
                  key={`${c.rf_id}-${c.stage}`}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  data-testid={`gap-${c.rf_id}`}
                >
                  <td className="px-4 py-2.5 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <span className="font-medium text-foreground">{c.client}</span>
                    <span className="mx-1 text-muted-foreground/50">·</span>
                    {c.role}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: "hsl(184, 48%, 94%)", color: "hsl(191, 43%, 20%)" }}>
                      {c.stage}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {c.has_resume
                      ? <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                      : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {c.has_exec
                      ? <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                      : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <a href={c.rf_link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center hover:text-primary transition-colors text-muted-foreground"
                      data-testid={`link-gap-${c.rf_id}`}>
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
