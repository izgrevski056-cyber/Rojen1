/**
 * Copy to gemini-config.js and paste your API key from Google AI Studio.
 * https://aistudio.google.com/apikey
 */
export const geminiApiKey = 'YOUR_GEMINI_API_KEY';

export function isGeminiConfigured() {
  return !geminiApiKey.includes('YOUR_');
}

export default { geminiApiKey, isGeminiConfigured };
