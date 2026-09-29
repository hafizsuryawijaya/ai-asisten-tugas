import { NextRequest, NextResponse } from "next/server";
import { generateAssignmentDocx, sanitizeFilename, DocxExportInput } from "@/lib/docx/builder";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      assignmentId,
      title,
      studentName,
      studentId,
      courseName,
      assignmentType,
      question,
      answer,
      text,
      references,
    } = body;

    let finalAnswer = answer || text;
    let finalQuestion = question;
    let finalCourse = courseName;
    let finalType = assignmentType;
    let finalReferences = references || [];
    let finalStudentName = studentName;
    let finalStudentId = studentId;

    // If assignmentId is provided, try loading missing metadata from database
    if (assignmentId && (!finalAnswer || !finalCourse)) {
      const supabase = await createClient();
      const { data: assignment } = await supabase
        .from("assignments")
        .select("*, references(*)")
        .eq("id", assignmentId)
        .single();

      if (assignment) {
        if (!finalAnswer) finalAnswer = assignment.answer;
        if (!finalQuestion) finalQuestion = assignment.question;
        if (!finalCourse) finalCourse = assignment.course_name;
        if (!finalType) finalType = assignment.assignment_type;
        if (!finalReferences || finalReferences.length === 0) {
          finalReferences = assignment.references || [];
        }
      }
    }

    if (!finalAnswer) {
      return NextResponse.json(
        { error: "Konten teks atau jawaban tugas tidak ditemukan." },
        { status: 400 }
      );
    }

    // Attempt to get logged-in user name if studentName is missing
    if (!finalStudentName) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, student_id")
            .eq("id", user.id)
            .single();

          if (profile) {
            finalStudentName = profile.name;
            if (!finalStudentId) finalStudentId = profile.student_id;
          } else {
            finalStudentName = user.email?.split("@")[0] || "Mahasiswa";
          }
        }
      } catch {
        // Fallback to default name if auth check fails
      }
    }

    const exportInput: DocxExportInput = {
      title: title || (finalCourse ? `TUGAS ${finalCourse.toUpperCase()}` : "DOKUMEN TUGAS AKADEMIK"),
      studentName: finalStudentName || "Mahasiswa",
      studentId: finalStudentId || "-",
      courseName: finalCourse || "-",
      assignmentType: finalType || "TugasKuliah",
      question: finalQuestion,
      answer: finalAnswer,
      references: finalReferences,
    };

    const docxBuffer = await generateAssignmentDocx(exportInput);

    // Build clean filename
    const baseName = `${finalCourse || "Tugas"}_${finalType || "Mahasiswa"}_${finalStudentName || "User"}`;
    const filename = `${sanitizeFilename(baseName)}.docx`;

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": docxBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("[Export DOCX API Error]:", error);
    const msg = error instanceof Error ? error.message : "Gagal membuat dokumen Word";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
