import { Link } from "react-router-dom";
import type { Task, TaskState } from "@/api/types";
import { useTasks } from "@/hooks/queries";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Panel, SectionTitle, ProgressBar, Skeleton, EmptyState, ErrorState } from "@/components/ui";
import { StatusPill, ProvenanceTag } from "@/components/badges";
import { cx, pct, timeOf } from "@/lib/format";
import { IconChevron, IconClock, IconTasks } from "@/components/icons";

const STATE_TONE: Record<TaskState, "ok" | "warn" | "danger" | "muted" | "info"> = {
  SCHEDULED: "muted",
  STARTED: "info",
  IN_PROGRESS: "info",
  AT_RISK: "warn",
  DELAYED: "danger",
  COMPLETED: "ok",
  CANCELLED: "muted",
};

export default function Tasks() {
  const tasks = useTasks();
  const { etaUpdates } = useWebSocket();

  const groups = groupByState(tasks.data ?? []);

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Today · 4 tasks" title="Daily task schedule" />

      {tasks.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : tasks.isError ? (
        <ErrorState onRetry={() => tasks.refetch()} />
      ) : (tasks.data?.length ?? 0) === 0 ? (
        <EmptyState title="No tasks scheduled" icon={<IconTasks />} hint="Assigned tasks for the shift will show up here." />
      ) : (
        <div className="space-y-8">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <div className="eyebrow mb-3">{label}</div>
              <div className="space-y-3">
                {items.map((t) => (
                  <TaskRow key={t.id} task={t} override={etaUpdates[t.id]?.predicted_eta} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, override }: { task: Task; override?: string }) {
  const predicted = override ?? task.predicted_eta;
  const moved = predicted !== task.original_eta;
  const done = task.state === "COMPLETED";
  return (
    <Link to={`/tasks/${task.id}`} className="block">
      <Panel className="group p-4 transition-all hover:border-cat/30 hover:shadow-pop">
        <div className="flex items-center gap-4">
          <div className={cx("h-12 w-1.5 shrink-0 rounded-full", done ? "bg-ok" : task.state === "AT_RISK" ? "bg-sev-warning" : "bg-cat")} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-fg-faint">{task.id}</span>
              <StatusPill label={task.state.replace("_", " ")} tone={STATE_TONE[task.state]} />
              {task.priority === "HIGH" && <span className="chip bg-sev-high/12 text-sev-high ring-1 ring-sev-high/30">High priority</span>}
            </div>
            <h3 className="mt-1 truncate text-base font-semibold text-fg">{task.title}</h3>
            <div className="mt-2 max-w-md">
              <ProgressBar value={task.progress} tone={done ? "ok" : task.state === "AT_RISK" ? "warning" : "cat"} />
            </div>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <div className="flex items-center justify-end gap-1.5 text-xs text-fg-muted">
              <IconClock width={13} height={13} /> ETA
            </div>
            <div className={cx("font-display text-lg tabular-nums", moved ? "text-sev-warning" : "text-fg")}>{timeOf(predicted)}</div>
            {moved && <div className="text-[11px] text-sev-warning">was {timeOf(task.original_eta)}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <div className="font-display text-lg text-fg">{pct(task.progress)}</div>
              <ProvenanceTag provenance={task.eta_provenance} />
            </div>
            <IconChevron className="text-fg-faint transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Panel>
    </Link>
  );
}

function groupByState(tasks: Task[]) {
  const active = tasks.filter((t) => ["IN_PROGRESS", "AT_RISK", "STARTED", "DELAYED"].includes(t.state));
  const upcoming = tasks.filter((t) => ["SCHEDULED"].includes(t.state));
  const done = tasks.filter((t) => ["COMPLETED", "CANCELLED"].includes(t.state));
  return [
    { label: "In progress", items: active },
    { label: "Upcoming", items: upcoming },
    { label: "Completed", items: done },
  ].filter((g) => g.items.length > 0);
}
