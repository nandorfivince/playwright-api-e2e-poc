import { APIRequestContext } from '@playwright/test';
import { getAuthHeaders } from '../helpers/auth.helper';

/**
 * Base class for all API Objects — analogous to BasePage in mobile POM.
 * Provides shared HTTP methods for REST and GraphQL requests.
 */
export class BaseApiClient {
  protected readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    };
  }

  /** Centralized GraphQL request — all GraphQL API Objects use this */
  protected async graphqlRequest(
    query: string,
    variables?: Record<string, unknown>,
  ) {
    return this.request.post('', {
      headers: this.getDefaultHeaders(),
      data: { query, ...(variables && { variables }) },
    });
  }
}
