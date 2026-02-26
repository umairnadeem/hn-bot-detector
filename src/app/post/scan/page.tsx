"use client";

import { useState, useCallback } from "react";
import { PostAnalysis } from "@/lib/types";
import { CommenterList } from "@/components/CommenterList";
import { PostSummary } from "@/components/PostSummary";
import { useAnalysis } from "@/hooks/useAnalysis";

export default function PostScanPage() {
  const [input, setInput] = useState("");
  const { loading, error, result, analyze } = useAnalysis<PostAnalysis>();

  const handleAnalyze = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      analyze(async () => {
        const res = await fetch(
          `/api/analyze/post?id=${encodeURIComponent(input.trim())}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");
        return data;
      });
    },
    [input, analyze]
  );

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
        onSubmit={handleAnalyze}
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
          <PostSummary result={result} />
          <CommenterList commenters={result.commenters} />
        </div>
      )}
    </div>
  );
}
