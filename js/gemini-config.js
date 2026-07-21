/**
 * Gemini API key — stored locally on device (Settings), never in GitHub.
 * Get a free key: https://aistudio.google.com/apikey
 */
export const GEMINI_KEY_STORAGE = 'rozhen1_gemini_api_key';

export function getGeminiApiKey() {
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

/** @param {string} key */
export function setGeminiApiKey(key) {
  const trimmed = key.trim();
  if (!trimmed) {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
    return;
  }
  localStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
}

export function isGeminiConfigured() {
  const key = getGeminiApiKey();
  return Boolean(key && key.length > 10 && !key.includes('YOUR_'));
}

export default { getGeminiApiKey, setGeminiApiKey, isGeminiConfigured, GEMINI_KEY_STORAGE };
