import { stripHtml } from "./hn";
import { computeAverageSimilarity } from "./similarity";
import {
  CommentAnalysis,
  FlaggedPhrase,
  HNComment,
  ScoringBreakdown,
  UserAnalysis,
  Verdict,
} from "./types";

// --- LLM-Characteristic Phrases ---

const LLM_PHRASES: string[] = [
  "at its core",
  "it is worth noting",
  "importantly",
  "in conclusion",
  "it is important to note",
  "this is particularly",
  "it is crucial",
  "fundamentally",
  "one could argue",
  "broadly speaking",
  "additionally",
  "furthermore",
  "moreover",
  "in summary",
  "to summarize",
  "it goes without saying",
  "needless to say",
  "it is essential",
  "in this context",
  "with that said",
  "that being said",
  "having said that",
  "on the other hand",
  "in other words",
  "to put it simply",
  "it is worth mentioning",
  "as previously mentioned",
  "as noted above",
  "delve into",
  "in the realm of",
  "landscape",
  "paradigm",
  "leverage",
  "utilize",
  "robust",
  "seamless",
  "cutting-edge",
  "game-changer",
  "holistic",
  "synergy",
  "scalable",
  "streamline",
  "foster",
  "empower",
  "revolutionize",
  "transformative",
  "is the real insight here",
  "is the key insight",
  "the real insight is",
  "the key takeaway",
  "the real question is",
  "the key unlock",
  "the core insight",
  "the underlying insight",
];

// --- Character N-gram TF-IDF Vector Similarity ---

interface NGramVector {
  [ngram: string]: number;
}

function charNgrams(text: string, n: number): string[] {
  const normalized = text.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const grams: string[] = [];
  for (let i = 0; i <= normalized.length - n; i++) {
    grams.push(normalized.substring(i, i + n));
  }
  return grams;
}

function buildNgramVector(text: string): NGramVector {
  const vec: NGramVector = {};
  // Use character n-grams of sizes 2, 3, and 4
  for (const n of [2, 3, 4]) {
    for (const gram of charNgrams(text, n)) {
      vec[gram] = (vec[gram] || 0) + 1;
    }
  }
  // Normalize to TF
  const values = Object.values(vec);
  const total = values.reduce((a, b) => a + b, 0) || 1;
  for (const k of Object.keys(vec)) {
    vec[k] /= total;
  }
  return vec;
}

function cosineSim(a: NGramVector, b: NGramVector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const k of Object.keys(a)) {
    const av = a[k];
    normA += av * av;
    if (b[k] !== undefined) {
      dot += av * b[k];
    }
  }
  for (const k of Object.keys(b)) {
    normB += b[k] * b[k];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// Pre-compute vectors for all LLM phrases
const PHRASE_VECTORS: { phrase: string; vector: NGramVector }[] =
  LLM_PHRASES.map((phrase) => ({
    phrase,
    vector: buildNgramVector(phrase),
  }));

// Points assigned per phrase by category
const PHRASE_POINTS: Record<string, number> = {};
for (const p of LLM_PHRASES) {
  // Multi-word phrases get more points than single-word buzzwords
  PHRASE_POINTS[p] = p.includes(" ") ? 10 : 6;
}

function extractWordWindows(text: string): { window: string; index: number }[] {
  const words = text.split(/\s+/);
  const windows: { window: string; index: number }[] = [];
  let charPos = 0;

  for (let i = 0; i < words.length; i++) {
    // Find actual position of this word in original text
    const wordStart = text.indexOf(words[i], charPos);
    charPos = wordStart + words[i].length;

    // Generate windows of size 2 through 5 (bigrams to 5-grams)
    for (let size = 2; size <= 5 && i + size <= words.length; size++) {
      const windowWords = words.slice(i, i + size);
      windows.push({
        window: windowWords.join(" "),
        index: wordStart,
      });
    }
    // Also include single words (for single-word buzzwords)
    windows.push({ window: words[i], index: wordStart });
  }

  return windows;
}

const SIMILARITY_THRESHOLD = 0.75;

function detectPhrases(text: string): {
  score: number;
  flagged: FlaggedPhrase[];
  details: string[];
  matchedPhrases: string[];
} {
  let score = 0;
  const flagged: FlaggedPhrase[] = [];
  const details: string[] = [];
  const matchedPhrases: string[] = [];
  const alreadyMatched = new Set<string>();

  const windows = extractWordWindows(text);

  for (const { window, index } of windows) {
    const windowVec = buildNgramVector(window);

    for (const { phrase, vector } of PHRASE_VECTORS) {
      if (alreadyMatched.has(phrase)) continue;

      const sim = cosineSim(windowVec, vector);
      if (sim >= SIMILARITY_THRESHOLD) {
        const pts = PHRASE_POINTS[phrase];
        score += pts;
        alreadyMatched.add(phrase);
        matchedPhrases.push(phrase);
        flagged.push({
          phrase,
          index,
          length: window.length,
          points: pts,
        });
        details.push(
          `Phrase "${phrase}" detected (similarity ${sim.toFixed(2)}) (+${pts})`
        );
      }
    }
  }

  // Check for 3-part structure (thesis, body, conclusion)
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length === 3) {
    const [first, , third] = paragraphs;
    const hasThesis = first.length < 300 && !first.includes("\n");
    const hasConclusion =
      /\b(in conclusion|overall|ultimately|in summary|to summarize)\b/i.test(
        third
      ) || third.length < 300;
    if (hasThesis && hasConclusion) {
      score += 10;
      details.push("Perfect 3-part structure detected (+10)");
    }
  }

  return { score: Math.min(score, 40), flagged, details, matchedPhrases };
}

