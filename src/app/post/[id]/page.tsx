"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PostAnalysis } from "@/lib/types";
import { CommentCard } from "@/components/CommentCard";
import { VerdictBadge } from "@/components/VerdictBadge";
import { ScoreBadge } from "@/components/ScoreBadge";

export default function PostAnalysisPage() {
  const params = useParams();
  const postId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PostAnalysis | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/analyze/post?id=${encodeURIComponent(postId)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId]);

  function exportJSON() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hn-post-analysis-${result.postId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div style={{ color: "#828282", padding: "10px 0" }}>
        Analyzing post #{postId}...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          color: "#ff0000",
          border: "1px solid #ff0000",
          padding: "6px 10px",
          background: "#fff",
        }}
      >
        {error}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div>
      <div
        style={{
          border: "1px solid #e0e0e0",
          background: "#fff",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            {result.storyTitle && (
              <b style={{ fontSize: "14px" }}>{result.storyTitle}</b>
            )}
            <br />
            <span style={{ color: "#828282", fontSize: "12px" }}>
              Post #{result.postId} &middot; {result.commenters.length} unique
              commenters &middot;{" "}
              {result.commenters.reduce(
                (sum, c) => sum + c.commentCount,
                0
              )}{" "}
              total comments
            </span>
          </div>
          <span
            onClick={exportJSON}
            style={{
              color: "#828282",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            [export json]
          </span>
        </div>
      </div>

      <div>
        {result.commenters.map((commenter) => (
          <div
            key={commenter.username}
            style={{
              border: "1px solid #e0e0e0",
              background: "#fff",
              marginBottom: "2px",
            }}
          >
            <div
              onClick={() =>
                setExpandedUser(
                  expandedUser === commenter.username
                    ? null
                    : commenter.username
                )
              }
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                confidence={
                  commenter.averageScore >= 60
                    ? Math.min(
                        99,
                        Math.round(50 + commenter.averageScore * 0.5)
                      )
                    : commenter.averageScore >= 30
                      ? Math.round(30 + commenter.averageScore * 0.4)
                      : Math.min(99, Math.round(90 - commenter.averageScore))
                }
              />
            </div>

            {expandedUser === commenter.username && (
              <div
                style={{
                  borderTop: "1px solid #e0e0e0",
                  padding: "6px 10px",
                }}
              >
                {commenter.comments
                  .sort((a, b) => b.score - a.score)
                  .map((analysis, i) => (
                    <CommentCard key={i} analysis={analysis} />
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
