/**
 * Gemini API key for invoice scanning (Google AI Studio).
 * Copy from gemini-config.example.js and paste your key here.
 */
export const geminiApiKey = 'YOUR_GEMINI_API_KEY';

export function isGeminiConfigured() {
  return Boolean(
    geminiApiKey &&
    !geminiApiKey.includes('YOUR_') &&
    geminiApiKey.length > 10
  );
}

export default { geminiApiKey, isGeminiConfigured };