// --- New Signals ---

function detectCurlyQuotes(text: string): {
  score: number;
  details: string[];
} {
  const curlyPattern = /[\u201C\u201D\u2018\u2019]/g;
  const matches = text.match(curlyPattern);
  const count = matches ? matches.length : 0;
  if (count === 0) return { score: 0, details: [] };

  const pts = Math.min(count * 8, 20);
  return {
    score: pts,
    details: [`Smart/curly quotes detected (${count} found) (+${pts})`],
  };
}

function detectNumberedLists(text: string): {
  score: number;
  details: string[];
} {
  // Detect numbered list items: lines starting with "N. " or inline "N. "
  const numberedItems = text.match(/(?:^|\n)\s*(\d+)\.\s/g);
  if (!numberedItems || numberedItems.length < 2) return { score: 0, details: [] };

  // Extract the actual numbers to verify sequential pattern
  const numbers = numberedItems.map((m) => {
    const match = m.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });

  // Check that it starts with 1 and has 2
  const has1 = numbers.includes(1);
  const has2 = numbers.includes(2);
  if (!has1 || !has2) return { score: 0, details: [] };

  const itemCount = numbers.length;
  const pts = itemCount >= 3 ? 25 : 15;
  return {
    score: pts,
    details: [
      `Numbered list detected (${itemCount} items) (+${pts})`,
    ],
  };
}

function detectExamplesInThrees(text: string): {
  score: number;
  details: string[];
} {
  // Pattern 1: "for example, X, Y, and Z"
  const forExampleThree =
    /for example,?\s+\w[\w\s]*,\s+\w[\w\s]*,\s+and\s+\w/i;

  // Pattern 2: "such as X, Y, and Z"
  const suchAsThree = /such as\s+\w[\w\s]*,\s+\w[\w\s]*,\s+and\s+\w/i;

  // Pattern 3: "X, Y, and Z" — generic three-item comma list ending with "and"
  const threeItemList = /\w+,\s+\w+,\s+and\s+\w+/i;

  // Pattern 4: exactly 3 bullet/numbered points (but not more)
  const bulletPoints = text.match(/(?:^|\n)\s*[-•*]\s+.+/g);
  const exactlyThreeBullets = bulletPoints && bulletPoints.length === 3;

  if (
    forExampleThree.test(text) ||
    suchAsThree.test(text) ||
    exactlyThreeBullets
  ) {
    return {
      score: 12,
      details: ["Examples in threes pattern detected (+12)"],
    };
  }

  // For the generic 3-item list, only count if there are multiple such patterns
  const threeItemMatches = text.match(
    /\w+,\s+\w+,\s+and\s+\w+/gi
  );
  if (threeItemMatches && threeItemMatches.length >= 2) {
    return {
      score: 12,
      details: ["Multiple three-item lists detected (+12)"],
    };
  }

  return { score: 0, details: [] };
}

