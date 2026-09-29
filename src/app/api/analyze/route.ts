import { NextRequest, NextResponse } from "next/server";
import { analyzeWritingSchema } from "@/lib/validations/assignment";
import { analyzeWritingQuality } from "@/lib/detection/provider";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = analyzeWritingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { content, assignment_id } = validation.data;

    const report = analyzeWritingQuality(content);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("analyses").insert({
        user_id: user.id,
        assignment_id: assignment_id || null,
        content,
        ai_score: report.pattern_detection.ai_score,
        human_score: report.pattern_detection.human_score,
        analysis_json: report,
      });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan internal.";
    console.error("Analyze writing error:", err);
    return NextResponse.json(
      { error: "Gagal menganalisis tulisan: " + errorMsg },
      { status: 500 }
    );
  }
}
