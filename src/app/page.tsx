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
        <mark key={i}>
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
      <div style={{ marginBottom: "10px" }}>
        <b style={{ fontSize: "14px" }}>Is this comment written by an LLM?</b>
        <br />
        <span style={{ color: "#828282", fontSize: "12px" }}>
          Paste any Hacker News comment URL or ID to see how it scores for
          LLM-like patterns.
        </span>
      </div>

      <form
        onSubmit={analyze}
        style={{ display: "flex", gap: "6px", marginBottom: "10px" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://news.ycombinator.com/item?id=... or comment ID"
          style={{
            flex: 1,
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
          }}
        >
          {loading ? "analyzing..." : "analyze"}
        </button>
      </form>

      {loading && (
        <div style={{ color: "#828282", padding: "10px 0" }}>
          Analyzing comment...
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
        <div
          style={{
            border: "1px solid #e0e0e0",
            background: "#fff",
            padding: "10px",
          }}
        >
          {/* Header: verdict + score */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <VerdictBadge
              verdict={result.verdict}
              confidence={result.confidence}
            />
            <ScoreBadge score={result.score} />
          </div>

          {/* Comment metadata */}
          <div
            style={{
              fontSize: "12px",
              color: "#828282",
              marginBottom: "8px",
            }}
          >
            <a
              href={`https://news.ycombinator.com/user?id=${result.author}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#ff6600", fontWeight: "bold" }}
            >
              {result.author}
            </a>
            <span style={{ marginLeft: "8px" }}>{date}</span>
            <a
              href={result.hnUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#828282", marginLeft: "8px" }}
            >
              (view on HN)
            </a>
          </div>

          {/* Comment text with highlighted phrases */}
          <div
            style={{
              fontSize: "13px",
              whiteSpace: "pre-wrap",
              marginBottom: "8px",
              padding: "6px",
              background: "#f6f6ef",
              border: "1px solid #e0e0e0",
              fontFamily: "Verdana, Geneva, sans-serif",
            }}
          >
            {highlightPhrases(result.cleanText, result.flaggedPhrases)}
          </div>

          {/* Flagged phrases */}
          {result.flaggedPhrases.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              {result.flaggedPhrases.map((fp, i) => (
                <span
                  key={i}
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

          {/* Score breakdown */}
          {result.breakdown.details.length > 0 && (
            <div
              style={{
                background: "#f6f6ef",
                border: "1px solid #e0e0e0",
                padding: "8px",
              }}
            >
              <b style={{ fontSize: "12px", color: "#828282" }}>
                SCORE BREAKDOWN
              </b>

              {/* Category scores */}
              <table
                style={{
                  width: "100%",
                  fontSize: "12px",
                  marginTop: "6px",
                  marginBottom: "6px",
                  borderCollapse: "collapse",
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ padding: "2px 8px 2px 0" }}>
                      Phrases: <b>{result.breakdown.phraseDetection}</b>/40
                    </td>
                    <td style={{ padding: "2px 8px 2px 0" }}>
                      Structure: <b>{result.breakdown.structuralSignals}</b>/20
                    </td>
                    <td style={{ padding: "2px 8px 2px 0" }}>
                      Timing: <b>{result.breakdown.timingSignals}</b>/50
                    </td>
                    <td style={{ padding: "2px 0" }}>
                      AI Detect: <b>{result.breakdown.openaiDetection}</b>/50
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Detail lines */}
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "20px",
                  fontSize: "12px",
                  color: "#828282",
                }}
              >
                {result.breakdown.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {result.breakdown.details.length === 0 && (
            <div
              style={{
                background: "#f6f6ef",
                border: "1px solid #e0e0e0",
                padding: "8px",
                fontSize: "12px",
                color: "#828282",
              }}
            >
              <b>SCORE BREAKDOWN</b>
              <br />
              No signals fired — this comment looks human.
            </div>
          )}
        </div>
      )}
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
      <div style={{ marginBottom: "10px" }}>
        <b style={{ fontSize: "14px" }}>Username Analyzer</b>
        <br />
        <span style={{ color: "#828282", fontSize: "12px" }}>
          Analyze all recent comments from an HN user for bot-like patterns.
        </span>
      </div>

      <form
        onSubmit={analyze}
        style={{ display: "flex", gap: "6px", marginBottom: "10px" }}
      >
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter HN username..."
          style={{
            flex: 1,
            border: "1px solid #e0e0e0",
            padding: "4px 8px",
            fontSize: "13px",
            fontFamily: "Verdana, Geneva, sans-serif",
            background: "#fff",
          }}
        />
        <button
          type="submit"
          disabled={loading || !username.trim()}
          style={{
            backgroundColor: "#ff6600",
            color: "#fff",
            border: "none",
            padding: "4px 16px",
            fontSize: "13px",
            fontWeight: "bold",
            cursor: loading || !username.trim() ? "not-allowed" : "pointer",
            opacity: loading || !username.trim() ? 0.5 : 1,
          }}
        >
          {loading ? "analyzing..." : "analyze"}
        </button>
      </form>

      {loading && (
        <div style={{ color: "#828282", padding: "10px 0" }}>
          Fetching and analyzing comments for <b>{username}</b>...
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
                marginBottom: "8px",
              }}
            >
              <div>
                <a
                  href={`https://news.ycombinator.com/user?id=${result.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#ff6600",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  {result.username}
                </a>
                <span
                  style={{
                    color: "#828282",
                    fontSize: "12px",
                    marginLeft: "8px",
                  }}
                >
                  {result.totalComments} comments analyzed
                </span>
              </div>
              <VerdictBadge
                verdict={result.verdict}
                confidence={result.confidence}
              />
            </div>

            <table
              style={{
                width: "100%",
                fontSize: "12px",
                borderCollapse: "collapse",
                marginBottom: "6px",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "4px 8px",
                      border: "1px solid #e0e0e0",
                      textAlign: "center",
                    }}
                  >
                    <b style={{ color: "#ff6600", fontSize: "16px" }}>
                      {result.averageScore}
                    </b>
                    <br />
                    <span style={{ color: "#828282" }}>avg bot score</span>
                  </td>
                  <td
                    style={{
                      padding: "4px 8px",
                      border: "1px solid #e0e0e0",
                      textAlign: "center",
                    }}
                  >
                    <b style={{ fontSize: "16px" }}>{result.totalComments}</b>
                    <br />
                    <span style={{ color: "#828282" }}>comments</span>
                  </td>
                  <td
                    style={{
                      padding: "4px 8px",
                      border: "1px solid #e0e0e0",
                      textAlign: "center",
                    }}
                  >
                    <b style={{ fontSize: "16px" }}>{result.timingScore}</b>
                    <br />
                    <span style={{ color: "#828282" }}>timing score</span>
                  </td>
                  <td
                    style={{
                      padding: "4px 8px",
                      border: "1px solid #e0e0e0",
                      textAlign: "center",
                    }}
                  >
                    <b style={{ fontSize: "16px" }}>{result.similarityScore}</b>
                    <br />
                    <span style={{ color: "#828282" }}>similarity score</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ textAlign: "right" }}>
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
      <hr style={{ border: "none", borderTop: "1px solid #ff6600", margin: "16px 0" }} />

      {/* Secondary: Username Analyzer */}
      <UsernameAnalyzer />
    </div>
  );
}
