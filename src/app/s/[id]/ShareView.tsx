"use client";

import { useMemo } from "react";
import {
  SingleCommentAnalysis,
  UserAnalysis,
  PostAnalysis,
} from "@/lib/types";
import { VerdictBadge } from "@/components/VerdictBadge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { HighlightedText } from "@/components/HighlightedText";
import { CommentCard } from "@/components/CommentCard";
import { CommenterList } from "@/components/CommenterList";
import { PostSummary } from "@/components/PostSummary";

function CommentResult({ result }: { result: SingleCommentAnalysis }) {
  const date = useMemo(
    () =>
      result.createdAt
        ? new Date(result.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    [result.createdAt]
  );

  return (
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
        <VerdictBadge verdict={result.verdict} confidence={result.confidence} />
        <ScoreBadge score={result.score} />
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#828282",
          marginBottom: "8px",
        }}
      >
        {result.author && (
          <a
            href={`https://news.ycombinator.com/user?id=${result.author}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#ff6600", fontWeight: "bold" }}
          >
            {result.author}
          </a>
        )}
        {date && <span style={{ marginLeft: "8px" }}>{date}</span>}
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
          {result.flaggedPhrases.map((fp) => (
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

      {result.breakdown.details.length > 0 ? (
        <div
          style={{
            background: "#f6f6ef",
            border: "1px solid #e0e0e0",
            padding: "8px",
          }}
        >
          <b style={{ fontSize: "12px", color: "#828282" }}>SCORE BREAKDOWN</b>
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
            {result.breakdown.details.map((d) => (
              <li key={d}>{d}</li>
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
          No signals fired -- this comment looks human.
        </div>
      )}
    </div>
  );
}

function UserResult({ result }: { result: UserAnalysis }) {
  const sortedComments = useMemo(
    () => [...result.comments].sort((a, b) => b.score - a.score),
    [result.comments]
  );

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
                <b style={{ fontSize: "16px" }}>{result.similarityScore}</b>
                <br />
                <span style={{ color: "#828282" }}>similarity score</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        {sortedComments.map((analysis) => (
          <CommentCard key={analysis.comment.objectID} analysis={analysis} />
        ))}
      </div>
    </div>
  );
}

function PostResult({ result }: { result: PostAnalysis }) {
  return (
    <div>
      <PostSummary result={result} />
      <CommenterList commenters={result.commenters} />
    </div>
  );
}

interface ShareViewProps {
  type: string;
  result: unknown;
  meta?: unknown;
}

export function ShareView({ type, result }: ShareViewProps) {
  if (type === "comment" || type === "paste") {
    return <CommentResult result={result as SingleCommentAnalysis} />;
  }
  if (type === "user") {
    return <UserResult result={result as UserAnalysis} />;
  }
  if (type === "post") {
    return <PostResult result={result as PostAnalysis} />;
  }
  return <div style={{ color: "#828282" }}>Unknown share type.</div>;
}
