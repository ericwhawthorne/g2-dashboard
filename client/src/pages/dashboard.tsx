import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { DashboardData } from "@shared/schema";
import { KPIBar } from "@/components/kpi-bar";
import { PipelineOverview } from "@/components/pipeline-overview";
import { AwaitingNotesPanel } from "@/components/awaiting-notes";
import { ActivityFeed } from "@/components/activity-feed";
import { SystemHealth } from "@/components/system-health";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const { data, isLoading, isError, isFetching, dataUpdatedAt } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard");
      return res.json();
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">Check the API connection and try again</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
            data-testid="button-retry"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const updatedAgo = dataUpdatedAt
    ? formatTimeAgo(dataUpdatedAt)
    : "";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground" data-testid="text-page-title">
            Recruiting Operations
          </h1>
          <p className="text-xs text-muted-foreground" data-testid="text-updated-at">
            {updatedAgo ? `Updated ${updatedAgo}` : ""}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="p-2 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          data-testid="button-refresh"
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 text-muted-foreground ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPI Bar */}
      <div className="shrink-0">
        <KPIBar summary={data.summary} />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          {/* Pipeline + Sidebar */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
            <PipelineOverview pipeline={data.pipeline} />
            <div className="space-y-6">
              <AwaitingNotesPanel notes={data.awaiting_notes} />
              <ActivityFeed replies={data.recent_replies} />
            </div>
          </div>
        </div>
      </div>

      {/* System Health footer */}
      <div className="shrink-0">
        <SystemHealth health={data.system_health} />
      </div>
    </div>
  );
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function DashboardSkeleton() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-3 border-b bg-card shrink-0">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3 w-24 mt-1" />
      </div>
      <div className="px-6 py-4 shrink-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
