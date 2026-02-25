import { HNComment, HNSearchResponse } from "./types";

const BASE_URL = "https://hn.algolia.com/api/v1";

export async function fetchUserComments(
  username: string,
  hitsPerPage = 50
): Promise<HNComment[]> {
  const url = `${BASE_URL}/search?tags=comment,author_${encodeURIComponent(username)}&hitsPerPage=${hitsPerPage}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HN API error: ${res.status} ${res.statusText}`);
  }
  const data: HNSearchResponse = await res.json();
  return data.hits;
}

export async function fetchPostComments(
  postId: string
): Promise<HNComment[]> {
  const allComments: HNComment[] = [];
  let page = 0;
  const hitsPerPage = 100;

  // Paginate to get all comments (up to 500 to avoid excessive requests)
  while (page < 5) {
    const url = `${BASE_URL}/search?tags=comment,story_${postId}&hitsPerPage=${hitsPerPage}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HN API error: ${res.status} ${res.statusText}`);
    }
    const data: HNSearchResponse = await res.json();
    allComments.push(...data.hits);

    if (page >= data.nbPages - 1) break;
    page++;
  }

  return allComments;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function extractPostId(input: string): string {
  // Handle full URLs like https://news.ycombinator.com/item?id=12345
  const urlMatch = input.match(/item\?id=(\d+)/);
  if (urlMatch) return urlMatch[1];

  // Handle plain numeric IDs
  const numMatch = input.match(/^(\d+)$/);
  if (numMatch) return numMatch[1];

  throw new Error("Invalid post ID or URL");
}
