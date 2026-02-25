/**
 * Centralized authentication helper.
 * - Local: no auth needed for public APIs
 * - Staging/Prod: JWT from environment variable
 */
export function getTestToken(): string {
  return process.env.TEST_JWT || '';
}

export function getAuthHeaders(): Record<string, string> {
  const token = getTestToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isLocalEnvironment(): boolean {
  return !process.env.CI;
}
