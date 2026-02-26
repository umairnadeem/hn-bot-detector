"use client";

import { useMemo, useCallback } from "react";
import { PostAnalysis } from "@/lib/types";
import { exportJSON } from "@/lib/utils";

export function PostSummary({ result }: { result: PostAnalysis }) {
  const totalComments = useMemo(
    () => result.commenters.reduce((sum, c) => sum + c.commentCount, 0),
    [result.commenters]
  );

  const handleExportJSON = useCallback(() => {
    exportJSON(result, `hn-post-analysis-${result.postId}.json`);
  }, [result]);

  return (
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
            commenters &middot; {totalComments} total comments
          </span>
        </div>
        <span
          onClick={handleExportJSON}
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
  );
}
