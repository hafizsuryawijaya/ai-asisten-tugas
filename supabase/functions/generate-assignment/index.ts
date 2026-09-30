const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AcademicReferenceInput {
  title: string;
  authors?: string;
  year?: number;
  journal?: string;
  doi?: string;
  url?: string;
  verified?: boolean;
}

interface AcademicPaper extends AcademicReferenceInput {
  abstract?: string;
  source: string;
  citation_apa: string;
}

const INDONESIAN_STOP_WORDS = new Set([
  "buatkan", "jelaskan", "analisis", "bagaimana", "mengapa", "apakah", "tentang",
  "soal", "tugas", "mengenai", "dan", "atau", "yang", "untuk", "dengan", "dalam",
  "pada", "dari", "ke", "di", "ini", "itu", "adalah", "merupakan", "tersebut",
  "bantu", "susun", "jawaban", "peran", "pentingnya", "dampak", "pengaruh", "studi",
  "kasus", "terhadap", "sebagai", "antara", "secara", "dapat", "bisa", "harus",
  "akan", "telah", "sudah", "minimal", "jurnal", "referensi", "contoh", "pola",
  "menurut", "berdasarkan", "terkait", "serta", "oleh", "banyak", "beberapa"
]);

function extractKeywords(query: string, course_name?: string): string {
  const cleanQuery = query.replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();
  const words = cleanQuery.split(" ").filter((w) => {
    const lower = w.toLowerCase();
    return lower.length > 2 && !INDONESIAN_STOP_WORDS.has(lower);
  });
  const questionTerms = words.slice(0, 4);
  if (questionTerms.length > 0) return questionTerms.join(" ");

  const courseTerm = course_name
    ? course_name.replace(/[^\w\s]/gi, " ").split(" ").filter((w) => !INDONESIAN_STOP_WORDS.has(w.toLowerCase())).join(" ")
    : "";
  return courseTerm || "penelitian ilmiah";
}

