"use client";

import { CommentAnalysis } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";
import { useState } from "react";

function highlightPhrases(text: string, phrases: { phrase: string }[]) {
  if (phrases.length === 0) return text;

  // Build a combined regex from all phrase labels
  const patterns = phrases.map((p) =>
    p.phrase
      .replace(/^Sentence starting with "/, "")
      .replace(/"$/, "")
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const regex = new RegExp(`(${patterns.join("|")})`, "gi");

  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (regex.test(part)) {
      return (
        <mark key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
          {part}
        </mark>
      );
    }
    // Reset regex lastIndex
    regex.lastIndex = 0;
    return part;
  });
}

export function CommentCard({ analysis }: { analysis: CommentAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const { comment, score, breakdown, flaggedPhrases, cleanText } = analysis;

  const date = new Date(comment.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-lg border border-[#262626] bg-[#141414] p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <a
            href={`https://news.ycombinator.com/user?id=${comment.author}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-orange-500 hover:text-orange-400"
          >
            {comment.author}
          </a>
          <span>{date}</span>
          {comment.story_title && (
            <span className="truncate max-w-xs" title={comment.story_title}>
              on: {comment.story_title}
            </span>
          )}
        </div>
        <ScoreBadge score={score} />
      </div>

      <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mb-3">
        {cleanText.length > 300 && !expanded ? (
          <>
            {highlightPhrases(
              cleanText.slice(0, 300) + "...",
              flaggedPhrases
            )}
            <button
              onClick={() => setExpanded(true)}
              className="text-orange-500 hover:text-orange-400 ml-1"
            >
              show more
            </button>
          </>
        ) : (
          highlightPhrases(cleanText, flaggedPhrases)
        )}
      </div>

      {flaggedPhrases.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {flaggedPhrases.map((fp, i) => (
            <span
              key={i}
              className="text-xs bg-yellow-500/10 text-yellow-500 rounded px-2 py-0.5"
            >
              {fp.phrase} (+{fp.points})
            </span>
          ))}
        </div>
      )}

      {breakdown.details.length > 0 && (
        <details className="text-xs text-neutral-500">
          <summary className="cursor-pointer hover:text-neutral-400">
            Scoring breakdown
          </summary>
          <ul className="mt-2 space-y-0.5 pl-4">
            {breakdown.details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
