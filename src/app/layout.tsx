import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HN Bot Detector",
  description: "Detect LLM-generated and bot comments on Hacker News",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <table
          className="hn-main-table"
          style={{
            width: "85%",
            maxWidth: "900px",
            margin: "0 auto",
            borderSpacing: 0,
            borderCollapse: "collapse",
            marginTop: "10px",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  backgroundColor: "#ff6600",
                  padding: "2px 10px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderSpacing: 0,
                    padding: "2px",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ lineHeight: "12pt" }}>
                        <Link
                          href="/"
                          style={{
                            color: "#000000",
                            fontWeight: "bold",
                            fontSize: "9pt",
                            textDecoration: "none",
                            marginRight: "14px",
                          }}
                        >
                          HN Bot Detector
                        </Link>
                        <Link
                          href="/"
                          style={{
                            color: "#000000",
                            fontSize: "9pt",
                            textDecoration: "none",
                            marginRight: "10px",
                          }}
                        >
                          comment lookup
                        </Link>
                        <span style={{ color: "#000000" }}>|</span>
                        <Link
                          href="/post/scan"
                          style={{
                            color: "#000000",
                            fontSize: "9pt",
                            textDecoration: "none",
                            marginLeft: "10px",
                          }}
                        >
                          post scanner
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "10px 0" }}>
                <main>{children}</main>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
