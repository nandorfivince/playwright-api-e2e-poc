import { test as base, APIRequestContext, APIResponse } from '@playwright/test';
import { attachApiDetails, logResponseTime } from '../helpers/allure.helper';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head';

/**
 * Wraps an APIRequestContext with automatic timing, Allure logging,
 * and network report data collection. API Objects receive this
 * transparently — they don't know the difference.
 */
function createTrackedRequest(request: APIRequestContext): APIRequestContext {
  const tracked: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'head'];

  return new Proxy(request, {
    get(target, prop: string) {
      if (!tracked.includes(prop as HttpMethod)) {
        const value = (target as Record<string, unknown>)[prop];
        return typeof value === 'function' ? value.bind(target) : value;
      }

      return async (...args: unknown[]) => {
        const start = Date.now();
        const response: APIResponse = await (target as Record<string, Function>)[prop](...args);
        const duration = Date.now() - start;

        const method = prop.toUpperCase();
        const options = args[1] as Record<string, unknown> | undefined;
        const body = options?.data;

        await logResponseTime(start);
        await attachApiDetails(response, { method, body, durationMs: duration });

        return response;
      };
    },
  });
}

/**
 * Extended Playwright test with automatic API call tracking.
 * Use `trackedRequest` instead of `request` when creating API Objects.
 */
export const test = base.extend<{ trackedRequest: APIRequestContext }>({
  trackedRequest: async ({ request }, use) => {
    await use(createTrackedRequest(request));
  },
});

export { expect } from '@playwright/test';
