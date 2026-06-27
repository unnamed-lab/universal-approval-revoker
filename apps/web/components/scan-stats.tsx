import type { Approval } from "@uar/shared";

interface Props {
  approvals: Approval[];
}

export function ScanStats({ approvals }: Props) {
  const highRiskCount = approvals.filter((a) => a.risk.level === "high").length;
  const mediumRiskCount = approvals.filter((a) => a.risk.level === "medium").length;
  const lowRiskCount = approvals.filter((a) => a.risk.level === "low").length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        label="High Risk"
        count={highRiskCount}
        color="text-red-400"
        bg="bg-red-500/10 border-red-500/20"
      />
      <StatCard
        label="Medium Risk"
        count={mediumRiskCount}
        color="text-yellow-400"
        bg="bg-yellow-500/10 border-yellow-500/20"
      />
      <StatCard
        label="Safe"
        count={lowRiskCount}
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
