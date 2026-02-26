"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PostAnalysis } from "@/lib/types";
import { CommenterList } from "@/components/CommenterList";
import { PostSummary } from "@/components/PostSummary";
import { ShareButton } from "@/components/ShareButton";

export default function PostAnalysisPage() {
  const params = useParams();
  const postId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PostAnalysis | null>(null);

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
      <PostSummary result={result} />
      <CommenterList commenters={result.commenters} />
      <div style={{ marginTop: "8px", textAlign: "right" }}>
        <ShareButton
          type="post"
          result={result}
          meta={{ postId: result.postId }}
        />
      </div>
    </div>
  );
}
