import axios, { AxiosInstance } from 'axios';
import logger from '../config/logger';

export interface HHVacancy {
  id: string;
  name: string;
  employer: {
    name: string;
  };
  salary: {
    from?: number;
    to?: number;
    currency?: string;
  } | null;
  snippet: {
    requirement?: string;
    responsibility?: string;
  };
  description?: string;
  key_skills?: Array<{ name: string }>;
  area: {
    name: string;
  };
}

export interface HHResume {
  id: string;
  title: string;
  experience: Array<{
    company?: string;
    position?: string;
    description?: string;
  }>;
  skills: Array<{ name: string }>;
}

export interface HHUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export class HHApiService {
  private client: AxiosInstance;
  private baseURL = 'https://api.hh.ru';
  private oauthURL = 'https://hh.ru'; // OAuth endpoints используют hh.ru, а не api.hh.ru

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        // HH.ru требует стандартный браузерный User-Agent
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
  }

  async getAccessToken(code: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      // HH.ru требует application/x-www-form-urlencoded в виде строки
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HH_CLIENT_ID!,
        client_secret: process.env.HH_CLIENT_SECRET!,
        code: code,
        redirect_uri: process.env.HH_REDIRECT_URI!,
      });

      logger.info('Requesting token with params:', {
        grant_type: 'authorization_code',
        client_id: process.env.HH_CLIENT_ID?.substring(0, 10) + '...',
        redirect_uri: process.env.HH_REDIRECT_URI,
        code_length: code.length,
        url: `${this.oauthURL}/oauth/token`,
      });

      // Важно: OAuth token endpoint находится на hh.ru, а не api.hh.ru
      const response = await axios.post(
        `${this.oauthURL}/oauth/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        }
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      };
    } catch (error: any) {
      const errorDetails = error.response?.data || error.message;
      logger.error('Error getting access token:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: errorDetails,
        message: error.message,
        url: `${this.baseURL}/oauth/token`,
      });
      
      // Более информативная ошибка
      const errorMessage = error.response?.data?.error_description 
        || error.response?.data?.errors?.[0]?.type
        || error.response?.data?.error 
        || error.message 
        || 'Failed to get access token';
      throw new Error(errorMessage);
    }
  }

  async refreshAccessToken(refresh_token: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: process.env.HH_CLIENT_ID!,
        client_secret: process.env.HH_CLIENT_SECRET!,
      });

      const response = await axios.post(
        `${this.oauthURL}/oauth/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        }
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refresh_token,
      };
    } catch (error: any) {
      logger.error('Error refreshing token:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }

  async getUserInfo(accessToken: string): Promise<HHUser> {
    try {
      const response = await this.client.get('/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error getting user info:', error.response?.data || error.message);
      throw new Error('Failed to get user info');
    }
  }

  async getResumes(accessToken: string): Promise<HHResume[]> {
    try {
      const response = await this.client.get('/resumes/mine', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.items || [];
    } catch (error: any) {
      logger.error('Error getting resumes:', error.response?.data || error.message);
      throw new Error('Failed to get resumes');
    }
  }

  async getResume(accessToken: string, resumeId: string): Promise<HHResume> {
    try {
      const response = await this.client.get(`/resumes/${resumeId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error getting resume:', error.response?.data || error.message);
      throw new Error('Failed to get resume');
    }
  }

  async searchVacancies(accessToken: string, params: {
    text?: string;
    area?: string;
    experience?: string;
    salary?: number;
    per_page?: number;
    page?: number;
  } = {}): Promise<{ items: HHVacancy[]; pages: number; found: number }> {
    try {
      const response = await this.client.get('/vacancies', {
        params: {
          per_page: params.per_page || 20,
          page: params.page || 0,
          ...params,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error searching vacancies:', error.response?.data || error.message);
      throw new Error('Failed to search vacancies');
    }
  }

  async getVacancy(accessToken: string, vacancyId: string): Promise<HHVacancy> {
    try {
      const response = await this.client.get(`/vacancies/${vacancyId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error getting vacancy:', error.response?.data || error.message);
      throw new Error('Failed to get vacancy');
    }
  }

  async createApplication(accessToken: string, vacancyId: string, resumeId: string, coverLetter: string): Promise<void> {
    try {
      await this.client.post(`/negotiations`, {
        vacancy_id: vacancyId,
        resume_id: resumeId,
        message: coverLetter,
      }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (error: any) {
      logger.error('Error creating application:', error.response?.data || error.message);
      throw new Error('Failed to create application');
    }
  }
}

export const hhApiService = new HHApiService();

