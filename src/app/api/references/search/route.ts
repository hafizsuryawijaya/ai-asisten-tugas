import { NextRequest, NextResponse } from "next/server";
import { searchReferenceSchema } from "@/lib/validations/assignment";
import { searchAcademicReferences } from "@/lib/academic/search";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = searchReferenceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { query, course_name, start_year, end_year, limit } = validation.data;

    const references = await searchAcademicReferences({
      query,
      course_name,
      start_year,
      end_year,
      limit,
    });

    return NextResponse.json({
      success: true,
      count: references.length,
      references,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan server.";
    console.error("Reference search error:", err);
    return NextResponse.json(
      { error: "Gagal mencari referensi: " + errorMsg },
      { status: 500 }
    );
  }
}
