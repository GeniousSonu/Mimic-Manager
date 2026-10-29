/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

/**
 * Returns the base URL for the Mimic Manager API service.
 * In Vercel Services, `API_URL` is injected via service binding on server functions.
 * In browser client execution, relative `/api` paths route through Vercel's top-level rewrite.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Browser client
    return '';
  }
  // Server-side (SSR / Server Actions / Route Handlers)
  return process.env.API_URL || 'http://localhost:3000';
}

/**
 * Type-safe fetch wrapper for calling the Mimic Manager API.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${normalizedPath}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.error?.message ||
        `API request to ${normalizedPath} failed with status ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}