function detectEmDashOveruse(text: string): {
  score: number;
  details: string[];
} {
  const emDashCount = (text.match(/\u2014/g) || []).length;
  if (emDashCount === 0) return { score: 0, details: [] };

  const pts = Math.min(emDashCount * 5, 15);
  return {
    score: pts,
    details: [`Em dash overuse (${emDashCount} found) (+${pts})`],
  };
}

function detectEnDash(text: string): {
  score: number;
  details: string[];
} {
  // En-dash (–) used as a clause separator — LLMs substitute this for em-dash
  const enDashCount = (text.match(/\u2013/g) || []).length;
  if (enDashCount === 0) return { score: 0, details: [] };
  const pts = Math.min(enDashCount * 5, 15);
  return {
    score: pts,
    details: [`En-dash used as separator (${enDashCount} found) (+${pts})`],
  };
}

function detectArrow(text: string): {
  score: number;
  details: string[];
} {
  // → (U+2192) is a strong LLM signal — used to show logical flow
  const arrowCount = (text.match(/\u2192/g) || []).length;
  if (arrowCount === 0) return { score: 0, details: [] };
  const pts = Math.min(arrowCount * 10, 20);
  return {
    score: pts,
    details: [`Rightwards arrow → used (${arrowCount} found) (+${pts})`],
  };
}

function detectThreeParagraphStructure(text: string): {
  score: number;
  details: string[];
} {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0);
  if (paragraphs.length !== 3) return { score: 0, details: [] };

  // Count sentences per paragraph (split on . ! ? followed by space or end)
  const sentenceCount = (p: string) =>
    (p.match(/[.!?](?:\s|$)/g) || []).length || 1;

  const counts = paragraphs.map(sentenceCount);
  const allShort = counts.every((c) => c <= 2);

  if (!allShort) return { score: 0, details: [] };

  return {
    score: 20,
    details: [
      `Classic 3-paragraph structure (${counts.join("/")}) sentences each (+20)`,
    ],
  };
}

function detectFalsePersonalFraming(text: string): {
  score: number;
  details: string[];
} {
  // LLMs fake personal experience then pivot to generic claims
  const falsePhrases = [
    /in practice,?\s+i'?ve found/i,
    /in my experience,?\s+(the|this|it|most|many)/i,
    /i'?ve noticed that\s+(the|this|it|most|many)/i,
    /the question is whether/i,
    /what remains to be seen/i,
    /time will tell (whether|if)/i,
  ];

  const matched: string[] = [];
  for (const re of falsePhrases) {
    const m = text.match(re);
    if (m) matched.push(m[0]);
  }

  if (matched.length === 0) return { score: 0, details: [] };
  const pts = Math.min(matched.length * 8, 20);
  return {
    score: pts,
    details: matched.map((m) => `False personal framing: "${m}" (+8)`),
  };
}

// --- Structural Signals ---

function analyzeStructure(text: string): {
  score: number;
  details: string[];
} {
  let score = 0;
  const details: string[] = [];

  // No contractions check
  const commonContractions =
    /\b(don't|doesn't|won't|can't|shouldn't|wouldn't|couldn't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|I'm|I've|I'd|I'll|we're|we've|they're|they've|it's|that's|there's|what's|who's|let's)\b/i;
  if (!commonContractions.test(text) && text.length > 100) {
    score += 10;
    details.push("No contractions used (+10)");
  }

  // Word count consistency check (for single comment, just flag the range)
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 150 && wordCount <= 400) {
    score += 5;
    details.push(
      `Word count in suspicious range: ${wordCount} words (+5)`
    );
  }

  // No personal anecdotes (negative signal — reduces score)
  const personalAnecdotes =
    /\b(I once|at my company|last week I|in my experience|I remember when|at my job|my team|I personally)\b/i;
  if (personalAnecdotes.test(text)) {
    score -= 10;
    details.push("Personal anecdote detected (-10)");
  }

  return { score: Math.max(score, 0), details };
}

