import { fetchUserComments } from "@/lib/hn";
import { analyzeUser } from "@/lib/scoring";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Missing username parameter" },
      { status: 400 }
    );
  }

  try {
    const comments = await fetchUserComments(username, 50);
    const useOpenAI = !!process.env.OPENAI_API_KEY;
    const analysis = await analyzeUser(comments, useOpenAI);

    return NextResponse.json(analysis);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
