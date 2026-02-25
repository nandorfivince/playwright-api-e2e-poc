import { z } from 'zod';

export const CountrySchema = z.object({
  code: z.string(),
  name: z.string(),
  capital: z.string().nullable(),
  currency: z.string().nullable(),
});

export const CountriesResponseSchema = z.object({
  data: z.object({
    countries: z.array(CountrySchema),
  }),
});

export const CountryDetailSchema = z.object({
  data: z.object({
    country: CountrySchema.extend({
      languages: z.array(z.object({ name: z.string() })),
      continent: z.object({ name: z.string() }),
    }),
  }),
});

export const GraphQLErrorSchema = z.object({
  errors: z.array(
    z.object({
      message: z.string(),
    }),
  ),
});

/** DEMO: Intentionally wrong schema — expects fields that don't exist */
export const CountryBrokenSchema = z.object({
  data: z.object({
    countries: z.array(
      z.object({
        code: z.string(),
        name: z.string(),
        population: z.number(),   // ← doesn't exist in Countries API
        area: z.number(),         // ← doesn't exist in Countries API
      }),
    ),
  }),
});
