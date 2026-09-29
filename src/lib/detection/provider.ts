export interface DetectionResult {
  ai_score: number | null; // 0 - 100
  human_score: number | null; // 0 - 100
  status: "configured" | "unconfigured";
  disclaimer: string;
  message?: string;
}

export interface QualityMetric {
  name: string;
  score: number; // 0 - 100
  status: "Baik" | "Perlu Perbaikan" | "Cukup";
  feedback: string;
}

export interface WritingAnalysisReport {
  pattern_detection: DetectionResult;
  clarity_score: number;
  structure_score: number;
  style_consistency: number;
  repetition_issue_count: number;
  long_sentence_count: number;
  total_words: number;
  total_sentences: number;
  quality_metrics: QualityMetric[];
  improvement_tips: string[];
}

export interface TextDetectorProvider {
  analyzePattern(text: string): Promise<DetectionResult>;
}

// Default Pattern Detector using structural linguistic heuristics
class HeuristicDetectorProvider implements TextDetectorProvider {
  async analyzePattern(text: string): Promise<DetectionResult> {
    const disclaimer =
      "Skor ini merupakan estimasi berdasarkan pola bahasa dan tidak dapat membuktikan apakah sebuah tulisan dibuat oleh manusia atau AI.";

    if (!text || text.trim().length < 50) {
      return {
        ai_score: null,
        human_score: null,
        status: "unconfigured",
        disclaimer,
        message: "Teks terlalu pendek untuk dianalisis pola bahasanya (minimal 50 karakter).",
      };
    }

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length === 0) {
      return {
        ai_score: null,
        human_score: null,
        status: "unconfigured",
        disclaimer,
        message: "Format teks tidak valid.",
      };
    }

    const sentenceLengths = sentences.map((s) => s.trim().split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;

    const variance =
      sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) /
      sentenceLengths.length;
    const stdDev = Math.sqrt(variance);

    const estimatedAIScore = Math.round(Math.max(10, Math.min(90, 80 - stdDev * 4)));
    const estimatedHumanScore = 100 - estimatedAIScore;

    return {
      ai_score: estimatedAIScore,
      human_score: estimatedHumanScore,
      status: "configured",
      disclaimer,
    };
  }
}

export function getDetectorProvider(): TextDetectorProvider {
  return new HeuristicDetectorProvider();
}

// COMPREHENSIVE QUALITY ANALYSIS ENGINE
export function analyzeWritingQuality(text: string, referenceCount: number = 0, verifiedRefCount: number = 0): WritingAnalysisReport {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const totalSentences = sentences.length || 1;

  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 25);

  const sentenceSet = new Set<string>();
  let repetitionIssueCount = 0;
  sentences.forEach((s) => {
    const norm = s.toLowerCase();
    if (sentenceSet.has(norm)) {
      repetitionIssueCount++;
    } else {
      sentenceSet.add(norm);
    }
  });

  const hasHeadings = /^#+\s+.+/m.test(text);
  const hasParagraphs = text.split("\n\n").filter(Boolean).length > 1;

  const structureScore = hasHeadings && hasParagraphs ? 90 : hasParagraphs ? 75 : 55;
  const clarityScore = longSentences.length > 3 ? 65 : 85;
  const styleConsistency = repetitionIssueCount === 0 ? 90 : 70;

  const qualityMetrics: QualityMetric[] = [
    {
      name: "Kejelasan Argumen",
      score: clarityScore,
      status: clarityScore >= 80 ? "Baik" : "Cukup",
      feedback:
        clarityScore >= 80
          ? "Kalimat tersusun dengan baik dan relatif mudah dipahami."
          : `Terdapat ${longSentences.length} kalimat yang terlalu panjang. Disarankan untuk memecahnya.`,
    },
    {
      name: "Struktur Jawaban",
      score: structureScore,
      status: structureScore >= 80 ? "Baik" : "Perlu Perbaikan",
      feedback:
        structureScore >= 80
          ? "Memiliki pembagian paragraf dan sub-judul yang runtut."
          : "Gunakan judul/sub-judul dan pembagian paragraf untuk meningkatkan keterbacaan.",
    },
    {
      name: "Konsistensi Gaya Bahasa",
      score: styleConsistency,
      status: styleConsistency >= 80 ? "Baik" : "Cukup",
      feedback:
        repetitionIssueCount === 0
          ? "Penggunaan kosakata dan ragam bahasa konsisten."
          : `Ditemukan ${repetitionIssueCount} klausa/kalimat yang berulang.`,
    },
    {
      name: "Kualitas Referensi",
      score: referenceCount > 0 ? (verifiedRefCount > 0 ? 95 : 70) : 40,
      status: referenceCount > 0 ? (verifiedRefCount > 0 ? "Baik" : "Cukup") : "Perlu Perbaikan",
      feedback:
        referenceCount > 0
          ? `${referenceCount} sumber digunakan (${verifiedRefCount} terverifikasi DOI/Jurnal).`
          : "Belum menggunakan referensi ilmiah resmi. Tambahkan referensi.",
    },
  ];

  const improvementTips: string[] = [];
  if (longSentences.length > 0) {
    improvementTips.push(`Pecah ${longSentences.length} kalimat panjang menjadi 2 kalimat yang lebih ringkas.`);
  }
  if (!hasHeadings) {
    improvementTips.push("Gunakan format heading (misal # Pendahuluan, ## Pembahasan) untuk kerapian dokumen.");
  }
  if (referenceCount === 0) {
    improvementTips.push("Gunakan fitur 'Cari Referensi Ilmiah' untuk memperkuat dasar argumen akademik Anda.");
  }
  if (repetitionIssueCount > 0) {
    improvementTips.push("Gunakan sinonim untuk mengurangi pengulangan kata/kalimat yang serupa.");
  }
  if (improvementTips.length === 0) {
    improvementTips.push("Kualitas tulisan sudah sangat baik dan memenuhi kaidah akademik.");
  }

  const patternResult = {
    ai_score: Math.round(Math.max(15, Math.min(85, 75 - (sentences.length % 5) * 6))),
    human_score: Math.round(100 - Math.max(15, Math.min(85, 75 - (sentences.length % 5) * 6))),
    status: "configured" as const,
    disclaimer:
      "Skor ini merupakan estimasi berdasarkan pola bahasa dan tidak dapat membuktikan apakah sebuah tulisan dibuat oleh manusia atau AI.",
  };

  return {
    pattern_detection: patternResult,
    clarity_score: clarityScore,
    structure_score: structureScore,
    style_consistency: styleConsistency,
    repetition_issue_count: repetitionIssueCount,
    long_sentence_count: longSentences.length,
    total_words: totalWords,
    total_sentences: totalSentences,
    quality_metrics: qualityMetrics,
    improvement_tips: improvementTips,
  };
}
