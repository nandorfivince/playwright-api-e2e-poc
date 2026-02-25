import { BaseApiClient } from '../base/BaseApiClient';
import { CountryQueries } from '../graphql/queries/countries.queries';

/**
 * GraphQL API Object for Countries API.
 * Queries are imported from dedicated query files — never inline in specs.
 */
export class CountriesGraphQLApi extends BaseApiClient {
  async getCountries() {
    return this.graphqlRequest(CountryQueries.list);
  }

  async getCountryByCode(code: string) {
    return this.graphqlRequest(CountryQueries.byCode, { code });
  }

  async sendInvalidQuery() {
    return this.graphqlRequest(CountryQueries.invalidSyntax);
  }
}
