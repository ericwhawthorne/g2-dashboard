import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { DashboardData } from "@shared/schema";
import { KPIBar } from "@/components/kpi-bar";
import { PipelineOverview } from "@/components/pipeline-overview";
import { AwaitingNotesPanel } from "@/components/awaiting-notes";
import { ActivityFeed } from "@/components/activity-feed";
import { SubmissionReadiness } from "@/components/submission-readiness";
import { RecentlyMovedPanel } from "@/components/recently-moved";
import { StaleScreenPanel } from "@/components/stale-screen";
import { ResumeGapsPanel } from "@/components/resume-gaps";
import { FollowUpNeededPanel } from "@/components/follow-up-needed";
import { StalledInterviewsPanel } from "@/components/stalled-interviews";
import { EffectivenessPanel } from "@/components/effectiveness-panel";
import { CronHealthPanel } from "@/components/cron-health-panel";
import { TodaysPriorities } from "@/components/todays-priorities";
import { ClientHealthPanel } from "@/components/client-health";
import { BdPipelinePanel } from "@/components/bd-pipeline";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";

type TabId = "today" | "pipeline" | "clients" | "gaps" | "followups" | "effectiveness";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "today",         label: "Today" },
  { id: "pipeline",      label: "Pipeline" },
  { id: "clients",       label: "Clients" },
  { id: "gaps",          label: "Gaps & Alerts" },
  { id: "followups",     label: "Follow-Ups" },
  { id: "effectiveness", label: "Effectiveness" },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("today");

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

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">Check the API connection and try again</p>
          <button onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const updatedAgo = dataUpdatedAt ? formatTimeAgo(dataUpdatedAt) : "";
  const alertCount = (data.summary.stale_screen_count || 0) +
    (data.summary.resume_gaps_count || 0) +
    (data.summary.stalled_interviews_count || 0);
  const priorityCount = (data.priorities || []).filter(p => p.urgency === "high").length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Recruiting Operations</h1>
          {updatedAgo && <p className="text-xs text-muted-foreground">Updated {updatedAgo}</p>}
        </div>
        <button onClick={handleRefresh} disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border hover:bg-accent">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <KPIBar summary={data.summary} />

      <div className="flex border-b bg-card shrink-0 px-6">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {tab.label}
            {tab.id === "today" && priorityCount > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">
                {priorityCount}
              </span>
            )}
            {tab.id === "gaps" && alertCount > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6">

          {activeTab === "today" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <TodaysPriorities priorities={data.priorities || []} />
                <StalledInterviewsPanel items={data.stalled_interviews || []} />
              </div>
              <div className="space-y-4">
                <RecentlyMovedPanel recentlyMoved={data.recently_moved} />
                <AwaitingNotesPanel notes={data.awaiting_notes} />
              </div>
            </div>
          )}

          {activeTab === "pipeline" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <PipelineOverview pipeline={data.pipeline} />
              </div>
              <div className="space-y-4">
                <SubmissionReadiness submissionReady={data.submission_ready} />
                <RecentlyMovedPanel recentlyMoved={data.recently_moved} />
              </div>
            </div>
          )}

          {activeTab === "clients" && (
            <div className="space-y-6">
              <ClientHealthPanel clients={data.client_health || []} />
              <BdPipelinePanel replies={data.bd_replies || []} />
            </div>
          )}

          {activeTab === "gaps" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-4">
                <StalledInterviewsPanel items={data.stalled_interviews || []} />
                <StaleScreenPanel staleScreen={data.stale_screen} />
              </div>
              <div className="space-y-4">
                <ResumeGapsPanel resumeGaps={data.resume_gaps} />
                <AwaitingNotesPanel notes={data.awaiting_notes} />
              </div>
            </div>
          )}

          {activeTab === "followups" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <FollowUpNeededPanel followUps={data.follow_ups} />
              <CronHealthPanel items={data.cron_health || []} />
            </div>
          )}

          {activeTab === "effectiveness" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <EffectivenessPanel data={data.effectiveness} />
              <div className="space-y-4">
                <ActivityFeed replies={data.recent_replies} />
                <CronHealthPanel items={data.cron_health || []} />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function DashboardSkeleton() {
  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-8 gap-2">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
      <div className="grid grid-cols-3 gap-6 flex-1">
        <div className="col-span-2 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    </div>
  );
}
