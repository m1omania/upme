import axios, { AxiosInstance } from 'axios';
import logger from '../config/logger';

export interface HHVacancy {
  id: string;
  name: string;
  employer: {
    name: string;
    logo_urls?: {
      original?: string;
      '90'?: string;
      '240'?: string;
    };
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
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  age?: number;
  photo?: {
    id: string;
    small: string;
    medium: string;
  };
  total_experience_months?: number;
  experience: Array<{
    company?: string;
    company_id?: string;
    position?: string;
    description?: string;
    start?: string;
    end?: string;
    area?: {
      id: string;
      name: string;
    };
  }>;
  skills?: Array<{ name: string } | string> | string; // Может быть массивом или строкой (описание)
  key_skills?: Array<{ name: string } | string>;
  skill_set?: Array<{ name: string } | string>; // Основное поле для навыков в HH.ru API
  education?: Array<{
    level?: {
      id: string;
      name: string;
    };
    primary?: Array<{
      name: string;
      organization?: string;
      result?: string;
      year?: number;
    }>;
  }>;
  language?: Array<{
    id: string;
    name: string;
    level?: {
      id: string;
      name: string;
    };
  }>;
  status?: {
    id: string;
    name: string;
  };
  access?: {
    type?: {
      id: string;
      name: string;
    };
  };
  created_at?: string;
  updated_at?: string;
  views_count?: number;
  total_views?: number;
  new_views?: number;
  views_url?: string;
  [key: string]: any;
}

export interface HHUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  is_applicant?: boolean;
  is_employer?: boolean;
  is_admin?: boolean;
  is_in_search?: boolean;
  // Дополнительные поля, которые могут быть в ответе
  [key: string]: any;
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
      const allResumes: HHResume[] = [];
      let page = 0;
      let hasMore = true;
      const perPage = 100; // Максимальное количество на странице

      // Загружаем все страницы резюме
      while (hasMore) {
        const response = await this.client.get('/resumes/mine', {
          params: {
            per_page: perPage,
            page: page,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const resumes = response.data.items || [];
        allResumes.push(...resumes);

        // Проверяем, есть ли еще страницы
        const pages = response.data.pages || 0;
        const found = response.data.found || 0;
        
        logger.info(`HH.ru API page ${page}: ${resumes.length} resumes (total found: ${found}, pages: ${pages})`);
      
      // Логируем ID всех резюме на этой странице
      resumes.forEach((resume: any) => {
        logger.info(`  - Resume ID: ${resume.id}, Title: ${resume.title || 'N/A'}, Status: ${resume.status?.name || 'N/A'}`);
      });

        if (page >= pages - 1 || resumes.length === 0) {
          hasMore = false;
        } else {
          page++;
        }
      }

      logger.info(`HH.ru API returned total ${allResumes.length} resumes`);
      
      return allResumes;
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
      
      // Логируем структуру ответа для отладки навыков
      const data = response.data;
      logger.info(`HH.ru API Resume ${resumeId} response keys: ${Object.keys(data).join(', ')}`);
      logger.info(`HH.ru API Resume ${resumeId} skills field: ${JSON.stringify(data.skills)}`);
      logger.info(`HH.ru API Resume ${resumeId} key_skills field: ${JSON.stringify(data.key_skills)}`);
      logger.info(`HH.ru API Resume ${resumeId} skill_set field: ${JSON.stringify(data.skill_set)}`);
      
      return data;
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
    if (!vacancyId || !resumeId) {
      throw new Error(`Missing required parameters: vacancyId=${vacancyId}, resumeId=${resumeId}`);
    }

    // Убеждаемся, что ID - строки (HH.ru API требует строки)
    const vacancyIdStr = String(vacancyId).trim();
    const resumeIdStr = String(resumeId).trim();

    if (!vacancyIdStr || !resumeIdStr) {
      throw new Error(`Empty parameters after conversion: vacancyId="${vacancyIdStr}", resumeId="${resumeIdStr}"`);
    }

    const requestBody = {
      vacancy_id: vacancyIdStr,
      resume_id: resumeIdStr,
      message: coverLetter,
    };

    logger.info('Sending application to HH.ru', {
      vacancyId: vacancyIdStr,
      resumeId: resumeIdStr,
      coverLetterLength: coverLetter.length,
      endpoint: '/negotiations',
      requestBodyKeys: Object.keys(requestBody),
      requestBodyValues: {
        vacancy_id: vacancyIdStr,
        resume_id: resumeIdStr,
        message_length: coverLetter.length,
      },
    });

    try {
      logger.info('Preparing request to HH.ru negotiations API', {
        url: `${this.baseURL}/negotiations`,
        method: 'POST',
        vacancy_id_value: requestBody.vacancy_id,
        resume_id_value: requestBody.resume_id,
        message_length: requestBody.message.length,
      });

      // Пробуем сначала JSON формат
      let response;
      try {
        logger.info('Trying JSON format');
        response = await axios.post(
          `${this.baseURL}/negotiations`,
          requestBody,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          }
        );
        logger.info('Success with JSON format');
      } catch (jsonError: any) {
        // Если JSON не работает, пробуем form-urlencoded (как для OAuth)
        if (jsonError.response?.status === 400 && jsonError.response?.data?.bad_argument) {
          logger.info('JSON format failed, trying form-urlencoded format');
          const formParams = new URLSearchParams({
            vacancy_id: vacancyIdStr,
            resume_id: resumeIdStr,
            message: coverLetter,
          });
          
          response = await axios.post(
            `${this.baseURL}/negotiations`,
            formParams.toString(),
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            }
          );
          logger.info('Success with form-urlencoded format');
        } else {
          throw jsonError;
        }
      }
      
      logger.info('Application successfully sent to HH.ru', {
        status: response.status,
        vacancyId: vacancyIdStr,
        resumeId: resumeIdStr,
        responseData: response.data,
      });
    } catch (error: any) {
      logger.error('Error creating application in HH.ru:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        vacancyId: vacancyIdStr,
        resumeId: resumeIdStr,
        requestBody: requestBody,
        requestBodyStringified: JSON.stringify(requestBody),
      });
      
      // Пробрасываем ошибку дальше с деталями
      const errorMessage = error.response?.data?.description || error.message || 'Failed to create application';
      throw new Error(errorMessage);
    }
  }

  /**
   * Получить отклики пользователя (negotiations)
   */
  async getNegotiations(accessToken: string, params: {
    per_page?: number;
    page?: number;
  } = {}): Promise<any> {
    try {
      const response = await this.client.get('/negotiations', {
        params: {
          per_page: params.per_page || 20,
          page: params.page || 0,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error getting negotiations:', error.response?.data || error.message);
      throw new Error('Failed to get negotiations');
    }
  }

  /**
   * Получить сохраненные вакансии пользователя
   */
  async getSavedVacancies(accessToken: string): Promise<any[]> {
    try {
      const response = await this.client.get('/saved_vacancies', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.items || [];
    } catch (error: any) {
      logger.error('Error getting saved vacancies:', error.response?.data || error.message);
      throw new Error('Failed to get saved vacancies');
    }
  }

  /**
   * Получить полную информацию о пользователе (расширенная версия)
   * Эндпоинт /me возвращает больше данных, чем мы используем
   */
  async getFullUserInfo(accessToken: string): Promise<HHUser> {
    try {
      const response = await this.client.get('/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error getting full user info:', error.response?.data || error.message);
      throw new Error('Failed to get full user info');
    }
  }
}

export const hhApiService = new HHApiService();

