import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFuel, useProductivity } from "@/hooks/queries";
import { Panel, SectionTitle, StatTile, Skeleton } from "@/components/ui";
import { ProvenanceTag } from "@/components/badges";
import { WhatWhyAction } from "@/components/WhatWhyAction";
import { IconFuel, IconGauge, IconClock, IconBolt } from "@/components/icons";

export default function Analytics() {
  const fuel = useFuel();
  const prod = useProductivity();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle eyebrow="Analytics" title="Fuel & productivity" />
        <p className="max-w-xs text-right text-xs text-fg-faint">
          Context for the operator — not a BI dashboard. Every number is labelled by provenance.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {prod.isLoading || fuel.isLoading ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatTile label="Cycles / hour" value={prod.data?.cycles_per_hour ?? "—"} icon={<IconGauge width={16} height={16} />} sub="Load cycles completed" />
            <StatTile
              label="Idle percentage"
              value={prod.data ? `${prod.data.idle_percentage}` : "—"}
              unit="%"
              accent={(prod.data?.idle_percentage ?? 0) > 25 ? "text-sev-warning" : "text-fg"}
              icon={<IconClock width={16} height={16} />}
              sub="Engine-on time spent idle"
            />
            <StatTile label="Fuel / hour" value={fuel.data?.fuel_per_hour ?? "—"} unit="L" icon={<IconFuel width={16} height={16} />} sub={`Idle est. ${fuel.data?.idle_fuel_estimate ?? "—"} L`} />
            <StatTile
              label="Productive time"
              value={prod.data ? `${prod.data.productive_time_pct}` : "—"}
              unit="%"
              accent="text-ok"
              icon={<IconBolt width={16} height={16} />}
              sub="Of engine-on time"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionTitle
            eyebrow="Today"
            title="Cycles vs idle time"
            right={prod.data && <ProvenanceTag provenance={prod.data.provenance} />}
          />
          {prod.isLoading || !prod.data ? (
            <Skeleton className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={prod.data.trend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="gCycles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFCD11" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FFCD11" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2431" vertical={false} />
                <XAxis dataKey="t" stroke="#5C6a7d" fontSize={11} tickLine={false} axisLine={{ stroke: "#232A36" }} />
                <YAxis stroke="#5C6a7d" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#12161F",
                    border: "1px solid #232A36",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#E7ECF3",
                  }}
                  labelStyle={{ color: "#93A0B4" }}
                  cursor={{ stroke: "#2A3242" }}
                />
                <Area type="monotone" dataKey="cycles" name="Cycles/h" stroke="#FFCD11" strokeWidth={2.4} fill="url(#gCycles)" />
                <Line type="monotone" dataKey="idle" name="Idle %" stroke="#F5A623" strokeWidth={2} dot={false} strokeDasharray="4 3" />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-fg-muted">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded bg-cat" /> Cycles / hour</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-sev-warning" /> Idle %</span>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <SectionTitle eyebrow="Fuel efficiency" title="Insight" right={<IconFuel className="text-fg-faint" />} />
            {fuel.data && <WhatWhyAction explanation={fuel.data.insight} provenance={fuel.data.provenance} tone="warning" />}
          </Panel>
          <Panel>
            <SectionTitle eyebrow="Productivity" title="Insight" />
            {prod.data && <WhatWhyAction explanation={prod.data.insight} provenance={prod.data.provenance} tone="info" />}
          </Panel>
        </div>
      </div>
    </div>
  );
}