// --- Timing Signals ---

function analyzeTimings(comments: HNComment[]): {
  score: number;
  details: string[];
} {
  if (comments.length < 2) return { score: 0, details: [] };

  let score = 0;
  const details: string[] = [];

  const timestamps = comments
    .map((c) => c.created_at_i)
    .sort((a, b) => a - b);

  // Comments in 24h window
  const now = timestamps[timestamps.length - 1];
  const last24h = timestamps.filter((t) => now - t < 86400);
  if (last24h.length > 5) {
    score += 20;
    details.push(`${last24h.length} comments in 24h window (+20)`);
  }

  // Comments in 7d window
  const last7d = timestamps.filter((t) => now - t < 604800);
  if (last7d.length > 15) {
    score += 15;
    details.push(`${last7d.length} comments in 7-day window (+15)`);
  }

  // Average interval
  const intervals: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }
  const avgInterval =
    intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const avgMinutes = avgInterval / 60;
  if (avgMinutes < 30) {
    score += 15;
    details.push(
      `Average posting interval: ${avgMinutes.toFixed(1)} min (+15)`
    );
  }

  return { score: Math.min(score, 50), details };
}

// --- OpenAI Detection (optional) ---

async function openaiDetection(
  text: string
): Promise<{ score: number; details: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { score: 0, details: [] };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              'You detect AI-generated text. Analyze the following comment and reply with JSON only: { "score": 0-100, "reasons": ["reason1", "reason2"] }',
          },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!res.ok) return { score: 0, details: ["OpenAI API error"] };

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(content);
    const weighted = Math.round(parsed.score * 0.5);

    return {
      score: weighted,
      details: [
        `OpenAI detection: ${parsed.score}/100 (weighted: ${weighted})`,
        ...parsed.reasons.map((r: string) => `  - ${r}`),
      ],
    };
  } catch {
    return { score: 0, details: ["OpenAI detection failed"] };
  }
}

// --- Exported: Get Phrase Matches ---

export function getPhraseMatches(text: string): string[] {
  const { matchedPhrases } = detectPhrases(text);
  const result = [...matchedPhrases];

  // Also include new signal pattern labels
  const curlyQuotePattern = /[\u201C\u201D\u2018\u2019]/g;
  if (curlyQuotePattern.test(text)) {
    result.push("smart/curly quotes");
  }

  const numberedItems = text.match(/(?:^|\n)\s*(\d+)\.\s/g);
  if (numberedItems && numberedItems.length >= 2) {
    result.push("numbered list");
  }

  const { score: threesScore } = detectExamplesInThrees(text);
  if (threesScore > 0) {
    result.push("examples in threes");
  }

  const emDashCount = (text.match(/\u2014/g) || []).length;
  if (emDashCount > 0) result.push("em dash overuse");

  const enDashCount = (text.match(/\u2013/g) || []).length;
  if (enDashCount > 0) result.push("en-dash as separator");

  const arrowCount = (text.match(/\u2192/g) || []).length;
  if (arrowCount > 0) result.push("→ arrow used");

  const { score: framingScore } = detectFalsePersonalFraming(text);
  if (framingScore > 0) result.push("false personal framing");

  const { score: threeParaScore } = detectThreeParagraphStructure(text);
  if (threeParaScore > 0) result.push("3-paragraph structure");

  return result;
}

// --- Main Scoring Pipeline ---

