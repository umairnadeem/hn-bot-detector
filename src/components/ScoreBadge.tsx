export function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 60
      ? "score-red"
      : score >= 30
        ? "score-yellow"
        : "score-green";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {score}
    </span>
  );
}
