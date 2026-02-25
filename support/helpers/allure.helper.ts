import { allure } from 'allure-playwright';

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
