import { BaseApiClient } from '../base/BaseApiClient';

/**
 * REST API Object for JSONPlaceholder /users endpoints.
 * One method = one HTTP call. No raw HTTP in spec files.
 */
export class UsersApi extends BaseApiClient {
  async getUsers() {
    return this.request.get('/users', {
      headers: this.getDefaultHeaders(),
    });
  }

  async getUserById(id: number) {
    return this.request.get(`/users/${id}`, {
      headers: this.getDefaultHeaders(),
    });
  }

  async createPost(data: { title: string; body: string; userId: number }) {
    return this.request.post('/posts', {
      headers: this.getDefaultHeaders(),
      data,
    });
  }

  /** Call without any auth headers — for auth failure testing */
  async getUsersWithoutAuth() {
    return this.request.get('/users');
  }
}
