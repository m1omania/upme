import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import axios from 'axios';

async function testHuggingFaceAPI() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ HUGGINGFACE_API_KEY не установлен');
    process.exit(1);
  }

  console.log('🔑 API Key найден:', apiKey.substring(0, 7) + '...');
  console.log('🧪 Тестируем API HuggingFace через router.huggingface.co/v1/chat/completions...\n');

  const model = 'Qwen/Qwen2.5-7B-Instruct';

  // Тест 1: Простой запрос через chat/completions (как в проекте dr)
  console.log('📝 Тест 1: Простой запрос через chat/completions API');
  try {
    console.log(`  Используем endpoint: https://router.huggingface.co/v1/chat/completions`);
    console.log(`  Модель: ${model}`);
    
    const response = await axios.post(
      'https://router.huggingface.co/v1/chat/completions',
      {
        messages: [
          {
            role: 'user',
            content: 'Привет! Как дела?',
          },
        ],
        model: model,
        stream: false,
        temperature: 0.7,
        max_tokens: 50,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const generatedText = response.data?.choices?.[0]?.message?.content || '';

    console.log(`✅ Успешно!`);
    console.log('Ответ:', generatedText);
    console.log('📊 Статус:', response.status);
    console.log('📦 Формат ответа:', response.data?.choices ? 'chat/completions' : 'unknown');
    console.log('');
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    if (error.response) {
      console.error('📊 Статус:', error.response.status);
      console.error('📦 Данные:', JSON.stringify(error.response.data).substring(0, 500));
    } else {
      console.error('Детали:', error.stack);
    }
    console.log('');
  }

  // Тест 2: Запрос с промптом для письма
  console.log('📝 Тест 2: Генерация сопроводительного письма');
  try {
    const prompt = `Ты профессиональный HR-специалист. Напиши убедительное сопроводительное письмо для отклика на вакансию.

ВАКАНСИЯ:
Название: UX дизайнер

Описание:
Ищем UX дизайнера для работы над мобильными приложениями.

Требования к кандидату:
Figma, User Research, Prototyping

МОЕ РЕЗЮМЕ:
Должность: UX/UI-дизайнер
Опыт работы: 5 лет в дизайне интерфейсов
Ключевые навыки: Figma, Adobe XD, User Research

Сопроводительное письмо:`;

    const response = await axios.post(
      'https://router.huggingface.co/v1/chat/completions',
      {
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: model,
        stream: false,
        temperature: 0.8,
        top_p: 0.95,
        max_tokens: 300,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const generatedText = response.data?.choices?.[0]?.message?.content || '';

    console.log('✅ Успешно! Сгенерированное письмо:');
    console.log(generatedText);
    console.log('📊 Длина:', generatedText.length, 'символов');
    console.log('');
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    if (error.response) {
      console.error('📊 Статус:', error.response.status);
      console.error('📦 Данные:', JSON.stringify(error.response.data).substring(0, 500));
    } else {
      console.error('Детали:', error.stack);
    }
    console.log('');
  }
}

testHuggingFaceAPI()
  .then(() => {
    console.log('✅ Тестирование завершено');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });
