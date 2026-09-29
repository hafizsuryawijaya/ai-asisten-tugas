import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export interface AcademicReferenceInput {
  title: string;
  authors?: string;
  year?: number;
  journal?: string;
  doi?: string;
  url?: string;
  verified?: boolean;
}

export interface AIGenerateRequest {
  question: string;
  course_name: string;
  assignment_type: string;
  instructions?: string;
  writing_style: string;
  length: string;
  references?: AcademicReferenceInput[];
}

export interface AIRewriteRequest {
  original_question: string;
  current_answer: string;
  action: "natural" | "academic" | "shorten" | "expand" | "add_references" | "regenerate";
  references?: AcademicReferenceInput[];
}

export interface AIProvider {
  generateAssignment(req: AIGenerateRequest): Promise<string>;
  rewriteAssignment(req: AIRewriteRequest): Promise<string>;
}

export class AIServiceBusyError extends Error {
  constructor(message = "Layanan AI sedang sibuk. Silakan coba lagi beberapa saat.") {
    super(message);
    this.name = "AIServiceBusyError";
  }
}

// Helper to identify transient/overloaded errors eligible for retry
function isTransientError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  
  // Check common transient error indicators
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("resource_exhausted") ||
    msg.includes("rate limit") ||
    msg.includes("quota")
  );
}

// Exponential backoff retry execution
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let attempt = 0;
  let delayMs = 2000;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      return await fn();
    } catch (err: unknown) {
      if (attempt < maxAttempts && isTransientError(err)) {
        console.warn(
          `[AI Provider Retry] Attempt ${attempt}/${maxAttempts} encountered transient error: ${
            err instanceof Error ? err.message : String(err)
          }. Retrying in ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // 2000ms -> 4000ms
      } else {
        if (isTransientError(err)) {
          throw new AIServiceBusyError();
        }
        throw err;
      }
    }
  }

  throw new AIServiceBusyError();
}

// 1. GEMINI PROVIDER (OFFICIAL @google/genai SDK WITH RETRY)
class GeminiAIProvider implements AIProvider {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  }

  async generateAssignment(req: AIGenerateRequest): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    const prompt = buildAssignmentPrompt(req);

    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      if (!response.text) {
        throw new Error("Gemini AI tidak memberikan respons teks.");
      }

      return response.text;
    });
  }

  async rewriteAssignment(req: AIRewriteRequest): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    const prompt = buildRewritePrompt(req);

    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      if (!response.text) {
        throw new Error("Gemini AI tidak memberikan respons teks untuk revisi.");
      }

      return response.text;
    });
  }
}

// 2. OPENAI PROVIDER WITH RETRY
class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateAssignment(req: AIGenerateRequest): Promise<string> {
    const prompt = buildAssignmentPrompt(req);

    return await withRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error("OpenAI tidak memberikan respons.");
      return text;
    });
  }

  async rewriteAssignment(req: AIRewriteRequest): Promise<string> {
    const prompt = buildRewritePrompt(req);

    return await withRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error("OpenAI tidak memberikan respons.");
      return text;
    });
  }
}

// 3. ANTHROPIC PROVIDER WITH RETRY
class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateAssignment(req: AIGenerateRequest): Promise<string> {
    const prompt = buildAssignmentPrompt(req);

    return await withRetry(async () => {
      const response = await this.client.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0];
      if (content.type === "text") {
        return content.text;
      }
      throw new Error("Anthropic tidak memberikan respons teks.");
    });
  }

  async rewriteAssignment(req: AIRewriteRequest): Promise<string> {
    const prompt = buildRewritePrompt(req);

    return await withRetry(async () => {
      const response = await this.client.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0];
      if (content.type === "text") {
        return content.text;
      }
      throw new Error("Anthropic tidak memberikan respons teks.");
    });
  }
}

// PROMPT BUILDERS
function buildAssignmentPrompt(req: AIGenerateRequest): string {
  const refText =
    req.references && req.references.length > 0
      ? req.references
          .map(
            (r, i) =>
              `[${i + 1}] ${r.title}. Penulis: ${r.authors || "N/A"}. Tahun: ${r.year || "N/A"}. Jurnal: ${r.journal || "N/A"}. DOI: ${r.doi || "N/A"}`
          )
          .join("\n")
      : "Tidak ada referensi eksternal khusus yang diprioritaskan.";

  return `Kamu adalah AI Asisten Akademik Mahasiswa yang sangat ahli, profesional, dan akurat.
Tugasmu adalah menyusun draft jawaban tugas kuliah berkualitas tinggi.

DETAIL TUGAS:
- Mata Kuliah: ${req.course_name}
- Jenis Tugas: ${req.assignment_type}
- Gaya Bahasa: ${req.writing_style}
- Panjang Jawaban: ${req.length}
- Instruksi Tambahan: ${req.instructions || "Tidak ada"}

PERTANYAAN / SOAL:
${req.question}

REFERENSI ILMIAH RESMI YANG WAJIB DIRUJUK DALAM TEKS:
${refText}

ATURAN KRUSIAL:
1. JANGAN PERNAH MEREKAYASA ATAU MEMBUAT REFERENSI/DOI PALSU!
2. Jika ada daftar referensi ilmiah di atas, gunakan sitasi dalam teks (misal: [1], [2] atau Penulis, Tahun) secara tepat pada argumen yang sesuai.
3. Susun jawaban dengan struktur markdown yang sangat rapi: Pendahuluan, Pembahasan Utama (dengan sub-heading), dan Kesimpulan.
4. Pastikan alur berpikir logis, runtut, akademis, namun mudah dipahami oleh mahasiswa.
5. Panjang jawaban disesuaikan dengan instruksi (${req.length}).`;
}

function buildRewritePrompt(req: AIRewriteRequest): string {
  let actionInstruction = "";
  switch (req.action) {
    case "natural":
      actionInstruction =
        "Ubah gaya bahasa agar terasa lebih mengalir alami khas mahasiswa, dengan struktur tata bahasa yang luwes tanpa mengurangi substansi kebenaran materi.";
      break;
    case "academic":
      actionInstruction =
        "Tingkatkan bobot akademik jawaban ini dengan kosa kata ilmiah, istilah teknis yang presisi, dan argumen yang lebih konseptual.";
      break;
    case "shorten":
      actionInstruction =
        "Ringkas jawaban ini menjadi lebih padat, efektif, dan langsung pada inti poin utama (concise).";
      break;
    case "expand":
      actionInstruction =
        "Perluas dan elaborasi jawaban ini secara lebih komprehensif, tambahkan penjelas detail dan sudut pandang pendukung.";
      break;
    case "add_references":
      actionInstruction =
        "Integrasikan sitasi referensi ilmiah dalam teks secara lebih intensif dan eksplisit pada poin-poin analisis utama.";
      break;
    case "regenerate":
      actionInstruction =
        "Tulis ulang jawaban dari awal dengan sudut pandang dan variasi penjelasan baru yang tetap relevan.";
      break;
  }

  return `Kamu adalah AI Asisten Akademik Mahasiswa.

PERTANYAAN ASLI:
${req.original_question}

DRAFT JAWABAN SAAT INI:
${req.current_answer}

PERINTAH REVISI:
${actionInstruction}

ATURAN:
1. Pertahankan konteks soal asli.
2. Jangan pernah merekayasa jurnal/DOI palsu.
3. Hasilkan teks jawaban final dalam format markdown yang rapi.`;
}

export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (provider === "openai" && openaiKey) {
    return new OpenAIProvider(openaiKey);
  }

  if (provider === "anthropic" && anthropicKey) {
    return new AnthropicProvider(anthropicKey);
  }

  if (geminiKey) {
    return new GeminiAIProvider(geminiKey);
  }

  if (openaiKey) {
    return new OpenAIProvider(openaiKey);
  }

  if (anthropicKey) {
    return new AnthropicProvider(anthropicKey);
  }

  throw new Error("AI Provider belum dikonfigurasi. Silakan isi GEMINI_API_KEY, OPENAI_API_KEY, atau ANTHROPIC_API_KEY pada file .env.local.");
}
