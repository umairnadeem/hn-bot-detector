"use client";

import { useState } from "react";
import { UserAnalysis } from "@/lib/types";
import { CommentCard } from "@/components/CommentCard";
import { VerdictBadge } from "@/components/VerdictBadge";

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UserAnalysis | null>(null);

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/analyze/user?username=${encodeURIComponent(username.trim())}`
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
    a.download = `hn-bot-analysis-${result.username}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Username Analyzer</h1>
        <p className="text-neutral-400 text-sm">
          Analyze a Hacker News user&apos;s comments for bot-like patterns.
        </p>
      </div>

      <form onSubmit={analyze} className="flex gap-3 mb-8">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter HN username..."
          className="flex-1 rounded-lg border border-[#262626] bg-[#141414] px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {loading && (
        <div className="text-center py-12 text-neutral-400">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-600 border-t-orange-500 mb-3" />
          <p className="text-sm">
            Fetching and analyzing comments for <strong>{username}</strong>...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div>
          {/* Summary stats */}
          <div className="rounded-lg border border-[#262626] bg-[#141414] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  <a
                    href={`https://news.ycombinator.com/user?id=${result.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-400"
                  >
                    {result.username}
                  </a>
                </h2>
                <p className="text-sm text-neutral-400 mt-1">
                  {result.totalComments} comments analyzed
                </p>
              </div>
              <VerdictBadge
                verdict={result.verdict}
                confidence={result.confidence}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="rounded-lg bg-[#0a0a0a] p-3">
                <div className="text-2xl font-bold text-orange-500">
                  {result.averageScore}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Avg Bot Score
                </div>
              </div>
              <div className="rounded-lg bg-[#0a0a0a] p-3">
                <div className="text-2xl font-bold">
                  {result.totalComments}
                </div>
                <div className="text-xs text-neutral-500 mt-1">Comments</div>
              </div>
              <div className="rounded-lg bg-[#0a0a0a] p-3">
                <div className="text-2xl font-bold">{result.timingScore}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  Timing Score
                </div>
              </div>
              <div className="rounded-lg bg-[#0a0a0a] p-3">
                <div className="text-2xl font-bold">
                  {result.similarityScore}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Similarity Score
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={exportJSON}
                className="text-xs text-neutral-400 hover:text-neutral-200 border border-[#262626] rounded px-3 py-1.5 transition-colors"
              >
                Export JSON
              </button>
            </div>
          </div>

          {/* Comment list */}
          <div className="space-y-3">
            {result.comments
              .sort((a, b) => b.score - a.score)
              .map((analysis, i) => (
                <CommentCard key={i} analysis={analysis} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
