import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StalledInterview } from "@shared/schema";

export function StalledInterviewsPanel({ items }: { items: StalledInterview[] }) {
  if (!items?.length) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          Stalled at Client Interview
          <span className="ml-auto text-xs font-normal text-muted-foreground bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {items.map((c) => (
            <div key={c.rf_id} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div>
                <a href={c.rf_link} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline text-foreground">
                  {c.name}
                </a>
                <p className="text-xs text-muted-foreground">{c.client} / {c.role}</p>
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0 ml-2">
                {c.biz_days}d
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
