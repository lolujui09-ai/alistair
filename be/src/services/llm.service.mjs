import fs from 'fs';
import path from 'path';

/**
 * Service untuk memanggil LLM Cloudflare Workers AI
 */

const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

function getCredentials() {
  let accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  let apiToken = process.env.CLOUDFLARE_API_TOKEN;
  let model = process.env.CLOUDFLARE_MODEL || DEFAULT_MODEL;

  // Jika belum ada di be/.env, periksa folder test-cf-ai/.env sebagai fallback
  if (!accountId || !apiToken) {
    const candidatePaths = [
      path.resolve(process.cwd(), '../test-cf-ai/.env'),
      path.resolve(process.cwd(), 'test-cf-ai/.env'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const lines = fs.readFileSync(p, 'utf8').split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
              const [k, ...vals] = trimmed.split('=');
              const key = k.trim();
              const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
              if (key === 'CLOUDFLARE_ACCOUNT_ID' && !accountId) accountId = val;
              if (key === 'CLOUDFLARE_API_TOKEN' && !apiToken) apiToken = val;
              if (key === 'CLOUDFLARE_MODEL' && !process.env.CLOUDFLARE_MODEL) model = val;
            }
          }
        } catch {
          // Abaikan jika tidak terbaca
        }
        break;
      }
    }
  }

  return { accountId, apiToken, model };
}

export async function generateChatResponse(messages, options = {}) {
  const { accountId, apiToken, model } = getCredentials();

  if (!accountId || !apiToken) {
    throw new Error(
      'CLOUDFLARE_ACCOUNT_ID atau CLOUDFLARE_API_TOKEN belum dikonfigurasi di file .env'
    );
  }

  const { maxTokens = 768, temperature = 0.7 } = options;

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorMsg = data.errors?.[0]?.message || data.messages?.[0] || response.statusText;
    throw new Error(`Cloudflare Workers AI Error: ${errorMsg}`);
  }

  return data.result?.response || '';
}

