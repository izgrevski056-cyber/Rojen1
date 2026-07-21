import { geminiApiKey, isGeminiConfigured } from './gemini-config.js';

const GEMINI_MODEL = 'gemini-2.0-flash';
const MAX_IMAGE_DIMENSION = 1600;

const INVOICE_PROMPT = `Read this invoice or delivery document photo for a Bulgarian distribution driver.

Return ONLY valid JSON with these fields:
- "companyName": the customer or recipient business name (where goods are delivered), NOT the supplier or issuer of the invoice
- "amountEur": the total amount due in EUR as a number (use dot for decimals). Prefer labels like "за плащане", "total", "сума", "EUR", "€"

Rules:
- If multiple EUR amounts exist, choose the final total to pay
- If company name is unclear, return your best guess
- If amount is missing, use null
- Do not include currency symbols in amountEur

Example: {"companyName":"Хотел Морско Оазис","amountEur":124.50}`;

/**
 * @param {File} file
 * @returns {Promise<{ companyName: string, amountEur: number | null }>}
 */
export async function parseInvoiceImage(file) {
  if (!isGeminiConfigured()) {
    throw new Error('Липсва Gemini API ключ. Добавете го в js/gemini-config.js');
  }

  if (!file?.type?.startsWith('image/')) {
    throw new Error('Моля, изберете снимка на фактура.');
  }

  const prepared = await prepareImageFile(file);
  const base64 = await blobToBase64(prepared);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: INVOICE_PROMPT },
            { inline_data: { mime_type: 'image/jpeg', data: base64 } }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 400 && errText.includes('API key')) {
      throw new Error('Невалиден Gemini API ключ. Проверете js/gemini-config.js');
    }
    if (response.status === 429) {
      throw new Error('Твърде много заявки. Опитайте след минута.');
    }
    throw new Error('AI услугата не отговори. Опитайте отново.');
  }

  const payload = await response.json();
  const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('AI не разчете фактурата. Опитайте по-ясна снимка.');
  }

  return normalizeInvoiceResult(rawText);
}

/**
 * @param {string} rawText
 * @returns {{ companyName: string, amountEur: number | null }}
 */
function normalizeInvoiceResult(rawText) {
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI върна неочакван отговор. Опитайте отново.');
    parsed = JSON.parse(match[0]);
  }

  const companyName = String(parsed.companyName || parsed.company || parsed.clientName || '').trim();
  let amountEur = parsed.amountEur ?? parsed.amount ?? parsed.total ?? null;

  if (typeof amountEur === 'string') {
    amountEur = parseFloat(amountEur.replace(/[^\d.,]/g, '').replace(',', '.'));
  }

  if (amountEur !== null && (isNaN(amountEur) || amountEur < 0)) {
    amountEur = null;
  }

  return {
    companyName,
    amountEur: amountEur === null ? null : Math.round(amountEur * 100) / 100
  };
}

/**
 * @param {File} file
 * @returns {Promise<Blob>}
 */
async function prepareImageFile(file) {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  const maxDim = Math.max(width, height);
  if (maxDim > MAX_IMAGE_DIMENSION) {
    const scale = MAX_IMAGE_DIMENSION / maxDim;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Неуспешна обработка на снимката.');

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Неуспешна обработка на снимката.'))),
      'image/jpeg',
      0.85
    );
  });

  return blob;
}

/**
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = /** @type {string} */ (reader.result);
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Неуспешно четене на снимката.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export function createImagePreviewUrl(file) {
  return URL.createObjectURL(file);
}
