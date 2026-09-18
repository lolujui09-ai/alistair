import { pipeline } from '@xenova/transformers';

let extractorInstance = null;
let initPromise = null;

const EMBEDDING_MODEL_NAME = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

/**
 * Memuat pipeline model embedding multilingual (singleton loader)
 */
async function loadPipeline() {
  console.log(`[Embedding] Memuat model multilingual lokal (${EMBEDDING_MODEL_NAME})...`);
  const extractor = await pipeline('feature-extraction', EMBEDDING_MODEL_NAME, {
    quantized: true, // Mempercepat inferensi dan menghemat RAM
  });
  console.log(`[Embedding] Model multilingual ${EMBEDDING_MODEL_NAME} berhasil dimuat.`);
  extractorInstance = extractor;
  return extractor;
}

/**
 * Mengambil singleton instance feature-extraction pipeline
 * Menggunakan model Xenova/paraphrase-multilingual-MiniLM-L12-v2 (384 dimensi, Multilingual 50+ bahasa)
 */
export async function getEmbeddingPipeline() {
  if (extractorInstance) {
    return extractorInstance;
  }

  if (!initPromise) {
    initPromise = loadPipeline();
  }

  return initPromise;
}

/**
 * Menghasilkan vektor embedding 384 dimensi dari sebuah teks tunggal
 * @param {string} text - Teks input
 * @returns {Promise<number[]>} - Array 384 angka float
 */
export async function getEmbedding(text) {
  if (!text || !text.trim()) {
    throw new Error('Teks untuk embedding tidak boleh kosong');
  }

  const pipe = await getEmbeddingPipeline();
  const output = await pipe(text.trim(), {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data);
}

/**
 * Menghasilkan vektor embedding untuk kumpulan teks (batch)
 * @param {string[]} texts - Array kumpulan teks
 * @returns {Promise<number[][]>} - Array berisi array vektor 384 dimensi
 */
export async function getBatchEmbeddings(texts) {
  if (!texts || texts.length === 0) {
    return [];
  }

  const pipe = await getEmbeddingPipeline();
  const output = await pipe(texts, {
    pooling: 'mean',
    normalize: true,
  });

  // Jika input hanya 1 string dalam array, bentuk dimensinya [1, 384]
  const dims = output.dims; // [batchSize, 384]
  const batchSize = dims[0];
  const vectorDim = dims[1] || 384;
  const rawData = output.data;

  const results = [];
  for (let i = 0; i < batchSize; i++) {
    const start = i * vectorDim;
    const end = start + vectorDim;
    results.push(Array.from(rawData.slice(start, end)));
  }

  return results;
}
