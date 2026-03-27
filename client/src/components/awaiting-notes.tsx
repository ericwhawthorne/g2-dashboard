import type { AwaitingNote } from "@shared/schema";
import { AlertCircle, ClipboardList } from "lucide-react";

interface AwaitingNotesPanelProps {
  notes: AwaitingNote[];
}

export function AwaitingNotesPanel({ notes }: AwaitingNotesPanelProps) {
  return (
    <div className="bg-card border rounded-lg" data-testid="panel-awaiting-notes">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <AlertCircle className="h-4 w-4" style={{ color: "#1D424A" }} />
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Awaiting Notes
        </h2>
        {notes.length > 0 && (
          <span
            className="ml-auto inline-flex items-center justify-center h-5 w-5 text-xs font-bold rounded-full"
            style={{ backgroundColor: "#ADDADF", color: "#1D424A" }}
            data-testid="text-awaiting-count"
          >
            {notes.length}
          </span>
        )}
      </div>
      <div className="p-2">
        {notes.length === 0 ? (
          <div className="py-6 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">All notes up to date</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notes.map((note, idx) => (
              <li
                key={`${note.name}-${idx}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors"
                data-testid={`awaiting-note-${idx}`}
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: "#ADDADF" }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{note.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {note.client !== "unknown" && note.client !== "Unknown"
                      ? `${note.client} — ${note.role !== "unknown" && note.role !== "Unknown" ? note.role : "Role TBD"}`
                      : "Client / role TBD"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
