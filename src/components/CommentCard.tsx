"use client";

import { useMemo, useState, useCallback } from "react";
import { CommentAnalysis } from "@/lib/types";
import { HighlightedText } from "./HighlightedText";
import { ScoreBadge } from "./ScoreBadge";

export function CommentCard({ analysis }: { analysis: CommentAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const { comment, score, breakdown, flaggedPhrases, cleanText } = analysis;

  const date = useMemo(
    () =>
      new Date(comment.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [comment.created_at]
  );

  const handleExpand = useCallback(() => setExpanded(true), []);

  return (
    <div style={{ borderBottom: "1px solid #e0e0e0", padding: "6px 0" }}>
      <div style={{ marginBottom: "4px" }}>
        <a
          href={`https://news.ycombinator.com/user?id=${comment.author}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#ff6600", fontWeight: "bold" }}
        >
          {comment.author}
        </a>
        <span style={{ color: "#828282", marginLeft: "8px", fontSize: "12px" }}>
          {date}
        </span>
        {comment.story_title && (
          <span
            style={{ color: "#828282", marginLeft: "8px", fontSize: "12px" }}
            title={comment.story_title}
          >
            on: {comment.story_title}
          </span>
        )}
        <span style={{ float: "right" }}>
          <ScoreBadge score={score} />
        </span>
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#000",
          whiteSpace: "pre-wrap",
          marginBottom: "4px",
          fontFamily: "Verdana, Geneva, sans-serif",
        }}
      >
        {cleanText.length > 300 && !expanded ? (
          <>
            <HighlightedText
              text={cleanText.slice(0, 300) + "..."}
              phrases={flaggedPhrases}
            />
            <span
              onClick={handleExpand}
              style={{
                color: "#ff6600",
                cursor: "pointer",
                marginLeft: "4px",
              }}
            >
              [more]
            </span>
          </>
        ) : (
          <HighlightedText text={cleanText} phrases={flaggedPhrases} />
        )}
      </div>

      {flaggedPhrases.length > 0 && (
        <div style={{ marginBottom: "4px" }}>
          {flaggedPhrases.map((fp) => (
            <span
              key={fp.phrase}
              style={{
                color: "#ff6600",
                fontSize: "12px",
                marginRight: "8px",
              }}
            >
              &quot;{fp.phrase}&quot; (+{fp.points})
            </span>
          ))}
        </div>
      )}

      {breakdown.details.length > 0 && (
        <details style={{ fontSize: "12px", color: "#828282" }}>
          <summary style={{ cursor: "pointer" }}>scoring breakdown</summary>
          <ul style={{ marginTop: "4px", paddingLeft: "20px" }}>
            {breakdown.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
