"use client";

import { useState } from "react";

interface ShareButtonProps {
  type: "comment" | "paste" | "user" | "post";
  result: object;
  meta?: object;
}

export function ShareButton({ type, result, meta }: ShareButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "copied" | "error"
  >("idle");

  async function share() {
    setStatus("loading");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, result, meta }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Share failed");

      const url = `${window.location.origin}${data.url}`;
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  const label =
    status === "loading"
      ? "sharing..."
      : status === "copied"
        ? "link copied!"
        : status === "error"
          ? "share failed"
          : "share";

  return (
    <span
      onClick={status === "idle" ? share : undefined}
      style={{
        color: "#828282",
        fontSize: "9pt",
        cursor: status === "idle" ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      {label}
    </span>
  );
}
