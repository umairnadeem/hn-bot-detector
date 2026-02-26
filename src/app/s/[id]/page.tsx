import { headers } from "next/headers";
import { ShareView } from "./ShareView";

async function getShare(id: string, origin: string) {
  const res = await fetch(`${origin}/api/share/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function SharePage({
  params,
}: {
  params: { id: string };
}) {
  const headersList = headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  const share = await getShare(params.id, origin);

  if (!share) {
    return (
      <div>
        <div
          style={{
            border: "1px solid #e0e0e0",
            background: "#fff",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <b style={{ fontSize: "14px" }}>Share not found</b>
          <br />
          <span style={{ color: "#828282", fontSize: "12px" }}>
            This shared analysis may have been removed or the link is invalid.
          </span>
          <br />
          <br />
          <a href="/" style={{ color: "#ff6600", fontSize: "12px" }}>
            analyze another
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ color: "#828282", fontSize: "9pt", marginBottom: "8px" }}>
        shared analysis
      </div>
      <ShareView type={share.type} result={share.result} meta={share.meta} />
      <div style={{ marginTop: "12px" }}>
        <a href="/" style={{ color: "#ff6600", fontSize: "12px" }}>
          analyze another
        </a>
      </div>
    </div>
  );
}
