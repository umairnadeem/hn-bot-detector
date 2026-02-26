"use client";

import { useState, useCallback, useMemo } from "react";
import { CommentAnalysis, Verdict } from "@/lib/types";
import { getVerdict } from "@/lib/scoring";
import { CommentCard } from "./CommentCard";
import { ScoreBadge } from "./ScoreBadge";
import { VerdictBadge } from "./VerdictBadge";

interface Commenter {
  username: string;
  averageScore: number;
  verdict: Verdict;
  commentCount: number;
  comments: CommentAnalysis[];
}

export function CommenterList({ commenters }: { commenters: Commenter[] }) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const toggleUser = useCallback((username: string) => {
    setExpandedUser((prev) => (prev === username ? null : username));
  }, []);

  const sortedCommentsMap = useMemo(() => {
    const map = new Map<string, CommentAnalysis[]>();
    for (const commenter of commenters) {
      map.set(
        commenter.username,
        [...commenter.comments].sort((a, b) => b.score - a.score)
      );
    }
    return map;
  }, [commenters]);

  return (
    <div>
      {commenters.map((commenter) => {
        const { confidence } = getVerdict(commenter.averageScore);
        return (
          <div
            key={commenter.username}
            style={{
              border: "1px solid #e0e0e0",
              background: "#fff",
              marginBottom: "2px",
            }}
          >
            <div
              className="hn-commenter-row"
              onClick={() => toggleUser(commenter.username)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  minWidth: 0,
                }}
              >
                <ScoreBadge score={commenter.averageScore} />
                <a
                  href={`https://news.ycombinator.com/user?id=${commenter.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#ff6600", fontWeight: "bold" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {commenter.username}
                </a>
                <span style={{ color: "#828282", fontSize: "12px" }}>
                  {commenter.commentCount} comment
                  {commenter.commentCount !== 1 ? "s" : ""}
                </span>
              </div>
              <VerdictBadge
                verdict={commenter.verdict}
                confidence={confidence}
              />
            </div>

            {expandedUser === commenter.username && (
              <div
                style={{
                  borderTop: "1px solid #e0e0e0",
                  padding: "6px 10px",
                }}
              >
                {(sortedCommentsMap.get(commenter.username) ?? []).map(
                  (analysis) => (
                    <CommentCard
                      key={analysis.comment.objectID}
                      analysis={analysis}
                    />
                  )
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
