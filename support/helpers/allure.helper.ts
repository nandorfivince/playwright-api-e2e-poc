import { APIResponse, test } from '@playwright/test';
import { allure } from 'allure-playwright';
import { saveNetworkCall } from './network-collector';

// ─── Centralized Test Metadata ──────────────────────────────────

export const TestMeta = {
  users: {
    epic: 'REST API',
    feature: 'Users Endpoint',
    severity: 'critical' as const,
    stories: {
      list: 'GET /users — list all users',
      byId: 'GET /users/:id — single user by ID',
      create: 'POST /posts — create resource',
      contentType: 'Response content-type validation',
      auth: 'Authentication header handling',
      schemaBreak: 'DEMO: Schema mismatch detection',
      slowResponse: 'DEMO: Response time threshold',
    },
  },
  countries: {
    epic: 'GraphQL API',
    feature: 'Countries Query',
    severity: 'critical' as const,
    stories: {
      list: 'List all countries',
      byCode: 'Get country by code',
      schema: 'Zod schema validation',
      missingField: 'DEMO: Missing field detection',
      wrongValue: 'DEMO: Unexpected value detection',
    },
  },
};

// ─── Helper Function ────────────────────────────────────────────

interface MetaConfig {
  epic: string;
  feature: string;
  story: string;
  severity?: string;
}

/** Single call to set all Allure metadata for a test */
export async function setTestMeta(config: MetaConfig): Promise<void> {
  await allure.epic(config.epic);
  await allure.feature(config.feature);
  await allure.story(config.story);
  if (config.severity) {
    await allure.severity(config.severity);
  }
}

/** Attach response time as Allure parameter */
export async function logResponseTime(startMs: number): Promise<number> {
  const duration = Date.now() - startMs;
  await allure.parameter('Response time (ms)', duration.toString());
  return duration;
}

// ─── Network Details Attachment (Chrome DevTools style) ─────────

interface RequestInfo {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  durationMs?: number;
}

/**
 * Attach full HTTP request/response details to Allure report.
 * Provides a "Network tab" experience — method, URL, status, headers, body.
 * Call this BEFORE assertions so details are attached even on test failure.
 */
export async function attachApiDetails(
  response: APIResponse,
  requestInfo?: RequestInfo,
): Promise<void> {
  const startTime = Date.now();

  const request = {
    method: requestInfo?.method ?? 'GET',
    url: response.url(),
    ...(requestInfo?.headers && { headers: requestInfo.headers }),
    ...(requestInfo?.body !== undefined && { body: requestInfo.body }),
  };

  await allure.attachment('Request', JSON.stringify(request, null, 2), 'application/json');

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    try {
      body = await response.text();
    } catch {
      body = '[unable to read body]';
    }
  }

  const responseData = {
    status: response.status(),
    statusText: response.statusText(),
    headers: response.headers(),
    body,
  };

  await allure.attachment('Response', JSON.stringify(responseData, null, 2), 'application/json');

  // Save to network-data for standalone HTML report
  const testName = test.info().title;
  saveNetworkCall({
    testName,
    timestamp: new Date().toISOString(),
    durationMs: requestInfo?.durationMs,
    request,
    response: responseData,
  });
}
