import type { PriorityItem } from "@shared/schema";
import { ExternalLink, AlertCircle, Clock, FileText, StickyNote, UserCheck } from "lucide-react";

interface Props {
  priorities: PriorityItem[];
}

const TYPE_ICON: Record<string, React.ElementType> = {
  resume_gap: FileText,
  stalled_interview: Clock,
  stale_screen: AlertCircle,
  awaiting_notes: StickyNote,
  follow_up: UserCheck,
};

const URGENCY_STYLES: Record<string, { dot: string; badge: string; row: string }> = {
  high: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border border-red-200",
    row: "hover:bg-red-50/40",
  },
  normal: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    row: "hover:bg-amber-50/30",
  },
  low: {
    dot: "bg-slate-300",
    badge: "bg-slate-50 text-slate-600 border border-slate-200",
    row: "hover:bg-muted/30",
  },
};

export function TodaysPriorities({ priorities }: Props) {
  if (!priorities?.length) {
    return (
      <div className="bg-card border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-semibold text-foreground">Today's Priorities</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">0 items</span>
        </div>
        <p className="text-sm text-muted-foreground">Nothing urgent — pipeline is clean.</p>
      </div>
    );
  }

  const high = priorities.filter(p => p.urgency === "high");
  const rest = priorities.filter(p => p.urgency !== "high");

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/20">
        <span className="text-sm font-semibold text-foreground">Today's Priorities</span>
        {high.length > 0 && (
          <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
            {high.length} urgent
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{priorities.length} total</span>
      </div>
      <div className="divide-y">
        {priorities.map((item, i) => {
          const styles = URGENCY_STYLES[item.urgency];
          const Icon = TYPE_ICON[item.type] || AlertCircle;
          return (
            <div
              key={i}
              className={`flex items-start gap-3 px-5 py-3 transition-colors ${styles.row}`}
            >
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${styles.dot}`} />
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.sub}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles.badge}`}>
                  {item.urgency}
                </span>
                {item.rf_link && (
                  <a
                    href={item.rf_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
