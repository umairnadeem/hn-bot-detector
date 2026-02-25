interface TFIDFVector {
  [term: string]: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function termFrequency(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  const len = tokens.length || 1;
  for (const term in tf) {
    tf[term] /= len;
  }
  return tf;
}

function inverseDocumentFrequency(
  documents: string[][]
): Record<string, number> {
  const idf: Record<string, number> = {};
  const n = documents.length;

  const docFreq: Record<string, number> = {};
  for (const doc of documents) {
    const seen = Array.from(new Set(doc));
    for (const term of seen) {
      docFreq[term] = (docFreq[term] || 0) + 1;
    }
  }

  for (const term in docFreq) {
    idf[term] = Math.log(n / docFreq[term]);
  }

  return idf;
}

function buildTFIDFVector(
  tf: Record<string, number>,
  idf: Record<string, number>
): TFIDFVector {
  const vector: TFIDFVector = {};
  for (const term in tf) {
    if (idf[term] !== undefined) {
      vector[term] = tf[term] * idf[term];
    }
  }
  return vector;
}

function cosineSimilarity(a: TFIDFVector, b: TFIDFVector): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  const allTerms = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));

  for (const term of allTerms) {
    const valA = a[term] || 0;
    const valB = b[term] || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

export function computeAverageSimilarity(texts: string[]): number {
  if (texts.length < 2) return 0;

  const tokenized = texts.map(tokenize);
  const idf = inverseDocumentFrequency(tokenized);
  const vectors = tokenized.map((tokens) =>
    buildTFIDFVector(termFrequency(tokens), idf)
  );

  let totalSimilarity = 0;
  let pairs = 0;

  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      totalSimilarity += cosineSimilarity(vectors[i], vectors[j]);
      pairs++;
    }
  }

  return pairs > 0 ? totalSimilarity / pairs : 0;
}
