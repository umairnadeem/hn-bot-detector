import { Verdict } from "@/lib/types";

export function VerdictBadge({
  verdict,
  confidence,
}: {
  verdict: Verdict;
  confidence: number;
}) {
  const styles: Record<Verdict, string> = {
    "LIKELY BOT": "bg-red-500/20 text-red-400 border-red-500/30",
    "POSSIBLY BOT": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "LIKELY HUMAN": "bg-green-500/20 text-green-400 border-green-500/30",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${styles[verdict]}`}
    >
      <span>{verdict}</span>
      <span className="text-xs opacity-75">{confidence}% confidence</span>
    </div>
  );
}
