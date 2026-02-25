import { test, expect } from '@playwright/test';
import { CountriesGraphQLApi } from '../../support/api-client/CountriesGraphQLApi';
import {
  CountriesResponseSchema,
  CountryDetailSchema,
  GraphQLErrorSchema,
  CountryBrokenSchema,
} from '../../schemas/countries.schema';
import { CountryFixtures } from '../fixtures/countries.fixture';
import { TestMeta, setTestMeta, logResponseTime } from '../../support/helpers/allure.helper';

const meta = TestMeta.countries;

test.describe('GraphQL — Countries', () => {
  let countriesApi: CountriesGraphQLApi;

  test.beforeEach(async ({ request }) => {
    countriesApi = new CountriesGraphQLApi(request);
  });

  // ─── Positive Tests ─────────────────────────────────────────

  test('@smoke shouldReturnCountriesListWhenQueried', async () => {
    await setTestMeta({ ...meta, story: meta.stories.list });

    const start = Date.now();
    const response = await countriesApi.getCountries();
    await logResponseTime(start);

    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.errors).toBeUndefined();
    expect(body.data.countries.length).toBeGreaterThan(0);
  });

  test('@smoke shouldReturnHungaryDetailsWhenCodeIsHU', async () => {
    await setTestMeta({ ...meta, story: meta.stories.byCode });

    const start = Date.now();
    const response = await countriesApi.getCountryByCode(CountryFixtures.hungary.code);
    await logResponseTime(start);

    const body = await response.json();
    const country = body.data.country;

    expect(country.name).toBe(CountryFixtures.hungary.name);
    expect(country.capital).toBe(CountryFixtures.hungary.capital);
    expect(country.currency).toBe(CountryFixtures.hungary.currency);
    expect(country.continent.name).toBe(CountryFixtures.hungary.continent);
  });

  test('@regression shouldMatchZodSchemaWhenResponseIsValid', async () => {
    await setTestMeta({ ...meta, story: meta.stories.schema, severity: 'normal' });

    const response = await countriesApi.getCountries();
    const body = await response.json();

    expect(() => CountriesResponseSchema.parse(body)).not.toThrow();
  });

  test('@regression shouldReturnErrorWhenQuerySyntaxIsInvalid', async () => {
    await setTestMeta({ ...meta, story: meta.stories.schema, severity: 'normal' });

    const response = await countriesApi.sendInvalidQuery();
    const body = await response.json();

    // Countries API returns 400 for syntax errors (some GraphQL servers return 200)
    expect(response.status()).toBe(400);
    expect(() => GraphQLErrorSchema.parse(body)).not.toThrow();
  });

  // ─── Negative Demo Test (intentionally failing) ────────────

  test('@demo shouldDetectMissingFieldWhenSchemaChanges', async () => {
    await setTestMeta({ ...meta, story: meta.stories.missingField, severity: 'critical' });

    const response = await countriesApi.getCountries();
    const body = await response.json();

    // INTENTIONAL FAILURE: CountryBrokenSchema expects "population" and "area"
    // but the Countries API doesn't have these fields.
    // This demonstrates how Zod catches missing fields after a schema change.
    expect(() => CountryBrokenSchema.parse(body)).not.toThrow();
  });
});
