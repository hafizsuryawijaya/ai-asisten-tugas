import { NextRequest, NextResponse } from "next/server";
import { generateAssignmentSchema } from "@/lib/validations/assignment";
import { searchAcademicReferences, AcademicPaper } from "@/lib/academic/search";
import { getAIProvider, AIServiceBusyError } from "@/lib/ai/provider";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = generateAssignmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      course_name,
      assignment_type,
      question,
      instructions,
      writing_style,
      length,
      search_references,
      ref_count,
      start_year,
      end_year,
    } = validation.data;

    // STEP 1: ACADEMIC SEARCH
    let foundReferences: AcademicPaper[] = [];
    if (search_references) {
      foundReferences = await searchAcademicReferences({
        query: question,
        course_name,
        start_year,
        end_year,
        limit: ref_count,
      });
    }

    // STEP 2: AI GENERATION WITH RETRY SUPPORT
    let aiAnswer = "";
    try {
      const aiProvider = getAIProvider();
      aiAnswer = await aiProvider.generateAssignment({
        question,
        course_name,
        assignment_type,
        instructions,
        writing_style,
        length,
        references: foundReferences,
      });
    } catch (aiErr: unknown) {
      console.error("[SERVER ERROR] AI Generation failed:", aiErr);
      const isBusy =
        aiErr instanceof AIServiceBusyError ||
        (aiErr instanceof Error && (aiErr.message.includes("503") || aiErr.message.includes("sibuk")));

      return NextResponse.json(
        {
          error: isBusy
            ? "Layanan AI sedang sibuk. Silakan coba lagi beberapa saat."
            : "Gagal menghasilkan jawaban AI. Silakan coba kembali.",
        },
        { status: isBusy ? 503 : 500 }
      );
    }

    // STEP 3: PERSIST TO SUPABASE DB (IF USER IS LOGGED IN)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let savedAssignmentId = Math.random().toString(36).substring(2, 10);

    if (user) {
      const { data: assignmentData, error: assignmentErr } = await supabase
        .from("assignments")
        .insert({
          user_id: user.id,
          course_name,
          assignment_type,
          question,
          instructions,
          writing_style,
          length,
          answer: aiAnswer,
        })
        .select()
        .single();

      if (!assignmentErr && assignmentData) {
        savedAssignmentId = assignmentData.id;

        if (foundReferences.length > 0) {
          const refRows = foundReferences.map((r) => ({
            assignment_id: savedAssignmentId,
            title: r.title,
            authors: r.authors,
            year: r.year,
            journal: r.journal,
            doi: r.doi,
            url: r.url,
            abstract: r.abstract,
            source: r.source,
            verified: r.verified,
          }));

          await supabase.from("references").insert(refRows);
        }
      }
    }

    return NextResponse.json({
      success: true,
      assignment_id: savedAssignmentId,
      answer: aiAnswer,
      references: foundReferences,
      metadata: {
        course_name,
        assignment_type,
        writing_style,
        length,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan internal.";
    console.error("[SERVER ERROR] Assignment endpoint failure:", err);
    return NextResponse.json(
      { error: "Gagal memproses tugas: " + errorMsg },
      { status: 500 }
    );
  }
}
