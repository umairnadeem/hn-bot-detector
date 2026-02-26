"use client";

import { useState } from "react";
import { UserAnalysis, SingleCommentAnalysis } from "@/lib/types";
import { exportJSON } from "@/lib/utils";
import { CommentCard } from "@/components/CommentCard";
import { HighlightedText } from "@/components/HighlightedText";
import { VerdictBadge } from "@/components/VerdictBadge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ShareButton } from "@/components/ShareButton";

function CommentLookup() {
  const [mode, setMode] = useState<"url" | "text">("url");
  const [input, setInput] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SingleCommentAnalysis | null>(null);

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    const value = mode === "url" ? input.trim() : rawText.trim();
    if (!value) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res =
        mode === "url"
          ? await fetch(
              `/api/analyze/comment?id=${encodeURIComponent(value)}`
            )
          : await fetch("/api/analyze/comment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: value }),
            });
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

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-block",
    padding: "2px 10px",
    cursor: "pointer",
    borderBottom: active ? "2px solid #ff6600" : "2px solid transparent",
    fontWeight: active ? "bold" : "normal",
    color: active ? "#000" : "#828282",
    fontSize: "9pt",
    marginRight: "4px",
    userSelect: "none",
  });

  const hasValue = mode === "url" ? input.trim() : rawText.trim();

  const buttonStyle: React.CSSProperties = {
    backgroundColor: "#ff6600",
    color: "#000",
    border: "none",
    padding: "4px 16px",
    fontSize: "9pt",
    fontWeight: "bold",
    cursor: loading || !hasValue ? "not-allowed" : "pointer",
    opacity: loading || !hasValue ? 0.5 : 1,
    whiteSpace: "nowrap",
  };

  return (
    <div>
      <div style={{ marginBottom: "8px" }}>
        <b>Is this comment written by an LLM?</b>
      </div>

      <div style={{ marginBottom: "8px", borderBottom: "1px solid #e0e0e0" }}>
        <span
          onClick={() => {
            setMode("url");
            setResult(null);
            setError(null);
          }}
          style={tabStyle(mode === "url")}
        >
          HN url / id
        </span>
        <span
          onClick={() => {
            setMode("text");
            setResult(null);
            setError(null);
          }}
          style={tabStyle(mode === "text")}
        >
          paste text
        </span>
      </div>

      <form onSubmit={analyze} style={{ marginBottom: "10px" }}>
        {mode === "url" ? (
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://news.ycombinator.com/item?id=... or comment ID"
              style={{
                flex: 1,
                minWidth: 0,
                border: "1px solid #e0e0e0",
                padding: "4px 8px",
                fontSize: "9pt",
                fontFamily: "Verdana, Geneva, sans-serif",
                background: "#fff",
              }}
            />
            <button type="submit" disabled={loading || !hasValue} style={buttonStyle}>
              {loading ? "analyzing..." : "analyze"}
            </button>
          </div>
        ) : (
          <div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste any comment text here..."
              rows={6}
              style={{
                width: "100%",
                border: "1px solid #e0e0e0",
                padding: "4px 8px",
                fontSize: "9pt",
                fontFamily: "Verdana, Geneva, sans-serif",
                background: "#fff",
                resize: "vertical",
                display: "block",
                marginBottom: "6px",
                boxSizing: "border-box",
              }}
            />
            <button type="submit" disabled={loading || !hasValue} style={buttonStyle}>
              {loading ? "analyzing..." : "analyze"}
            </button>
          </div>
        )}
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
            {result.hnUrl && (
              <a
                href={result.hnUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#828282", marginLeft: "8px" }}
              >
                (view on HN)
              </a>
            )}
          </div>

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
            <HighlightedText
              text={result.cleanText}
              phrases={result.flaggedPhrases}
            />
          </div>

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

          {result.breakdown.details.length > 0 ? (
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

              <table
                className="hn-breakdown-table"
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
                  <tr>
                    <td style={{ padding: "2px 8px 2px 0" }}>
                      Curly quotes: <b>{result.breakdown.curlyQuotes}</b>/20
                    </td>
                    <td style={{ padding: "2px 8px 2px 0" }}>
                      Numbered lists: <b>{result.breakdown.numberedLists}</b>/25
                    </td>
                    <td style={{ padding: "2px 8px 2px 0" }}>
                      Threes: <b>{result.breakdown.examplesInThrees}</b>/12
                    </td>
                    <td style={{ padding: "2px 0" }}>
                      Em dash: <b>{result.breakdown.emDashOveruse}</b>/15
                    </td>
                  </tr>
                </tbody>
              </table>

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
          ) : (
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

          <div style={{ marginTop: "8px", textAlign: "right" }}>
            <ShareButton
              type={mode === "url" ? "comment" : "paste"}
              result={result}
              meta={
                result.hnUrl
                  ? { hnUrl: result.hnUrl, username: result.author }
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

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
        className="hn-form"
        style={{ display: "flex", gap: "6px", marginBottom: "10px" }}
      >
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter HN username..."
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
            whiteSpace: "nowrap",
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
              className="hn-stats-table"
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
                    <b style={{ fontSize: "16px" }}>
                      {result.similarityScore}
                    </b>
                    <br />
                    <span style={{ color: "#828282" }}>similarity score</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ textAlign: "right" }}>
              <span
                onClick={() =>
                  exportJSON(
                    result,
                    `hn-bot-analysis-${result.username}.json`
                  )
                }
                style={{
                  color: "#828282",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                [export json]
              </span>
              <span style={{ marginLeft: "8px" }}>
                <ShareButton
                  type="user"
                  result={result}
                  meta={{ username: result.username }}
                />
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

export default function HomePage() {
  return (
    <div>
      <CommentLookup />
      <hr
        style={{
          border: "none",
          borderTop: "1px solid #ff6600",
          margin: "16px 0",
        }}
      />
      <UsernameAnalyzer />
    </div>
  );
}
