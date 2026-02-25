"use client";

export function HighlightedText({
  text,
  phrases,
}: {
  text: string;
  phrases: { phrase: string }[];
}) {
  if (phrases.length === 0) return <>{text}</>;

  const patterns = phrases.map((p) =>
    p.phrase
      .replace(/^Sentence starting with "/, "")
      .replace(/"$/, "")
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const regex = new RegExp(`(${patterns.join("|")})`, "gi");

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        if (regex.test(part)) {
          return <mark key={i}>{part}</mark>;
        }
        regex.lastIndex = 0;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
