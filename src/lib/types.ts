export interface HNComment {
  objectID: string;
  author: string;
  comment_text: string;
  story_title: string | null;
  story_id: number | null;
  parent_id: number | null;
  created_at: string;
  created_at_i: number;
  points: number | null;
  num_comments: number | null;
}

export interface HNSearchResponse {
  hits: HNComment[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
}

export interface FlaggedPhrase {
  phrase: string;
  index: number;
  length: number;
  points: number;
}

export interface ScoringBreakdown {
  phraseDetection: number;
  structuralSignals: number;
  timingSignals: number;
  semanticSimilarity: number;
  openaiDetection: number;
  details: string[];
}

export interface CommentAnalysis {
  comment: HNComment;
  score: number;
  breakdown: ScoringBreakdown;
  flaggedPhrases: FlaggedPhrase[];
  cleanText: string;
}

export type Verdict = "LIKELY BOT" | "POSSIBLY BOT" | "LIKELY HUMAN";

export interface UserAnalysis {
  username: string;
  totalComments: number;
  averageScore: number;
  verdict: Verdict;
  confidence: number;
  comments: CommentAnalysis[];
  timingScore: number;
  similarityScore: number;
}

export interface PostAnalysis {
  postId: string;
  storyTitle: string | null;
  commenters: {
    username: string;
    averageScore: number;
    verdict: Verdict;
    commentCount: number;
    comments: CommentAnalysis[];
  }[];
}
