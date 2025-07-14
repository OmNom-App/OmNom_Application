import { supabase } from './supabase';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const status = response.status;

    if (status === 401) {
      // Clear auth state and redirect to login
      await supabase.auth.signOut();
      window.location.href = '/login';
      return { status, error: 'Unauthorized' };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        status, 
        error: errorText || `HTTP ${status} Error` 
      };
    }

    try {
      const data = await response.json();
      return { status, data };
    } catch {
      return { status };
    }
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, { headers });
      return this.handleResponse<T>(response);
    } catch (error) {
      return { status: 500, error: 'Network error' };
    }
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return { status: 500, error: 'Network error' };
    }
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return { status: 500, error: 'Network error' };
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return { status: 500, error: 'Network error' };
    }
  }
}

export const apiClient = new ApiClient();