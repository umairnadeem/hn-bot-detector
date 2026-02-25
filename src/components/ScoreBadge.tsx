export function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 60
      ? "#ff0000"
      : score >= 30
        ? "#ff6600"
        : "#828282";

  return (
    <span style={{ color, fontWeight: "bold", fontSize: "13px" }}>
      [score: {score}]
    </span>
  );
}
