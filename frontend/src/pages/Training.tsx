import { useState } from "react";
import { useTraining, OP } from "@/hooks/queries";
import { api } from "@/api";
import { Panel, SectionTitle, ProgressBar, Skeleton, EmptyState } from "@/components/ui";
import { StatusPill, ProvenanceTag } from "@/components/badges";
import { cx } from "@/lib/format";
import { IconClipboard, IconSpark, IconWorker, IconCheck } from "@/components/icons";
import type { TrainingRecord, TrainingStatus } from "@/api/types";

const STATUS_TONE: Record<TrainingStatus, "ok" | "warn" | "info" | "muted"> = {
  COMPLETED: "ok",
  IN_PROGRESS: "info",
  RECOMMENDED: "warn",
  NOT_STARTED: "muted",
};

const FORMAT_ICON = (f?: TrainingRecord["format"]) =>
  f === "SIMULATION" ? <IconSpark width={16} height={16} /> :
  f === "INSTRUCTOR" ? <IconWorker width={16} height={16} /> :
  <IconClipboard width={16} height={16} />;

export default function Training() {
  const training = useTraining();
  const [booked, setBooked] = useState<Set<string>>(new Set());

  const recommended = training.data?.filter((t) => t.status === "RECOMMENDED") ?? [];
  const rest = training.data?.filter((t) => t.status !== "RECOMMENDED") ?? [];

  const book = async (moduleId: string) => {
    await api.bookInstructor(moduleId, OP, new Date(Date.now() + 2 * 86400000).toISOString());
    setBooked((s) => new Set(s).add(moduleId));
  };

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Training hub" title="Learning & certification" />

      {training.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (training.data?.length ?? 0) === 0 ? (
        <EmptyState title="No training modules" icon={<IconClipboard />} />
      ) : (
        <>
          {recommended.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cat" />
                <span className="eyebrow">Recommended for you — based on recent operating patterns</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {recommended.map((m) => (
                  <ModuleCard key={m.module_id} module={m} highlight booked={booked.has(m.module_id)} onBook={() => book(m.module_id)} />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="eyebrow mb-3">All modules</div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rest.map((m) => (
                <ModuleCard key={m.module_id} module={m} booked={booked.has(m.module_id)} onBook={() => book(m.module_id)} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ModuleCard({
  module,
  highlight,
  booked,
  onBook,
}: {
  module: TrainingRecord;
  highlight?: boolean;
  booked: boolean;
  onBook: () => void;
}) {
  return (
    <Panel className={cx("flex flex-col", highlight && "border-cat/30 bg-cat/[0.03]")}>
      <div className="flex items-start justify-between gap-3">
        <span className={cx("grid h-10 w-10 place-items-center rounded-xl", highlight ? "bg-cat/15 text-cat" : "bg-ink-600 text-fg-muted")}>
          {FORMAT_ICON(module.format)}
        </span>
        <StatusPill label={module.status.replace("_", " ")} tone={STATUS_TONE[module.status]} />
      </div>
      <h3 className="mt-3 text-base font-semibold text-fg">{module.title}</h3>
      <div className="mt-1 flex items-center gap-2 text-xs text-fg-faint">
        <span>{module.format ?? "VIDEO"}</span>
        {module.duration_min && <span>· {module.duration_min} min</span>}
      </div>

      <div className="mt-3 rounded-lg border border-line bg-ink-600/50 px-3 py-2 text-xs text-fg-muted">
        <span className="font-semibold text-fg">Why · </span>
        {module.reason}
      </div>

      {module.completion > 0 && module.completion < 1 && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-fg-muted">
            <span>Progress</span>
            <span>{Math.round(module.completion * 100)}%</span>
          </div>
          <ProgressBar value={module.completion} tone="cat" />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 pt-1">
        <ProvenanceTag provenance={module.provenance} />
        {module.status === "COMPLETED" ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-ok">
            <IconCheck width={14} height={14} /> Certified
          </span>
        ) : module.format === "INSTRUCTOR" || module.status === "RECOMMENDED" ? (
          booked ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ok">
              <IconCheck width={14} height={14} /> Instructor booked
            </span>
          ) : (
            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={onBook}>
              Book instructor
            </button>
          )
        ) : (
          <button className="btn-primary px-3 py-1.5 text-xs">{module.completion > 0 ? "Resume" : "Start"}</button>
        )}
      </div>
    </Panel>
  );
}
