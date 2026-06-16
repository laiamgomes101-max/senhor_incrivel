const STOP_WORDS = new Set([
  'de', 'da', 'do', 'dos', 'das', 'e', 'o', 'a', 'os', 'as', 'um', 'uma', 'por', 'para', 'com',
  'em', 'no', 'na', 'nos', 'nas', 'que', 'quem', 'qual', 'como', 'se', 'não', 'é', 'são', 'foi', 'ser',
  'ao', 'aos', 'à', 'às', 'dos', 'das', 'mas', 'pelo', 'pela', 'pelos', 'pelas', 'ou', 'onde', 'quando'
]);

const POSITIVE_WORDS = [
  'ótimo', 'bom', 'excelente', 'sucesso', 'positivo', 'conquista', 'proativo', 'habilidade', 'capaz', 'motivação'
];

const NEGATIVE_WORDS = [
  'ruim', 'fraco', 'erro', 'falha', 'dificuldade', 'problema', 'atraso', 'insucesso', 'incapaz', 'frustrado'
];

function splitWords(text) {
  return text
    .toLowerCase()
    .replace(/[\p{P}$+<=>^`|~]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word));
}

function extractKeywords(text, limit = 10) {
  const frequencies = new Map();
  const words = splitWords(text);

  for (const word of words) {
    frequencies.set(word, (frequencies.get(word) || 0) + 1);
  }

  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function guessSentiment(text) {
  const sanitized = text.toLowerCase();
  let score = 0;

  for (const word of POSITIVE_WORDS) {
    if (sanitized.includes(word)) score += 1;
  }
  for (const word of NEGATIVE_WORDS) {
    if (sanitized.includes(word)) score -= 1;
  }

  if (score > 1) return { label: 'positive', score };
  if (score < -1) return { label: 'negative', score };
  return { label: 'neutral', score };
}

function buildSummary(text, maxLength = 200) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const cut = trimmed.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return cut.slice(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
}

export async function analyzeWithAI(text) {
  const rawText = String(text || '').trim();
  const words = rawText ? rawText.split(/\s+/).filter(Boolean) : [];
  const sentences = rawText ? rawText.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean) : [];
  const keywords = extractKeywords(rawText);
  const sentiment = guessSentiment(rawText);

  return {
    text: rawText,
    analysis: {
      word_count: words.length,
      sentence_count: sentences.length,
      reading_time_minutes: Math.max(1, Math.ceil(words.length / 200)),
      sentiment,
      keywords,
      summary: buildSummary(rawText),
      processed_at: new Date().toISOString()
    }
  };
}
