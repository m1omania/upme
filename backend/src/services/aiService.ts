import axios from 'axios';
import logger from '../config/logger';
import { cache } from '../utils/cache';

export class AIService {
  // Используем Qwen2.5-7B-Instruct через chat/completions API (как в проекте dr)
  private model = 'Qwen/Qwen2.5-7B-Instruct'; // Модель для генерации текста

  /**
   * Генерирует сопроводительное письмо на основе вакансии и резюме
   */
  async generateCoverLetter(
    vacancyTitle: string,
    vacancyDescription: string,
    vacancyRequirements: string[],
    resumeTitle: string,
    resumeExperience: string,
    resumeSkills: string[],
    fullName: string = 'Кандидат'
  ): Promise<string> {
    try {
      // Проверяем кэш
      const cacheKey = `letter:${vacancyTitle}:${resumeTitle}`;
      const cached = cache.get<string>(cacheKey);
      if (cached) {
        logger.info('Using cached cover letter');
        return cached;
      }

      const prompt = this.buildPrompt(
        vacancyTitle,
        vacancyDescription,
        vacancyRequirements,
        resumeTitle,
        resumeExperience,
        resumeSkills,
        fullName
      );

      logger.info('Generating cover letter with HuggingFace API', {
        model: this.model,
        promptLength: prompt.length,
      });

      // Логируем промпт для отладки
      logger.info('Prompt for AI:', { prompt: prompt.substring(0, 500) + '...' });
        logger.info('Calling HuggingFace Router API (chat/completions) for model:', this.model);
        
        // Используем прямой HTTP запрос к router.huggingface.co/v1/chat/completions (как в проекте dr)
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        if (!apiKey) {
          throw new Error('HUGGINGFACE_API_KEY is not set');
        }

        const response = await axios.post(
          'https://router.huggingface.co/v1/chat/completions',
          {
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            model: this.model,
            stream: false,
            temperature: 0.8,
            top_p: 0.95,
            max_tokens: 600,
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000,
          }
        );

        logger.info('HuggingFace Router API response received', {
          status: response.status,
          hasChoices: !!response.data?.choices,
        });

        // Обрабатываем ответ от chat/completions API
        let generatedText = '';
        if (response.data?.choices?.[0]?.message?.content) {
          generatedText = response.data.choices[0].message.content;
        } else {
          logger.warn('Unexpected response format:', JSON.stringify(response.data).substring(0, 500));
          throw new Error('Unexpected response format from HuggingFace API');
        }

        logger.info('Extracted generated text', {
          length: generatedText.length,
          preview: generatedText.substring(0, 200),
        });

        let letter = generatedText.trim();

        // Очистка и форматирование
        letter = this.cleanGeneratedText(letter);

        // Если ответ слишком короткий, попробуем еще раз
        if (letter.length < 150) {
          logger.warn('Generated letter is too short, retrying...');
          const retryResponse = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
              messages: [
                {
                  role: 'user',
                  content: prompt,
                },
              ],
              model: this.model,
              stream: false,
              temperature: 0.85,
              top_p: 0.95,
              max_tokens: 800,
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 60000,
            }
          );
          const retryText = retryResponse.data?.choices?.[0]?.message?.content || '';
          letter = this.cleanGeneratedText(retryText.trim());
        }

        const finalLetter = letter || this.getFallbackLetter(vacancyTitle, resumeTitle, fullName);
        
        // Кэшируем результат на 1 час
        cache.set(cacheKey, finalLetter, 3600);
        