export async function scoreComment(
  comment: HNComment,
  useOpenAI = false
): Promise<CommentAnalysis> {
  const cleanText = stripHtml(comment.comment_text || "");

  const phrase = detectPhrases(cleanText);
  const structure = analyzeStructure(cleanText);
  const curlyQuotes = detectCurlyQuotes(cleanText);
  const numberedLists = detectNumberedLists(cleanText);
  const examplesInThrees = detectExamplesInThrees(cleanText);
  const emDash = detectEmDashOveruse(cleanText);
  const enDash = detectEnDash(cleanText);
  const arrow = detectArrow(cleanText);
  const falseFraming = detectFalsePersonalFraming(cleanText);
  const threePara = detectThreeParagraphStructure(cleanText);
  const openai = useOpenAI
    ? await openaiDetection(cleanText)
    : { score: 0, details: [] };

  const totalScore = Math.min(
    100,
    Math.max(
      0,
      phrase.score +
        structure.score +
        curlyQuotes.score +
        numberedLists.score +
        examplesInThrees.score +
        emDash.score +
        enDash.score +
        arrow.score +
        falseFraming.score +
        threePara.score +
        openai.score
    )
  );

  const breakdown: ScoringBreakdown = {
    phraseDetection: phrase.score,
    structuralSignals: structure.score,
    curlyQuotes: curlyQuotes.score,
    numberedLists: numberedLists.score,
    examplesInThrees: examplesInThrees.score,
    emDashOveruse: emDash.score,
    timingSignals: 0,
    semanticSimilarity: 0,
    openaiDetection: openai.score,
    details: [
      ...phrase.details,
      ...structure.details,
      ...curlyQuotes.details,
      ...numberedLists.details,
      ...examplesInThrees.details,
      ...emDash.details,
      ...enDash.details,
      ...arrow.details,
      ...falseFraming.details,
      ...threePara.details,
      ...openai.details,
    ],
  };

  return {
    comment,
    score: totalScore,
    breakdown,
    flaggedPhrases: phrase.flagged,
    cleanText,
  };
}

export async function analyzeUser(
  comments: HNComment[],
  useOpenAI = false
): Promise<UserAnalysis> {
  if (comments.length === 0) {
    return {
      username: "unknown",
      totalComments: 0,
      averageScore: 0,
      verdict: "LIKELY HUMAN",
      confidence: 0,
      comments: [],
      timingScore: 0,
      similarityScore: 0,
    };
  }

  const username = comments[0].author;

  // Score individual comments
  const analyses = await Promise.all(
    comments.map((c) => scoreComment(c, useOpenAI))
  );

  // Timing analysis (across all comments)
  const timing = analyzeTimings(comments);

  // Semantic similarity
  const cleanTexts = analyses
    .map((a) => a.cleanText)
    .filter((t) => t.length > 50);
  const avgSimilarity = computeAverageSimilarity(cleanTexts);

  let similarityScore = 0;
  const similarityDetails: string[] = [];
  if (avgSimilarity > 0.6) {
    similarityScore = 30;
    similarityDetails.push(
      `Very high semantic similarity: ${avgSimilarity.toFixed(3)} (+30)`
    );
  } else if (avgSimilarity > 0.4) {
    similarityScore = 20;
    similarityDetails.push(
      `High semantic similarity: ${avgSimilarity.toFixed(3)} (+20)`
    );
  }

  // Add timing and similarity scores to each comment's breakdown
  for (const analysis of analyses) {
    analysis.breakdown.timingSignals = timing.score;
    analysis.breakdown.semanticSimilarity = similarityScore;
    analysis.breakdown.details.push(...timing.details, ...similarityDetails);
    analysis.score = Math.min(
      100,
      Math.max(
        0,
        analysis.score + timing.score / comments.length + similarityScore / comments.length
      )
    );
  }

  // Calculate average score (include timing and similarity in the average)
  const baseAvg =
    analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;
  const overallScore = Math.min(
    100,
    baseAvg + timing.score * 0.3 + similarityScore * 0.3
  );

  const { verdict, confidence } = getVerdict(overallScore);

  return {
    username,
    totalComments: comments.length,
    averageScore: Math.round(overallScore),
    verdict,
    confidence,
    comments: analyses,
    timingScore: timing.score,
    similarityScore,
  };
}

export function getVerdict(score: number): { verdict: Verdict; confidence: number } {
  if (score >= 60) {
    return {
      verdict: "LIKELY BOT",
      confidence: Math.min(99, Math.round(50 + score * 0.5)),
    };
  }
  if (score >= 30) {
    return {
      verdict: "POSSIBLY BOT",
      confidence: Math.round(30 + score * 0.4),
    };
  }
  return {
    verdict: "LIKELY HUMAN",
    confidence: Math.min(99, Math.round(90 - score)),
  };
}
