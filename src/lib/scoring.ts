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

// --- Phrase Detection ---

const BOT_PHRASES: { pattern: RegExp; points: number; label: string }[] = [
  { pattern: /\bat its core\b/gi, points: 10, label: "at its core" },
  {
    pattern: /\bit is worth noting\b/gi,
    points: 10,
    label: "it is worth noting",
  },
  { pattern: /\bimportantly\b/gi, points: 5, label: "importantly" },
  { pattern: /\bin conclusion\b/gi, points: 10, label: "in conclusion" },
  {
    pattern: /\bit is important to\b/gi,
    points: 10,
    label: "it is important to",
  },
  {
    pattern: /\bthis is particularly\b/gi,
    points: 8,
    label: "this is particularly",
  },
  { pattern: /\bit is crucial\b/gi, points: 10, label: "it is crucial" },
  { pattern: /\bfundamentally\b/gi, points: 8, label: "fundamentally" },
  {
    pattern: /\bI think it is safe to say\b/gi,
    points: 15,
    label: "I think it is safe to say",
  },
  {
    pattern: /\bone could argue\b/gi,
    points: 10,
    label: "one could argue",
  },
  {
    pattern: /\bbroadly speaking\b/gi,
    points: 10,
    label: "broadly speaking",
  },
  {
    pattern: /^Additionally,/gim,
    points: 8,
    label: 'Sentence starting with "Additionally,"',
  },
  {
    pattern: /^Furthermore,/gim,
    points: 8,
    label: 'Sentence starting with "Furthermore,"',
  },
  {
    pattern: /^Moreover,/gim,
    points: 8,
    label: 'Sentence starting with "Moreover,"',
  },
];

function detectPhrases(text: string): {
  score: number;
  flagged: FlaggedPhrase[];
  details: string[];
} {
  let score = 0;
  const flagged: FlaggedPhrase[] = [];
  const details: string[] = [];

  for (const { pattern, points, label } of BOT_PHRASES) {
    // Reset regex state
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      score += points;
      flagged.push({
        phrase: label,
        index: match.index,
        length: match[0].length,
        points,
      });
      details.push(`Phrase "${label}" detected (+${points})`);
    }
  }

  // Check for 3-part structure (thesis, body, conclusion)
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length === 3) {
    const [first, , third] = paragraphs;
    const hasThesis =
      first.length < 300 && !first.includes("\n");
    const hasConclusion =
      /\b(in conclusion|overall|ultimately|in summary|to summarize)\b/i.test(
        third
      ) || third.length < 300;
    if (hasThesis && hasConclusion) {
      score += 10;
      details.push("Perfect 3-part structure detected (+10)");
    }
  }

  return { score: Math.min(score, 40), flagged, details };
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

  // Em dash usage
  const emDashCount = (text.match(/—/g) || []).length;
  if (emDashCount >= 2) {
    score += 5;
    details.push(`Liberal em dash usage (${emDashCount} found) (+5)`);
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

// --- Main Scoring Pipeline ---

export async function scoreComment(
  comment: HNComment,
  useOpenAI = false
): Promise<CommentAnalysis> {
  const cleanText = stripHtml(comment.comment_text || "");

  const phrase = detectPhrases(cleanText);
  const structure = analyzeStructure(cleanText);
  const openai = useOpenAI
    ? await openaiDetection(cleanText)
    : { score: 0, details: [] };

  const totalScore = Math.min(
    100,
    Math.max(0, phrase.score + structure.score + openai.score)
  );

  const breakdown: ScoringBreakdown = {
    phraseDetection: phrase.score,
    structuralSignals: structure.score,
    timingSignals: 0,
    semanticSimilarity: 0,
    openaiDetection: openai.score,
    details: [...phrase.details, ...structure.details, ...openai.details],
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
