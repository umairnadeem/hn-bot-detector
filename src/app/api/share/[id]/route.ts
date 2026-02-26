import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data, error } = await supabase
    .from("shares")
    .select("type, result, meta, created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  return NextResponse.json({
    type: data.type,
    result: data.result,
    meta: data.meta,
    createdAt: data.created_at,
  });
}
