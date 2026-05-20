/**
 * ВАЛИДАЦИЯ ДАННЫХ ВОПРОСОВ
 *
 * Использование в Node.js:
 *   node validate_questions.js
 *
 * Проверяет:
 * - Все 26 вопросов присутствуют
 * - Каждый вопрос имеет 5 опций
 * - Правильные ответы в диапазоне 1-5
 * - Формат JSON корректен
 */

const fs = require('fs');
const path = require('path');

function validateQuestions() {
  console.log('🔍 Проверка вопросов теста 33...\n');

  try {
    const csvPath = path.join(__dirname, 'TEMPLATE_questions.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');

    // Пропустить заголовок
    const questions = lines.slice(1);

    console.log(`✅ Найдено ${questions.length} вопросов\n`);

    let errors = 0;

    questions.forEach((line, idx) => {
      const questionNum = idx + 1;
      const parts = line.split('","');

      if (parts.length < 10) {
        console.log(`❌ Вопрос ${questionNum}: неверное количество полей`);
        errors++;
        return;
      }

      const testId = parts[0].replace('"', '');
      const qNum = parseInt(parts[1]);
      const text = parts[2];
      const opt1 = parts[3];
      const opt2 = parts[4];
      const opt3 = parts[5];
      const opt4 = parts[6];
      const opt5 = parts[7];
      const correctStr = parts[8];
      const comment = parts[9];

      // Проверка текста
      if (!text || text.length < 10) {
        console.log(`⚠️  Вопрос ${qNum}: текст слишком короткий`);
        errors++;
      }

      // Проверка опций
      [opt1, opt2, opt3, opt4, opt5].forEach((opt, i) => {
        if (!opt || opt.length < 2) {
          console.log(`⚠️  Вопрос ${qNum}: опция ${i+1} пустая или слишком короткая`);
          errors++;
        }
      });

      // Проверка правильных ответов
      try {
        const correct = JSON.parse(correctStr);
        if (!Array.isArray(correct)) {
          console.log(`❌ Вопрос ${qNum}: Правильные ответы должны быть массивом [1,2,3]`);
          errors++;
        } else {
          correct.forEach(num => {
            if (num < 1 || num > 5) {
              console.log(`❌ Вопрос ${qNum}: Неверный номер опции ${num}`);
              errors++;
            }
          });
        }
      } catch (e) {
        console.log(`❌ Вопрос ${qNum}: Ошибка в формате правильных ответов: ${correctStr}`);
        errors++;
      }

      // Проверка комментария
      if (!comment || comment.length < 5) {
        console.log(`⚠️  Вопрос ${qNum}: комментарий слишком короткий`);
      }
    });

    console.log('\n' + '='.repeat(50));
    if (questions.length !== 26) {
      console.log(`❌ ОШИБКА: должно быть 26 вопросов, найдено ${questions.length}`);
    } else {
      console.log(`✅ Все 26 вопросов найдены`);
    }

    if (errors === 0) {
      console.log(`✅ Ошибок не найдено!\n`);
      return true;
    } else {
      console.log(`❌ Найдено ${errors} ошибок!\n`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Ошибка при чтении файла: ${error.message}`);
    return false;
  }
}

// Запуск
const result = validateQuestions();
process.exit(result ? 0 : 1);
