"use client";

import { useState } from "react";
import { PostAnalysis } from "@/lib/types";
import { CommentCard } from "@/components/CommentCard";
import { VerdictBadge } from "@/components/VerdictBadge";
import { ScoreBadge } from "@/components/ScoreBadge";

export default function PostScanPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PostAnalysis | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedUser(null);

    try {
      const res = await fetch(
        `/api/analyze/post?id=${encodeURIComponent(input.trim())}`
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

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <b style={{ fontSize: "14px" }}>Post Comment Scanner</b>
        <br />
        <span style={{ color: "#828282", fontSize: "12px" }}>
          Scan all comments on a Hacker News post for bot-like patterns.
        </span>
      </div>

      <form
        onSubmit={analyze}
        className="hn-form"
        style={{ display: "flex", gap: "6px", marginBottom: "10px" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter HN post ID or URL..."
          style={{
            flex: 1,
            minWidth: 0,
            border: "1px solid #e0e0e0",
            padding: "4px 8px",
            fontSize: "13px",
            fontFamily: "Verdana, Geneva, sans-serif",
            background: "#fff",
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            backgroundColor: "#ff6600",
            color: "#fff",
            border: "none",
            padding: "4px 16px",
            fontSize: "13px",
            fontWeight: "bold",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.5 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "scanning..." : "scan"}
        </button>
      </form>

      {loading && (
        <div style={{ color: "#828282", padding: "10px 0" }}>
          Fetching and analyzing post comments...
        </div>
      )}

      {error && (
        <div
          style={{
            color: "#ff0000",
            border: "1px solid #ff0000",
            padding: "6px 10px",
            marginBottom: "10px",
            background: "#fff",
          }}
        >
          {error}
        </div>
      )}

      {result && (
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
                  Post #{result.postId} &middot; {result.commenters.length}{" "}
                  unique commenters &middot;{" "}
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
                  className="hn-commenter-row"
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
                    confidence={
                      commenter.averageScore >= 60
                        ? Math.min(
                            99,
                            Math.round(50 + commenter.averageScore * 0.5)
                          )
                        : commenter.averageScore >= 30
                          ? Math.round(30 + commenter.averageScore * 0.4)
                          : Math.min(
                              99,
                              Math.round(90 - commenter.averageScore)
                            )
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
      )}
    </div>
  );
}
