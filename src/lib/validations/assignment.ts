import { z } from "zod";

export const generateAssignmentSchema = z.object({
  course_name: z.string().min(2, "Nama mata kuliah minimal 2 karakter"),
  assignment_type: z.enum(["Diskusi", "Essay", "Makalah", "Pertanyaan", "Ringkasan"]),
  question: z.string().min(10, "Pertanyaan/soal minimal 10 karakter"),
  instructions: z.string().optional(),
  writing_style: z.enum(["Bahasa mahasiswa", "Akademik", "Formal", "Sederhana"]),
  length: z.enum(["Singkat", "Sedang", "Panjang"]),
  search_references: z.boolean().default(true),
  ref_count: z.number().min(1).max(10).default(5),
  start_year: z.number().min(1990).max(2030).default(2021),
  end_year: z.number().min(1990).max(2030).default(2026),
});

export const rewriteAssignmentSchema = z.object({
  assignment_id: z.string().optional(),
  action: z.enum(["natural", "academic", "shorten", "expand", "add_references", "regenerate"]),
  original_question: z.string().min(5),
  current_answer: z.string().min(10),
});

export const searchReferenceSchema = z.object({
  query: z.string().min(3, "Kata kunci pencarian minimal 3 karakter"),
  course_name: z.string().optional(),
  start_year: z.number().optional().default(2021),
  end_year: z.number().optional().default(2026),
  limit: z.number().optional().default(5),
});

export const analyzeWritingSchema = z.object({
  content: z.string().min(20, "Teks untuk dianalisis minimal 20 karakter"),
  assignment_id: z.string().optional(),
});
