/**
 * Gemini key is saved in app Settings (localStorage on device).
 * Get a free key: https://aistudio.google.com/apikey
 */
export const GEMINI_KEY_STORAGE = 'rozhen1_gemini_api_key';

export function getGeminiApiKey() {
  return '';
}

export function setGeminiApiKey() {}

export function isGeminiConfigured() {
  return false;
}

export default { getGeminiApiKey, setGeminiApiKey, isGeminiConfigured, GEMINI_KEY_STORAGE };
