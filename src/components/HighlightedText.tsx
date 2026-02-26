"use client";

import { useMemo } from "react";

export function HighlightedText({
  text,
  phrases,
}: {
  text: string;
  phrases: { phrase: string }[];
}) {
  const regex = useMemo(() => {
    if (phrases.length === 0) return null;

    const patterns = phrases.map((p) =>
      p.phrase
        .replace(/^Sentence starting with "/, "")
        .replace(/"$/, "")
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    return new RegExp(`(${patterns.join("|")})`, "gi");
  }, [phrases]);

  if (!regex) return <>{text}</>;

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        const isMatch = regex.test(part);
        regex.lastIndex = 0;
        if (isMatch) {
          return <mark key={i}>{part}</mark>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
