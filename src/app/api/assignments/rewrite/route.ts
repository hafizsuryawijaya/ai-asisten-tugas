import { NextRequest, NextResponse } from "next/server";
import { rewriteAssignmentSchema } from "@/lib/validations/assignment";
import { getAIProvider, AIServiceBusyError } from "@/lib/ai/provider";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = rewriteAssignmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { assignment_id, action, original_question, current_answer } = validation.data;

    let newAnswer = "";
    try {
      const aiProvider = getAIProvider();
      newAnswer = await aiProvider.rewriteAssignment({
        original_question,
        current_answer,
        action,
      });
    } catch (aiErr: unknown) {
      console.error("[SERVER ERROR] AI Rewrite failed:", aiErr);
      const isBusy =
        aiErr instanceof AIServiceBusyError ||
        (aiErr instanceof Error && (aiErr.message.includes("503") || aiErr.message.includes("sibuk")));

      return NextResponse.json(
        {
          error: isBusy
            ? "Layanan AI sedang sibuk. Silakan coba lagi beberapa saat."
            : "Gagal memperbarui jawaban AI. Silakan coba kembali.",
        },
        { status: isBusy ? 503 : 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && assignment_id) {
      await supabase.from("revisions").insert({
        assignment_id,
        type: action,
        old_content: current_answer,
        new_content: newAnswer,
      });

      await supabase
        .from("assignments")
        .update({ answer: newAnswer, updated_at: new Date().toISOString() })
        .eq("id", assignment_id)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      success: true,
      new_answer: newAnswer,
      action,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan internal.";
    console.error("[SERVER ERROR] Rewrite endpoint failure:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui jawaban: " + errorMsg },
      { status: 500 }
    );
  }
}