async function searchOpenAlex(keywords: string, startYear: number, endYear: number, limit: number): Promise<AcademicPaper[]> {
  try {
    const encodedQuery = encodeURIComponent(keywords);
    const filter = `from_publication_date:${startYear}-01-01,to_publication_date:${endYear}-12-31`;
    const url = `https://api.openalex.org/works?search=${encodedQuery}&filter=${filter}&per-page=${limit * 2}&sort=relevance_score:desc`;
    const res = await fetch(url, {
      headers: { "User-Agent": "AI-Asisten-Tugas-Mahasiswa/1.0 (mailto:admin@ai-asisten-tugas.edu)" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results || [];
    const papers: AcademicPaper[] = [];

    for (const item of results) {
      if (!item.title) continue;
      const authors = item.authorships
        ?.map((a: any) => a.author?.display_name)
        .filter(Boolean)
        .slice(0, 3)
        .join(", ") || "Penulis Tidak Ditentukan";
      const publicationYear = item.publication_year || new Date().getFullYear();
      const journalName = item.primary_location?.source?.display_name || item.host_venue?.name || "Jurnal Ilmiah";
      const doiRaw = item.doi ? item.doi.replace("https://doi.org/", "") : undefined;
      const paperUrl = item.doi || item.primary_location?.landing_page_url || item.id || `https://openalex.org/${item.id}`;
      const verified = Boolean(doiRaw || (item.primary_location && item.primary_location.is_oa));
      const apaCitation = `${authors} (${publicationYear}). ${item.title}. ${journalName}.${doiRaw ? ` https://doi.org/${doiRaw}` : ""}`;

      papers.push({
        title: item.title,
        authors,
        year: publicationYear,
        journal: journalName,
        doi: doiRaw,
        url: paperUrl,
        source: "OpenAlex",
        verified,
        citation_apa: apaCitation,
      });
      if (papers.length >= limit) break;
    }
    return papers;
  } catch (err) {
    console.error("OpenAlex search error:", err);
    return [];
  }
}

async function searchCrossref(keywords: string, startYear: number, endYear: number, limit: number): Promise<AcademicPaper[]> {
  try {
    const encodedQuery = encodeURIComponent(keywords);
    const url = `https://api.crossref.org/works?query=${encodedQuery}&filter=from-pub-date:${startYear},until-pub-date:${endYear}&rows=${limit}&sort=score&order=desc`;
    const res = await fetch(url, {
      headers: { "User-Agent": "AI-Asisten-Tugas-Mahasiswa/1.0 (mailto:admin@ai-asisten-tugas.edu)" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.message?.items || [];
    const papers: AcademicPaper[] = [];

    for (const item of items) {
      const title = Array.isArray(item.title) ? item.title[0] : item.title;
      if (!title) continue;
      const authors = item.author
        ? item.author.map((a: any) => `${a.given || ""} ${a.family || ""}`.trim()).filter(Boolean).slice(0, 3).join(", ")
        : "Penulis Tidak Ditentukan";
      const publicationYear = item["published-print"]?.["date-parts"]?.[0]?.[0] || item["published-online"]?.["date-parts"]?.[0]?.[0] || new Date().getFullYear();
      const journalName = Array.isArray(item["container-title"]) ? item["container-title"][0] : item["container-title"] || "Jurnal Akademik";
      const doi = item.DOI;
      const paperUrl = item.URL || (doi ? `https://doi.org/${doi}` : "#");
      const verified = Boolean(doi);
      const apaCitation = `${authors} (${publicationYear}). ${title}. ${journalName}.${doi ? ` https://doi.org/${doi}` : ""}`;

      papers.push({
        title,
        authors,
        year: publicationYear,
        journal: journalName,
        doi,
        url: paperUrl,
        source: "Crossref",
        verified,
        citation_apa: apaCitation,
      });
    }
    return papers;
  } catch (err) {
    console.error("Crossref search error:", err);
    return [];
  }
}

async function searchAcademicReferences(options: { query: string; course_name?: string; start_year?: number; end_year?: number; limit?: number }): Promise<AcademicPaper[]> {
  const { query, course_name, start_year = 2021, end_year = 2026, limit = 5 } = options;
  const keywords = extractKeywords(query, course_name);
  if (!keywords) return [];

  const papers = await searchOpenAlex(keywords, start_year, end_year, limit);
  if (papers.length < limit) {
    const crossrefPapers = await searchCrossref(keywords, start_year, end_year, limit - papers.length);
    const existingTitles = new Set(papers.map((p) => p.title.toLowerCase()));
    for (const cp of crossrefPapers) {
      if (!existingTitles.has(cp.title.toLowerCase())) {
        papers.push(cp);
      }
    }
  }
  return papers.slice(0, limit);
}

function buildAssignmentPrompt(req: any): string {
  const refText =
    req.references && req.references.length > 0
      ? req.references
          .map(
            (r: any, i: number) =>
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
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
    } = body;

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY belum diset pada Supabase Edge Function Secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let foundReferences: AcademicPaper[] = [];
    if (search_references) {
      foundReferences = await searchAcademicReferences({
        query: question,
        course_name,
        start_year,
        end_year,
        limit: ref_count || 5,
      });
    }

    const prompt = buildAssignmentPrompt({
      course_name,
      assignment_type,
      question,
      instructions,
      writing_style,
      length,
      references: foundReferences,
    });

    const modelName = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API Error:", errText);
      return new Response(
        JSON.stringify({ error: "Gagal berkomunikasi dengan Gemini AI API: " + geminiRes.statusText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    const aiAnswer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiAnswer) {
      return new Response(
        JSON.stringify({ error: "Gemini AI tidak memberikan respons teks." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const savedAssignmentId = Math.random().toString(36).substring(2, 10);

    return new Response(
      JSON.stringify({
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
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Generate Assignment Function Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Terjadi kesalahan internal Edge Function." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
