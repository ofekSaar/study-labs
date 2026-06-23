/**
 * Centralised AI engine connection configuration.
 * Reads from env at call time so tests can override process.env before calling.
 */
export const getAiConfig = () => ({
  url: process.env.AI_SERVICE_URL || 'http://ai-engine:8000',
  apiKey: process.env.AI_SERVICE_API_KEY || '',
});
