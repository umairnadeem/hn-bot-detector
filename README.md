# HN Bot Detector

Detect LLM-generated and bot comments on Hacker News. Analyzes comment patterns, timing, semantic similarity, and linguistic signals to score how likely a user's comments are AI-generated.

## Features

- **Username Analyzer** (`/`) — Analyze any HN user's last 50 comments
- **Post Scanner** (`/post/scan` or `/post/[id]`) — Scan all comments on a post, sorted by bot likelihood
- **Export** — Download analysis results as JSON
- **Optional AI detection** — Uses GPT-4o-mini when `OPENAI_API_KEY` is set

## Scoring Pipeline

Each comment is scored 0–100 (100 = definitely bot):

### 1. Phrase Detection (+5–15 pts each)
Flags known LLM-isms: "at its core", "it is worth noting", "importantly", "in conclusion", "it is crucial", "fundamentally", "broadly speaking", "one could argue", etc. Also flags sentences starting with "Additionally,", "Furthermore,", "Moreover," and perfect 3-part thesis/body/conclusion structure.

### 2. Structural Signals
- No contractions in 100+ word comments (+10)
- Liberal em dash (—) usage (+5)
- Word count in 150–400 range (+5)
- Personal anecdotes present (-10, reduces score)

### 3. Timing Signals (across all user comments)
- More than 5 comments in 24 hours (+20)
- More than 15 comments in 7 days (+15)
- Average posting interval under 30 minutes (+15)

### 4. Semantic Similarity (TF-IDF cosine similarity)
- Average pairwise similarity > 0.4: +20 pts
- Average pairwise similarity > 0.6: +30 pts (very suspicious)

### 5. OpenAI Detection (optional)
When `OPENAI_API_KEY` is set, sends each comment to GPT-4o-mini for AI detection. Score is applied with 0.5 weight.

### Verdict
- **LIKELY BOT** — Score >= 60
- **POSSIBLY BOT** — Score 30–59
- **LIKELY HUMAN** — Score < 30

## Getting Started

```bash
# Clone
git clone https://github.com/yourusername/hn-bot-detector.git
cd hn-bot-detector

# Install dependencies
pnpm install

# Optional: add OpenAI key for AI detection
cp .env.example .env.local
# Edit .env.local with your OPENAI_API_KEY

# Run dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Routes

```
GET /api/analyze/user?username=dang     — Analyze a user
GET /api/analyze/post?id=12345          — Analyze a post's comments
```

Both return JSON with full scoring breakdowns.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- HN Algolia API
- TF-IDF cosine similarity (custom implementation)
- GPT-4o-mini (optional)

## Project Structure

```
src/
├── app/
│   ├── api/analyze/
│   │   ├── user/route.ts    # User analysis endpoint
│   │   └── post/route.ts    # Post analysis endpoint
│   ├── post/
│   │   ├── [id]/page.tsx    # Direct post analysis by ID
│   │   └── scan/page.tsx    # Post scanner with input
│   ├── layout.tsx
│   ├── page.tsx             # Username analyzer
│   └── globals.css
├── components/
│   ├── CommentCard.tsx
│   ├── ScoreBadge.tsx
│   └── VerdictBadge.tsx
└── lib/
    ├── types.ts             # TypeScript interfaces
    ├── hn.ts                # HN Algolia API client
    ├── scoring.ts           # Scoring pipeline
    └── similarity.ts        # TF-IDF cosine similarity
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | Enables GPT-4o-mini AI detection (adds weighted score) |

## License

MIT
