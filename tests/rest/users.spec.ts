import { test, expect } from '@playwright/test';
import { UsersApi } from '../../support/api-client/UsersApi';
import { UsersListSchema, UserBrokenSchema } from '../../schemas/users.schema';
import { UserFixtures } from '../fixtures/users.fixture';
import { TestMeta, setTestMeta, logResponseTime } from '../../support/helpers/allure.helper';

const meta = TestMeta.users;

test.describe('REST — GET /users', () => {
  let usersApi: UsersApi;

  test.beforeEach(async ({ request }) => {
    usersApi = new UsersApi(request);
  });

  // ─── Positive Tests ─────────────────────────────────────────

  test('@smoke shouldReturn200WithUsersListWhenCalled', async () => {
    await setTestMeta({ ...meta, story: meta.stories.list });

    const start = Date.now();
    const response = await usersApi.getUsers();
    await logResponseTime(start);

    const users = await response.json();

    expect(response.status()).toBe(200);
    expect(users).toHaveLength(UserFixtures.totalCount);
    expect(users[0].name).toBe(UserFixtures.firstUser.name);
  });

  test('@smoke shouldReturnSingleUserWhenIdIsValid', async () => {
    await setTestMeta({ ...meta, story: meta.stories.byId });

    const start = Date.now();
    const response = await usersApi.getUserById(UserFixtures.firstUser.id);
    await logResponseTime(start);

    const user = await response.json();

    expect(response.status()).toBe(200);
    expect(user.name).toBe(UserFixtures.firstUser.name);
    expect(user.email).toBe(UserFixtures.firstUser.email);
  });

  test('@regression shouldReturn201WhenPostIsCreated', async () => {
    await setTestMeta({ ...meta, story: meta.stories.create });

    const response = await usersApi.createPost(UserFixtures.newPost);
    const body = await response.json();

    expect(response.status()).toBe(201);
    expect(body.title).toBe(UserFixtures.newPost.title);
    expect(body.userId).toBe(UserFixtures.newPost.userId);
  });

  test('@regression shouldReturnJsonContentTypeWhenCalled', async () => {
    await setTestMeta({ ...meta, story: meta.stories.contentType, severity: 'normal' });

    const response = await usersApi.getUsers();
    const contentType = response.headers()['content-type'];

    expect(contentType).toContain('application/json');
  });

  test('@regression shouldReturn200WithoutAuthHeaderWhenPublicApi', async () => {
    await setTestMeta({ ...meta, story: meta.stories.auth });

    const response = await usersApi.getUsersWithoutAuth();

    // Public API — no auth required, should still return 200.
    // For protected APIs this would assert 401/403.
    expect(response.status()).toBe(200);
  });

  test('@regression shouldMatchZodSchemaWhenResponseIsValid', async () => {
    await setTestMeta({ ...meta, story: meta.stories.list, severity: 'normal' });

    const response = await usersApi.getUsers();
    const users = await response.json();

    expect(() => UsersListSchema.parse(users)).not.toThrow();
  });

  // ─── Negative Demo Tests (intentionally failing) ───────────

  test('@demo shouldDetectSchemaMismatchWhenFieldRenamed', async () => {
    await setTestMeta({ ...meta, story: meta.stories.schemaBreak, severity: 'critical' });

    const response = await usersApi.getUserById(1);
    const user = await response.json();

    // INTENTIONAL FAILURE: UserBrokenSchema expects "fullName" + "department"
    // but the real API returns "name" and no "department" field.
    // This demonstrates how Zod catches schema mismatches.
    expect(() => UserBrokenSchema.parse(user)).not.toThrow();
  });

  test('@demo shouldDetectSlowResponseWhenThresholdExceeded', async () => {
    await setTestMeta({ ...meta, story: meta.stories.slowResponse, severity: 'normal' });

    const start = Date.now();
    await usersApi.getUsers();
    const duration = await logResponseTime(start);

    // INTENTIONAL FAILURE: 1ms is impossible for a network call.
    // This demonstrates response time threshold monitoring.
    expect(duration).toBeLessThan(1);
  });
});
