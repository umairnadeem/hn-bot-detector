import { scoreComment, getVerdict } from "@/lib/scoring";
import { stripHtml } from "@/lib/hn";
import { SingleCommentAnalysis } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

const ALGOLIA_ITEMS_URL = "https://hn.algolia.com/api/v1/items";

function extractCommentId(input: string): string {
  // Handle full URLs like https://news.ycombinator.com/item?id=39876543
  const urlMatch = input.match(/item\?id=(\d+)/);
  if (urlMatch) return urlMatch[1];

  // Handle plain numeric IDs
  const numMatch = input.trim().match(/^(\d+)$/);
  if (numMatch) return numMatch[1];

  throw new Error(
    "Invalid comment ID or URL. Provide a numeric ID or a news.ycombinator.com URL."
  );
}

interface AlgoliaItem {
  id: number;
  type: string;
  author: string;
  text: string | null;
  title: string | null;
  story_id: number | null;
  parent_id: number | null;
  created_at: string;
  created_at_i: number;
  points: number | null;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing id parameter" },
      { status: 400 }
    );
  }

  try {
    const commentId = extractCommentId(id);

    const res = await fetch(`${ALGOLIA_ITEMS_URL}/${commentId}`);
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: "Comment not found" },
          { status: 404 }
        );
      }
      throw new Error(`HN API error: ${res.status} ${res.statusText}`);
    }

    const item: AlgoliaItem = await res.json();

    if (item.type !== "comment") {
      return NextResponse.json(
        {
          error: `This is a ${item.type}, not a comment. Use the post scanner for stories.`,
        },
        { status: 400 }
      );
    }

    if (!item.text || !item.author) {
      return NextResponse.json(
        { error: "Comment has no text content" },
        { status: 400 }
      );
    }

    // Convert Algolia item format to HNComment format for the scoring pipeline
    const hnComment = {
      objectID: String(item.id),
      author: item.author,
      comment_text: item.text,
      story_title: item.title,
      story_id: item.story_id,
      parent_id: item.parent_id,
      created_at: item.created_at,
      created_at_i: item.created_at_i,
      points: item.points,
      num_comments: null,
    };

    const useOpenAI = !!process.env.OPENAI_API_KEY;
    const analysis = await scoreComment(hnComment, useOpenAI);
    const { verdict, confidence } = getVerdict(analysis.score);

    const result: SingleCommentAnalysis = {
      commentId,
      author: item.author,
      commentText: item.text,
      cleanText: stripHtml(item.text),
      storyTitle: item.title,
      createdAt: item.created_at,
      score: analysis.score,
      verdict,
      confidence,
      breakdown: analysis.breakdown,
      flaggedPhrases: analysis.flaggedPhrases,
      hnUrl: `https://news.ycombinator.com/item?id=${commentId}`,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
