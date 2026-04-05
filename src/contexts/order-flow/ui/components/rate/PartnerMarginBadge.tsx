import { TrendingDown, TrendingUp } from "lucide-react";

interface PartnerMarginBadgeProps {
  partnerTotal: number;
  hqTotal: number;
}

export function PartnerMarginBadge({ partnerTotal, hqTotal }: PartnerMarginBadgeProps) {
  const margin = partnerTotal - hqTotal;
  const isPositive = margin >= 0;

  return (
    <div className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${isPositive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
      <div className="flex items-center gap-1.5">
        {isPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
        <span className="font-medium">Margen</span>
      </div>
      <span className="font-bold">{isPositive ? "+" : ""}${margin.toFixed(2)}</span>
    </div>
  );
}
