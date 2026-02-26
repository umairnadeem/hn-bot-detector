import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, result, meta } = body;

    if (!type || !result) {
      return NextResponse.json(
        { error: "type and result are required" },
        { status: 400 }
      );
    }

    if (!["comment", "paste", "user", "post"].includes(type)) {
      return NextResponse.json(
        { error: "type must be comment, paste, user, or post" },
        { status: 400 }
      );
    }

    const id = nanoid(8);

    const { error } = await supabase
      .from("shares")
      .insert({ id, type, result, meta: meta || null });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save share" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id, url: `/s/${id}` });
  } catch (err) {
    console.error("Share API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
