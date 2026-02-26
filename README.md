# HN Bot Detector

Detects LLM-generated comments on Hacker News. Paste a comment URL, ID, or raw text and get a score plus a breakdown of which signals fired.

Built after getting banned from HN for LLM-assisted posting. This is penance.

## What it does

- **Comment lookup** - paste an HN comment URL, ID, or raw text, get an instant bot score
- **Username analyzer** - scores a user's last 50 comments
- **Post scanner** (`/post/[id]`) - scans all comments on a post, sorted by bot score
- **Export** - download results as JSON
- Anthropic (Claude Haiku) and OpenAI (GPT-4o-mini) detection passes when API keys are set

## How scoring works

Each comment is scored 0-100. Here's what we check:

### Phrase detection

Uses character n-gram TF-IDF vectors rather than exact regex, so it catches paraphrases too (similarity threshold: 0.75). The phrase vocabulary includes:

- Transition filler: "additionally", "furthermore", "moreover", "that being said", "having said that"
- Formal hedges: "it is worth noting", "it is crucial", "needless to say", "one could argue"
- Insight markers: "the real insight here", "the key takeaway", "the key unlock", "at its core"
- Buzzwords: "leverage", "utilize", "robust", "seamless", "paradigm", "synergy", "delve into"

### Structure

- No contractions in 100+ word comment (+10)
- Word count between 150-400 (+5)
- Exactly 3 paragraphs, 1-2 sentences each (+20) - extremely common LLM output shape
- Classic thesis/body/conclusion structure (+10)
- Personal anecdotes present (-10)

### Unicode signals

These are the subtle ones. Keyboards output straight ASCII quotes. LLMs output typographic Unicode quotes. If you see curly quotes in a plain-text HN comment, the text was written somewhere else and pasted in.

- Curly/smart quotes `" " ' '` (U+201C/D, U+2018/9) - +8 per occurrence, max +20
- Em dash `—` (U+2014) - +5 per, max +15
- En-dash `–` (U+2013) as separator - +5 per, max +15 (used when people prompt LLMs to replace em dashes to evade detection)
- Rightwards arrow `->` (U+2192) - +10 per, max +20

### List patterns

- Numbered lists `1. 2. 3.` (+15, or +25 if 3+ items)
- Examples always in threes: "for example X, Y, and Z" (+12)

### False personal framing

LLMs fake personal experience before making generic claims:
- "In practice, I've found..." (+8)
- "In my experience, the..." (+8)
- "The question is whether..." (+8)
- "What remains to be seen..." (+8)

### Timing (user-level)

- More than 5 comments in 24 hours (+20)
- More than 15 comments in 7 days (+15)
- Average interval under 30 minutes (+15)

### Semantic similarity (user-level)

LLM comments from the same user tend to cluster together in vector space. We compute pairwise TF-IDF cosine similarity across a user's comments:

- Avg similarity > 0.4: +20 pts
- Avg similarity > 0.6: +30 pts

### LLM detection pass (optional)

Set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in `.env.local` to run a Claude Haiku or GPT-4o-mini pass on top of the heuristics. Scores are weighted at 0.6 and 0.5 respectively.

### Verdicts

| Score | Verdict |
|-------|---------|
| 60-100 | LIKELY BOT |
| 30-59 | POSSIBLY BOT |
| 0-29 | LIKELY HUMAN |

## Getting started

```bash
git clone https://github.com/umairnadeem/hn-bot-detector.git
cd hn-bot-detector
pnpm install
cp .env.example .env.local
pnpm dev
```

## API

```
GET  /api/analyze/comment?id=<id>        score a single comment by HN ID or URL
POST /api/analyze/comment                score raw text (body: { text: string })
GET  /api/analyze/user?username=<user>   analyze last 50 comments for a user
GET  /api/analyze/post?id=<id>           analyze all comments on a post
```

All return JSON with full scoring breakdowns.

## Stack

- Next.js 14, TypeScript strict mode
- Tailwind CSS, HN-style design
- HN Algolia API
- TF-IDF cosine similarity (no external dependencies)

## Environment variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude Haiku detection pass (recommended) |
| `OPENAI_API_KEY` | GPT-4o-mini detection pass (optional) |

## License

MIT
