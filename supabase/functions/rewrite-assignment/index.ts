const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildRewritePrompt(req: any): string {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, original_question, current_answer } = body;

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY belum diset pada Supabase Edge Function Secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = buildRewritePrompt({
      action,
      original_question,
      current_answer,
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
      console.error("Gemini Rewrite Error:", errText);
      return new Response(
        JSON.stringify({ error: "Gagal berkomunikasi dengan Gemini AI API: " + geminiRes.statusText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    const newAnswer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!newAnswer) {
      return new Response(
        JSON.stringify({ error: "Gemini AI tidak memberikan respons revisi." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        new_answer: newAnswer,
        action,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Rewrite Assignment Function Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Terjadi kesalahan internal Edge Function." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
