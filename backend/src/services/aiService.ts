import { HfInference } from '@huggingface/inference';
import logger from '../config/logger';
import { cache } from '../utils/cache';

export class AIService {
  private hf: HfInference | null = null;
  private model = 'mistralai/Mistral-7B-Instruct-v0.2'; // Можно использовать другую модель

  private getClient(): HfInference {
    if (!this.hf) {
      const apiKey = process.env.HUGGINGFACE_API_KEY;
      if (!apiKey) {
        throw new Error('HUGGINGFACE_API_KEY is not set');
      }
      this.hf = new HfInference(apiKey);
    }
    return this.hf;
  }

  /**
   * Генерирует сопроводительное письмо на основе вакансии и резюме
   */
  async generateCoverLetter(
    vacancyTitle: string,
    vacancyDescription: string,
    vacancyRequirements: string[],
    resumeTitle: string,
    resumeExperience: string,
    resumeSkills: string[]
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
        resumeSkills
      );

      logger.info('Generating cover letter with HuggingFace API');

      const hf = this.getClient();
      const response = await hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false,
        },
      });

      let letter = response.generated_text.trim();

      // Очистка и форматирование
      letter = this.cleanGeneratedText(letter);

      // Если ответ слишком короткий, попробуем еще раз
      if (letter.length < 100) {
        logger.warn('Generated letter is too short, retrying...');
        const retryResponse = await hf.textGeneration({
          model: this.model,
          inputs: prompt,
          parameters: {
            max_new_tokens: 800,
            temperature: 0.8,
            top_p: 0.95,
            return_full_text: false,
          },
        });
        letter = this.cleanGeneratedText(retryResponse.generated_text.trim());
      }

      const finalLetter = letter || this.getFallbackLetter(vacancyTitle, resumeTitle);
      
      // Кэшируем результат на 1 час
      cache.set(cacheKey, finalLetter, 3600);
      
      return finalLetter;
    } catch (error: any) {
      logger.error('Error generating cover letter:', error);
      // Возвращаем шаблонное письмо в случае ошибки
      return this.getFallbackLetter(vacancyTitle, resumeTitle);
    }
  }

  private buildPrompt(
    vacancyTitle: string,
    vacancyDescription: string,
    vacancyRequirements: string[],
    resumeTitle: string,
    resumeExperience: string,
    resumeSkills: string[]
  ): string {
    return `Напиши профессиональное сопроводительное письмо для отклика на вакансию.

Вакансия: ${vacancyTitle}

Описание вакансии:
${vacancyDescription.substring(0, 1000)}

Требования:
${vacancyRequirements.join(', ')}

Мое резюме:
Должность: ${resumeTitle}
Опыт: ${resumeExperience.substring(0, 500)}
Навыки: ${resumeSkills.join(', ')}

Требования к письму:
- Профессиональный тон
- Укажи, почему ты подходишь для этой позиции
- Упомяни релевантный опыт и навыки
- Будь конкретным, но кратким (2-3 абзаца)
- Начни с приветствия

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

  private getFallbackLetter(vacancyTitle: string, resumeTitle: string): string {
    return `Здравствуйте!

Меня заинтересовала вакансия "${vacancyTitle}". Я ${resumeTitle} и считаю, что мой опыт и навыки соответствуют требованиям этой позиции.

Буду рад обсудить детали и рассказать, как я могу внести вклад в работу вашей команды.

С уважением`;
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

      const hf = this.getClient();
      const response = await hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false,
        },
      });

      return this.cleanGeneratedText(response.generated_text.trim()) || originalLetter;
    } catch (error: any) {
      logger.error('Error improving cover letter:', error);
      return originalLetter;
    }
  }
}

export const aiService = new AIService();

