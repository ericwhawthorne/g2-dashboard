import type { SubmissionRole } from "@shared/schema";
import { CheckCircle2, XCircle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SubmissionReadinessProps {
  submissionReady: Record<string, SubmissionRole>;
}

export function SubmissionReadiness({ submissionReady }: SubmissionReadinessProps) {
  const roles = Object.entries(submissionReady);
  if (roles.length === 0) {
    return (
      <div className="space-y-3">
        <SectionHeader title="Submission Readiness" count={0} />
        <div className="bg-card border rounded-lg p-4 text-sm text-muted-foreground">
          No candidates at Client Submission stage.
        </div>
      </div>
    );
  }

  const totalCandidates = roles.reduce((sum, [, r]) => sum + r.candidates.length, 0);

  return (
    <div className="space-y-3">
      <SectionHeader title="Submission Readiness" count={totalCandidates} subtitle="At Client Submission" />
      <div className="space-y-2">
        {roles.map(([jobId, role]) => (
          <SubmissionRoleCard key={jobId} role={role} />
        ))}
      </div>
    </div>
  );
}

function SubmissionRoleCard({ role }: { role: SubmissionRole }) {
  const [expanded, setExpanded] = useState(true);
  const readyCount = role.candidates.filter((c) => c.has_resume && c.has_exec).length;

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
        data-testid={`toggle-role-${role.role}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">{role.role}</span>
          <span className="text-xs text-muted-foreground shrink-0">— {role.client}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: readyCount === role.candidates.length ? "hsl(184, 48%, 88%)" : "hsl(43, 96%, 92%)", color: "hsl(191, 43%, 20%)" }}>
            {readyCount}/{role.candidates.length} ready
          </span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Candidate</th>
                <th className="px-3 py-2 font-medium text-muted-foreground text-center">Resume</th>
                <th className="px-3 py-2 font-medium text-muted-foreground text-center">Exec Summary</th>
                <th className="px-3 py-2 font-medium text-muted-foreground text-center">RF</th>
              </tr>
            </thead>
            <tbody>
              {role.candidates.map((c) => (
                <tr key={c.rf_id} className="border-b last:border-0 hover:bg-muted/20 transition-colors" data-testid={`submission-candidate-${c.rf_id}`}>
                  <td className="px-4 py-2 font-medium text-foreground">{c.name}</td>
                  <td className="px-3 py-2 text-center">
                    {c.has_resume
                      ? <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                      : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {c.has_exec
                      ? <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                      : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <a href={c.rf_link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center hover:text-primary transition-colors text-muted-foreground"
                      data-testid={`link-rf-${c.rf_id}`}>
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

export function SectionHeader({ title, count, subtitle }: { title: string; count: number; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h2>
      <span className="text-xs px-1.5 py-0.5 rounded font-medium tabular-nums"
        style={{ backgroundColor: "hsl(184, 48%, 94%)", color: "hsl(191, 43%, 20%)" }}>
        {count}
      </span>
      {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
    </div>
  );
}