        return finalLetter;
    } catch (error: any) {
      logger.error('Error generating cover letter:', {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        model: this.model,
      });
      // Возвращаем шаблонное письмо в случае ошибки
      return this.getFallbackLetter(vacancyTitle, resumeTitle, fullName);
    }
  }

  private buildPrompt(
    vacancyTitle: string,
    vacancyDescription: string,
    vacancyRequirements: string[],
    resumeTitle: string,
    resumeExperience: string,
    resumeSkills: string[],
    fullName: string
  ): string {
    // Используем полное описание вакансии (до 2000 символов для лучшего контекста)
    const description = vacancyDescription ? vacancyDescription.substring(0, 2000) : 'Описание не указано';
    const experience = resumeExperience ? resumeExperience.substring(0, 800) : 'Опыт не указан';
    const skills = resumeSkills && resumeSkills.length > 0 ? resumeSkills.join(', ') : 'Навыки не указаны';
    const requirements = vacancyRequirements && vacancyRequirements.length > 0 
      ? vacancyRequirements.join(', ') 
      : 'Требования не указаны';

    return `Ты профессиональный HR-специалист. Напиши убедительное сопроводительное письмо для отклика на вакансию.

ВАЖНО: Отвечай ТОЛЬКО на русском языке. Не используй другие языки.

ВАКАНСИЯ:
Название: ${vacancyTitle}

Описание:
${description}

Требования к кандидату:
${requirements}

МОЕ РЕЗЮМЕ:
Должность: ${resumeTitle}
Опыт работы: ${experience}
Ключевые навыки: ${skills}

ТРЕБОВАНИЯ К ПИСЬМУ:
1. Начни с простого приветствия "Здравствуйте!" (НЕ используй "Уважаемый HR-специалист" или подобные обращения)
2. Представься фразой "Меня зовут ${fullName}" (НЕ используй "Мое имя" или другие варианты)
3. Объясни, почему ты подходишь для этой позиции:
   - Упомяни релевантный опыт из резюме
   - Подчеркни совпадение навыков с требованиями
   - Покажи заинтересованность в позиции
4. Заверши выражением готовности к обсуждению
5. Будь конкретным, но кратким (2-3 абзаца, максимум 250 слов)
6. Используй профессиональный, но дружелюбный тон
7. Избегай общих фраз, будь конкретным
8. НЕ задавай вопросов, НЕ проси дополнительной информации - просто напиши письмо
9. НЕ используй плейсхолдеры типа [Ваше имя] - используй реальное имя: ${fullName}
10. В конце письма НЕ добавляй контактные данные - они будут добавлены автоматически

ВАЖНО: 
- Начинай с "Здравствуйте!" (не "Уважаемый HR-специалист")
- Используй фразу "Меня зовут ${fullName}" (не "Мое имя" или другие варианты)
- Используй имя "${fullName}" вместо любых плейсхолдеров

Сопроводительное письмо:`;
  }

  private cleanGeneratedText(text: string): string {
    // Удаляем лишние символы и форматирование
    return text
      .replace(/^\s*Сопроводительное письмо:?\s*/i, '')
      .replace(/^\s*Письмо:?\s*/i, '')
      .replace(/```/g, '')
      .replace(/\*\*/g, '')
      .trim();
  }

  private getFallbackLetter(vacancyTitle: string, resumeTitle: string, fullName: string = 'Кандидат'): string {
    return `Здравствуйте!

Меня зовут ${fullName}, и меня заинтересовала вакансия "${vacancyTitle}". Я ${resumeTitle} и считаю, что мой опыт и навыки соответствуют требованиям этой позиции.

Буду рад обсудить детали и рассказать, как я могу внести вклад в работу вашей команды.

С уважением,
${fullName}`;
  }

  /**
   * Улучшает существующее письмо
   */
  async improveCoverLetter(originalLetter: string, feedback?: string): Promise<string> {
    try {
      const prompt = `Улучши следующее сопроводительное письмо, сделав его более профессиональным и убедительным.

Оригинальное письмо:
${originalLetter}

${feedback ? `Дополнительные требования: ${feedback}` : ''}

Улучшенное письмо:`;

      const apiKey = process.env.HUGGINGFACE_API_KEY;
      if (!apiKey) {
        throw new Error('HUGGINGFACE_API_KEY is not set');
      }

      const response = await axios.post(
        'https://router.huggingface.co/v1/chat/completions',
        {
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: this.model,
          stream: false,
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 600,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      let generatedText = '';
      if (response.data?.choices?.[0]?.message?.content) {
        generatedText = response.data.choices[0].message.content;
      } else if (response.data?.generated_text) {
        generatedText = response.data.generated_text;
      } else if (Array.isArray(response.data)) {
        generatedText = response.data[0]?.generated_text || response.data[0] || '';
      } else if (typeof response.data === 'string') {
        generatedText = response.data;
      }

      return this.cleanGeneratedText(generatedText.trim()) || originalLetter;
    } catch (error: any) {
      logger.error('Error improving cover letter:', error);
      return originalLetter;
    }
  }
}

export const aiService = new AIService();

