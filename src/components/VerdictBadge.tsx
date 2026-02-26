import { memo } from "react";
import { Verdict } from "@/lib/types";

export const VerdictBadge = memo(function VerdictBadge({
  verdict,
  confidence,
}: {
  verdict: Verdict;
  confidence: number;
}) {
  const color: Record<Verdict, string> = {
    "LIKELY BOT": "#ff0000",
    "POSSIBLY BOT": "#ff6600",
    "LIKELY HUMAN": "#228B22",
  };

  return (
    <span style={{ color: color[verdict], fontWeight: "bold", fontSize: "13px" }}>
      {verdict} ({confidence}%)
    </span>
  );
});
