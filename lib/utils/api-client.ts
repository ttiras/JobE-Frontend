import { logError } from './error-logger';

export interface ApiError {
  message: string;
  errorId: string;
  status?: number;
}

export interface ApiClientOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

const DEFAULT_OPTIONS: Required<ApiClientOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
};

/**
 * Delay utility for retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * API client with retry logic and error handling
 */
export class ApiClient {
  private options: Required<ApiClientOptions>;

  constructor(options: ApiClientOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Perform a fetch request with retry logic
   */
  private async fetchWithRetry(
    url: string,
    init?: RequestInit,
    attempt = 0
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Retry on 5xx errors
      if (response.status >= 500 && attempt < this.options.maxRetries) {
        const retryDelay = this.options.retryDelay * Math.pow(2, attempt); // Exponential backoff
        await delay(retryDelay);
        return this.fetchWithRetry(url, init, attempt + 1);
      }

      return response;
    } catch (error) {
      // Retry on network errors
      if (attempt < this.options.maxRetries) {
        const retryDelay = this.options.retryDelay * Math.pow(2, attempt);
        await delay(retryDelay);
        return this.fetchWithRetry(url, init, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string): Promise<T> {
    try {
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorId = logError(
          `API GET ${url} failed with status ${response.status}`,
          { url, status: response.status }
        );
        throw {
          message: `Request failed with status ${response.status}`,
          errorId,
          status: response.status,
        } as ApiError;
      }

      return response.json();
    } catch (error) {
      if ((error as ApiError).errorId) {
        throw error;
      }

      const errorId = logError(error as Error, { url, method: 'GET' });
      throw {
        message: error instanceof Error ? error.message : 'Unknown error',
        errorId,
      } as ApiError;
    }
  }

  /**
   * POST request
   */
  async post<T>(url: string, data: unknown): Promise<T> {
    try {
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorId = logError(
          `API POST ${url} failed with status ${response.status}`,
          { url, status: response.status, data }
        );
        throw {
          message: `Request failed with status ${response.status}`,
          errorId,
          status: response.status,
        } as ApiError;
      }

      return response.json();
    } catch (error) {
      if ((error as ApiError).errorId) {
        throw error;
      }

      const errorId = logError(error as Error, { url, method: 'POST', data });
      throw {
        message: error instanceof Error ? error.message : 'Unknown error',
        errorId,
      } as ApiError;
    }
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data: unknown): Promise<T> {
    try {
      const response = await this.fetchWithRetry(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorId = logError(
          `API PUT ${url} failed with status ${response.status}`,
          { url, status: response.status, data }
        );
        throw {
          message: `Request failed with status ${response.status}`,
          errorId,
          status: response.status,
        } as ApiError;
      }

      return response.json();
    } catch (error) {
      if ((error as ApiError).errorId) {
        throw error;
      }

      const errorId = logError(error as Error, { url, method: 'PUT', data });
      throw {
        message: error instanceof Error ? error.message : 'Unknown error',
        errorId,
      } as ApiError;
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.fetchWithRetry(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorId = logError(
          `API DELETE ${url} failed with status ${response.status}`,
          { url, status: response.status }
        );
        throw {
          message: `Request failed with status ${response.status}`,
          errorId,
          status: response.status,
        } as ApiError;
      }

      return response.json();
    } catch (error) {
      if ((error as ApiError).errorId) {
        throw error;
      }

      const errorId = logError(error as Error, { url, method: 'DELETE' });
      throw {
        message: error instanceof Error ? error.message : 'Unknown error',
        errorId,
      } as ApiError;
    }
  }
}

// Export a default instance
export const apiClient = new ApiClient();
