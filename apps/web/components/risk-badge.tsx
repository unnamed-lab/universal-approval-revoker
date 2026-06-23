import type { RiskLevel } from "@uar/shared";

const styles: Record<RiskLevel, string> = {
  high: "bg-red-500/20 text-red-400 border border-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border border-green-500/30",
};

const labels: Record<RiskLevel, string> = {
  high: "High Risk",
  medium: "Medium Risk",
  low: "Safe",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[level]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${level === "high" ? "bg-red-400" : level === "medium" ? "bg-yellow-400" : "bg-green-400"}`}
      />
      {labels[level]}
    </span>
  );
}
