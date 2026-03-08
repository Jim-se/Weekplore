const RAILWAY_API_ORIGIN = 'https://weekplore-server-production.up.railway.app';

const normalizeBaseUrl = (value?: string) => value?.trim().replace(/\/+$/, '') || '';

export const API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) ||
  (import.meta.env.DEV ? '' : RAILWAY_API_ORIGIN);

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const getErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const errorData = await response.json();

    if (typeof errorData?.error === 'string' && errorData.error.trim().length > 0) {
      if (typeof errorData?.details === 'string' && errorData.details.trim().length > 0) {
        return `${errorData.error}: ${errorData.details}`;
      }

      return errorData.error;
    }
  } catch {
    // Ignore invalid JSON error payloads and fall back to the default message.
  }

  return fallbackMessage;
};
