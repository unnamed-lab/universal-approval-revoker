import type { ScanResponse } from "@uar/shared";

interface Props {
  data: ScanResponse;
}

export function ScanStats({ data }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        label="High Risk"
        count={data.highRiskCount}
        color="text-red-400"
        bg="bg-red-500/10 border-red-500/20"
      />
      <StatCard
        label="Medium Risk"
        count={data.mediumRiskCount}
        color="text-yellow-400"
        bg="bg-yellow-500/10 border-yellow-500/20"
      />
      <StatCard
        label="Safe"
        count={data.lowRiskCount}
        color="text-green-400"
        bg="bg-green-500/10 border-green-500/20"
      />
    </div>
  );
}

function StatCard({
  label,
  count,
  color,
  bg,
}: {
  label: string;
  count: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl border p-4 text-center ${bg}`}>
      <div className={`text-3xl font-bold tabular-nums ${color}`}>{count}</div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  );
}
