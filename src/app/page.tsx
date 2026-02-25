"use client";

import { useState } from "react";
import { UserAnalysis, SingleCommentAnalysis } from "@/lib/types";
import { CommentCard } from "@/components/CommentCard";
import { VerdictBadge } from "@/components/VerdictBadge";
import { ScoreBadge } from "@/components/ScoreBadge";

function highlightPhrases(text: string, phrases: { phrase: string }[]) {
  if (phrases.length === 0) return text;

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
        <mark
          key={i}
          className="bg-yellow-500/30 text-yellow-200 rounded px-0.5"
        >
          {part}
        </mark>
      );
    }
    regex.lastIndex = 0;
    return part;
  });
}

// --- Comment Lookup (Hero) ---

function CommentLookup() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SingleCommentAnalysis | null>(null);

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/analyze/comment?id=${encodeURIComponent(input.trim())}`
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

  const date = result
    ? new Date(result.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Is this comment written by an LLM?
        </h1>
        <p className="text-neutral-400 text-sm">
          Paste any Hacker News comment URL or ID to see how it scores for
          LLM-like patterns.
        </p>
      </div>

      <form onSubmit={analyze} className="flex gap-3 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://news.ycombinator.com/item?id=... or comment ID"
          className="flex-1 rounded-lg border border-[#262626] bg-[#141414] px-4 py-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-orange-600 px-8 py-3 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {loading && (
        <div className="text-center py-12 text-neutral-400">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-600 border-t-orange-500 mb-3" />
          <p className="text-sm">Analyzing comment...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-[#262626] bg-[#141414] p-6">
          {/* Header: verdict + score */}
          <div className="flex items-center justify-between mb-5">
            <VerdictBadge
              verdict={result.verdict}
              confidence={result.confidence}
            />
            <ScoreBadge score={result.score} />
          </div>

          {/* Comment metadata */}
          <div className="flex items-center gap-3 text-sm text-neutral-400 mb-4">
            <a
              href={`https://news.ycombinator.com/user?id=${result.author}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-orange-500 hover:text-orange-400"
            >
              {result.author}
            </a>
            <span>{date}</span>
            <a
              href={result.hnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-neutral-300 ml-auto"
            >
              view on HN
            </a>
          </div>

          {/* Comment text with highlighted phrases */}
          <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mb-5 rounded-lg bg-[#0a0a0a] p-4 border border-[#1e1e1e]">
            {highlightPhrases(result.cleanText, result.flaggedPhrases)}
          </div>

          {/* Flagged phrases pills */}
          {result.flaggedPhrases.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {result.flaggedPhrases.map((fp, i) => (
                <span
                  key={i}
                  className="text-xs bg-yellow-500/10 text-yellow-500 rounded px-2 py-0.5"
                >
                  {fp.phrase} (+{fp.points})
                </span>
              ))}
            </div>
          )}

          {/* Score breakdown — always visible */}
          {result.breakdown.details.length > 0 && (
            <div className="rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] p-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                Score Breakdown
              </h3>

              {/* Category bars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <BreakdownBar
                  label="Phrases"
                  value={result.breakdown.phraseDetection}
                  max={40}
                />
                <BreakdownBar
                  label="Structure"
                  value={result.breakdown.structuralSignals}
                  max={20}
                />
                <BreakdownBar
                  label="Timing"
                  value={result.breakdown.timingSignals}
                  max={50}
                />
                <BreakdownBar
                  label="AI Detect"
                  value={result.breakdown.openaiDetection}
                  max={50}
                />
              </div>

              {/* Detail lines */}
              <ul className="space-y-1">
                {result.breakdown.details.map((d, i) => (
                  <li key={i} className="text-xs text-neutral-400 flex gap-2">
                    <span className="text-neutral-600 select-none">&bull;</span>
                    {d}
                  </li>
                ))}
              </ul>

              {result.breakdown.details.length === 0 && (
                <p className="text-xs text-neutral-500">
                  No signals fired — this comment looks human.
                </p>
              )}
            </div>
          )}

          {result.breakdown.details.length === 0 && (
            <div className="rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] p-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                Score Breakdown
              </h3>
              <p className="text-xs text-neutral-500">
                No signals fired — this comment looks human.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BreakdownBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color =
    value === 0
      ? "bg-neutral-700"
      : pct >= 60
        ? "bg-red-500"
        : pct >= 30
          ? "bg-yellow-500"
          : "bg-green-500";

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#1e1e1e] overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// --- Username Analyzer (Secondary) ---

function UsernameAnalyzer() {
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
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-1">Username Analyzer</h2>
        <p className="text-neutral-400 text-sm">
          Analyze all recent comments from an HN user for bot-like patterns.
        </p>
      </div>

      <form onSubmit={analyze} className="flex gap-3 mb-6">
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
        <div className="text-center py-8 text-neutral-400">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-600 border-t-orange-500 mb-3" />
          <p className="text-sm">
            Fetching and analyzing comments for{" "}
            <strong>{username}</strong>...
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
          <div className="rounded-lg border border-[#262626] bg-[#141414] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  <a
                    href={`https://news.ycombinator.com/user?id=${result.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-400"
                  >
                    {result.username}
                  </a>
                </h3>
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
                <div className="text-2xl font-bold">
                  {result.timingScore}
                </div>
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

// --- Page ---

export default function HomePage() {
  return (
    <div>
      {/* Hero: Comment Lookup */}
      <CommentLookup />

      {/* Divider */}
      <div className="my-12 border-t border-[#262626]" />

      {/* Secondary: Username Analyzer */}
      <UsernameAnalyzer />
    </div>
  );
}
