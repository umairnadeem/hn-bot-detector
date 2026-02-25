# HN Bot Detector

Detect LLM-generated comments on Hacker News. Paste any comment URL or ID and see how it scores — with a full breakdown of which signals fired and why.

Built after getting banned from HN for LLM-assisted posting. Consider this penance.

## Features

- **Comment Lookup** (hero feature) — Paste any HN comment URL or ID, get an instant bot score + signal breakdown
- **Username Analyzer** — Analyze any HN user's last 50 comments
- **Post Scanner** (`/post/[id]`) — Scan all comments on a post, sorted by bot likelihood
- **Export** — Download results as JSON
- **Optional OpenAI detection** — Uses GPT-4o-mini when `OPENAI_API_KEY` is set

## Scoring Pipeline

Each comment is scored 0–100 (100 = definitely bot). Here's every signal:

### 1. Phrase Detection — vector similarity, not hardcoded regex

Instead of exact string matching, the algorithm builds character n-gram TF-IDF vectors for each phrase and compares them against sliding word windows in the comment. Any window with cosine similarity > 0.75 is flagged. This catches paraphrases, not just exact matches.

LLM phrase vocabulary includes:
- Transition filler: "additionally", "furthermore", "moreover", "that being said", "with that said", "having said that", "on the other hand"
- Formal hedges: "it is worth noting", "it is important to note", "it is crucial", "it goes without saying", "needless to say", "one could argue", "broadly speaking"
- Insight markers: "is the real insight here", "the key insight", "the key takeaway", "the key unlock", "the core insight", "at its core", "in other words", "to put it simply"
- Buzzwords: "leverage", "utilize", "robust", "seamless", "cutting-edge", "paradigm", "synergy", "scalable", "streamline", "foster", "empower", "revolutionize", "transformative", "holistic", "delve into", "in the realm of"

### 2. Structural Signals

- **No contractions** in 100+ word comment (+10) — LLMs default to formal prose
- **Word count 150–400** (+5) — suspiciously consistent length
- **3-paragraph structure, 1-2 sentences each** (+20) — extremely common LLM output pattern
- **Perfect 3-part structure** (thesis / body / conclusion paragraphs) (+10)
- **Personal anecdotes present** (-10) — genuine human signal, reduces score

### 3. Unicode/Typographic Signals

- **Curly/smart quotes** `" " ' '` (U+201C/D, U+2018/9) (+8 each, max +20) — LLMs output Unicode typographic quotes by default. Humans typing into a browser text box almost never produce these — keyboards output straight ASCII `"` and `'`. Finding curly quotes in a plain-text HN comment is a strong signal the text was generated elsewhere and pasted in.
- **Em dash** `—` (U+2014) (+5 each, max +15) — LLMs overuse the em dash
- **En-dash** `–` (U+2013) as separator (+5 each, max +15) — used when users prompt LLMs to replace em dashes
- **Rightwards arrow** `→` (U+2192) (+10 each, max +20) — strong LLM signal for showing logical flow

### 4. List Structure Signals

- **Numbered lists** `1. ... 2. ...` (+15, or +25 if 3+ items) — classic LLM formatting
- **Examples in threes** — "for example X, Y, and Z", exactly 3 bullet points, etc. (+12) — LLMs default to 3 examples

### 5. False Personal Framing

LLMs fake personal experience before making generic claims:
- "In practice, I've found..." (+8)
- "In my experience, the..." (+8)
- "The question is whether..." (+8) — common LLM closing move
- "What remains to be seen..." (+8)

### 6. Timing Signals (user-level, across all comments)

- More than 5 comments in 24 hours (+20)
- More than 15 comments in 7 days (+15)
- Average posting interval under 30 minutes (+15)

### 7. Semantic Similarity (user-level, TF-IDF cosine similarity)

Computes average pairwise cosine similarity across a user's comments. LLM comments from the same user cluster semantically.

- Avg similarity > 0.4: +20 pts
- Avg similarity > 0.6: +30 pts

### 8. OpenAI Detection (optional)

When `OPENAI_API_KEY` is set, sends each comment to GPT-4o-mini for AI detection. Score applied at 0.5 weight.

### Verdict Thresholds

| Score | Verdict |
|-------|---------|
| 60–100 | LIKELY BOT |
| 30–59 | POSSIBLY BOT |
| 0–29 | LIKELY HUMAN |

## Getting Started

```bash
git clone https://github.com/umairnadeem/hn-bot-detector.git
cd hn-bot-detector
pnpm install
cp .env.example .env.local  # optional: add OPENAI_API_KEY
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Routes

```
GET /api/analyze/comment?id=<comment_id>   — Score a single comment
GET /api/analyze/user?username=<username>  — Analyze last 50 comments for a user
GET /api/analyze/post?id=<post_id>         — Analyze all comments on a post
```

All return JSON with full scoring breakdowns.

## Tech Stack

- Next.js 14 (App Router), TypeScript strict mode
- Tailwind CSS with HN-inspired design (orange, cream, Verdana)
- HN Algolia API
- Character n-gram TF-IDF cosine similarity (custom, no dependencies)
- GPT-4o-mini (optional)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | Enables GPT-4o-mini AI detection |

## License

MIT
