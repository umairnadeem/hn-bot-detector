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
      <div className="text-center py-12 text-neutral-400">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-600 border-t-orange-500 mb-3" />
        <p className="text-sm">Analyzing post #{postId}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div>
      <div className="rounded-lg border border-[#262626] bg-[#141414] p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            {result.storyTitle && (
              <h1 className="text-lg font-semibold mb-1">
                {result.storyTitle}
              </h1>
            )}
            <p className="text-sm text-neutral-400">
              Post #{result.postId} &middot; {result.commenters.length} unique
              commenters &middot;{" "}
              {result.commenters.reduce(
                (sum, c) => sum + c.commentCount,
                0
              )}{" "}
              total comments
            </p>
          </div>
          <button
            onClick={exportJSON}
            className="text-xs text-neutral-400 hover:text-neutral-200 border border-[#262626] rounded px-3 py-1.5 transition-colors"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {result.commenters.map((commenter) => (
          <div
            key={commenter.username}
            className="rounded-lg border border-[#262626] bg-[#141414]"
          >
            <button
              onClick={() =>
                setExpandedUser(
                  expandedUser === commenter.username
                    ? null
                    : commenter.username
                )
              }
              className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1a1a1a] transition-colors rounded-lg"
            >
              <div className="flex items-center gap-4">
                <ScoreBadge score={commenter.averageScore} />
                <a
                  href={`https://news.ycombinator.com/user?id=${commenter.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-orange-500 hover:text-orange-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  {commenter.username}
                </a>
                <span className="text-xs text-neutral-500">
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
            </button>

            {expandedUser === commenter.username && (
              <div className="border-t border-[#262626] p-4 space-y-3">
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
