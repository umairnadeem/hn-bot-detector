import { fetchPostComments, extractPostId } from "@/lib/hn";
import { analyzeUser } from "@/lib/scoring";
import { HNComment, PostAnalysis } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing id parameter" },
      { status: 400 }
    );
  }

  try {
    const postId = extractPostId(id);
    const comments = await fetchPostComments(postId);

    const byAuthor = new Map<string, HNComment[]>();
    for (const comment of comments) {
      const existing = byAuthor.get(comment.author) || [];
      existing.push(comment);
      byAuthor.set(comment.author, existing);
    }

    const useOpenAI = !!process.env.OPENAI_API_KEY;

    const commenterAnalyses = await Promise.all(
      Array.from(byAuthor.entries()).map(async ([username, userComments]) => {
        const analysis = await analyzeUser(userComments, useOpenAI);
        return {
          username,
          averageScore: analysis.averageScore,
          verdict: analysis.verdict,
          commentCount: userComments.length,
          comments: analysis.comments,
        };
      })
    );

    commenterAnalyses.sort((a, b) => b.averageScore - a.averageScore);

    const storyTitle = comments[0]?.story_title || null;

    const result: PostAnalysis = {
      postId,
      storyTitle,
      commenters: commenterAnalyses,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
