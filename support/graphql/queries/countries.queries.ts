import { gql } from 'graphql-request';

// ─── Fragments ──────────────────────────────────────────────────

const COUNTRY_CORE_FIELDS = gql`
  fragment CountryCoreFields on Country {
    code
    name
    capital
    currency
  }
`;

// ─── Queries ────────────────────────────────────────────────────

export const CountryQueries = {
  /** All countries with core fields */
  list: gql`
    query ListCountries {
      countries {
        ...CountryCoreFields
      }
    }
    ${COUNTRY_CORE_FIELDS}
  `,

  /** Single country by ISO code */
  byCode: gql`
    query GetCountry($code: ID!) {
      country(code: $code) {
        ...CountryCoreFields
        languages {
          name
        }
        continent {
          name
        }
      }
    }
    ${COUNTRY_CORE_FIELDS}
  `,

  /** Intentionally invalid syntax — for error handling tests */
  invalidSyntax: '{ countries ??? }',
};
