/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ОТПРАВКА РЕЗУЛЬТАТОВ НА EMAIL - sendEmail.gs
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 * Функции для отправки красивых HTML писем с результатами тестов
 * Email: Gascfif@yandex.com
 */

// === КОНФИГУРАЦИЯ ===
const TEACHER_EMAIL = 'Gascfif@yandex.com';  // 👈 Email учителя
const SEND_EMAIL = true;                      // Включить/выключить отправку

// === ГЛАВНАЯ ФУНКЦИЯ ОТПРАВКИ ===
function sendResultsEmail(testId, studentName, score, resultId) {

  if (!SEND_EMAIL) {
    Logger.log('⚠️ Отправка email отключена');
    return false;
  }

  try {
    // 1. Получить данные теста
    const testConfig = getTestConfig(testId);
    if (!testConfig) {
      Logger.log(`❌ Тест ${testId} не найден`);
      return false;
    }

    // 2. Получить вопросы теста
    const questions = getTestQuestions(testId);

    // 3. Получить результаты студента из листа
    const studentResults = getStudentResults(studentName, testId, resultId);

    // 4. Построить HTML письмо
    const htmlBody = buildEmailHTML(testId, studentName, score, testConfig, studentResults, questions);

    // 5. Составить тему
    const subject = `Результаты теста ${testId}: ${studentName} - ${score}%`;

    // 6. ОТПРАВИТЬ ПИСЬМО
    GmailApp.sendEmail(
      TEACHER_EMAIL,           // Кому
      subject,                 // Тема
      '',                      // Текст (пусто, так как используем HTML)
      {
        htmlBody: htmlBody,    // HTML версия
        name: 'Система тестирования verny-kurs.ru'  // От кого
      }
    );

    // 7. Логировать успех
    Logger.log(`✅ Email отправлен на ${TEACHER_EMAIL}`);
    Logger.log(`   Студент: ${studentName}, Тест: ${testId}, Оценка: ${score}%`);

    return true;

  } catch (error) {
    Logger.log(`❌ ОШИБКА при отправке email: ${error.message}`);
    Logger.log(`   Stack: ${error.stack}`);

    // Важно: результаты всё равно сохранены в Sheet!
    return false;
  }
}

// === ПОСТРОИТЬ HTML ПИСЬМО ===
function buildEmailHTML(testId, studentName, score, testConfig, studentResults, questions) {

  // Подсчитать статистику
  let correctCount = 0, partialCount = 0, wrongCount = 0;

  for (const result of studentResults) {
    if (result.status === 'верно') correctCount++;
    else if (result.status === 'частично') partialCount++;
    else wrongCount++;
  }

  // Определить цвет для оценки
  let scoreColor = '#c0392b';  // Красный (0-50%)
  if (score >= 50 && score < 75) scoreColor = '#e8a020';  // Оранжевый (50-75%)
  if (score >= 75) scoreColor = '#2e7d52';  // Зелёный (75-100%)

  // Построить строки таблицы с результатами
  let tableRows = '';
  for (let i = 0; i < studentResults.length; i++) {
    const result = studentResults[i];
    const questionNum = i + 1;

    // Определить цвет статуса
    let statusColor = '#ffcccc';  // Красный (неверно)
    let statusText = 'неверно';

    if (result.status === 'верно') {
      statusColor = '#ccffcc';  // Зелёный
      statusText = 'верно';
    } else if (result.status === 'частично') {
      statusColor = '#ffffcc';  // Жёлтый
      statusText = 'частично';
    }

    tableRows += `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: center;">В${questionNum}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${result.studentAnswer}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${result.correctAnswer}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; background-color: ${statusColor}; text-align: center;">${statusText}</td>
      </tr>
    `;
  }

  // HTML письмо
  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9f9f9;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #2c5f8a 0%, #3a78ad 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      text-align: center;
    }
    .header h2 {
      margin: 0;
      font-size: 24px;
      margin-bottom: 5px;
    }
    .header p {
      margin: 5px 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .info-section {
      background-color: #f5f5f5;
      padding: 15px;
      border-left: 4px solid #2c5f8a;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .info-label {
      font-weight: bold;
      color: #2c5f8a;
      min-width: 200px;
    }
    .info-value {
      color: #333;
    }
    .score-badge {
      display: inline-block;
      background-color: ${scoreColor};
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 18px;
      font-weight: bold;
      margin: 10px 0;
    }
    .stats {
      display: flex;
      gap: 20px;
      margin-top: 15px;
      justify-content: center;
    }
    .stat {
      text-align: center;
      padding: 10px 20px;
      background-color: white;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    .stat-number {
      font-size: 20px;
      font-weight: bold;
      color: #2c5f8a;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background-color: white;
    }
    th {
      background-color: #2c5f8a;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    tr:hover {
      background-color: #f9f9f9;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .footer a {
      color: #2c5f8a;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">

    <!-- ЗАГОЛОВОК -->
    <div class="header">
      <h2>Результаты теста — Занятие ${testId}</h2>
      <p>Обществознание ЕГЭ</p>
    </div>

    <!-- ОСНОВНАЯ ИНФОРМАЦИЯ -->
    <div class="info-section">
      <div class="info-row">
        <span class="info-label">Ученик:</span>
        <span class="info-value"><strong>${studentName}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Дата:</span>
        <span class="info-value"><strong>${new Date().toLocaleString('ru-RU')}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Название теста:</span>
        <span class="info-value"><strong>${testConfig.title}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Инструкции:</span>
        <span class="info-value">${testConfig.instructions}</span>
      </div>

      <!-- ОЦЕНКА -->
      <div style="text-align: center; margin-top: 15px;">
        <span class="score-badge">${score}%</span>
      </div>

      <!-- СТАТИСТИКА -->
      <div class="stats">
        <div class="stat">
          <div class="stat-number" style="color: #2e7d52;">${correctCount}</div>
          <div class="stat-label">Верно</div>
        </div>
        <div class="stat">
          <div class="stat-number" style="color: #e8a020;">${partialCount}</div>
          <div class="stat-label">Частично</div>
        </div>
        <div class="stat">
          <div class="stat-number" style="color: #c0392b;">${wrongCount}</div>
          <div class="stat-label">Неверно</div>
        </div>
      </div>
    </div>

    <!-- ТАБЛИЦА С РЕЗУЛЬТАТАМИ -->
    <h3 style="color: #2c5f8a; margin-top: 30px;">Детали по вопросам</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 80px;">№</th>
          <th style="width: 150px;">Ответ студента</th>
          <th style="width: 150px;">Правильный ответ</th>
          <th style="width: 120px;">Статус</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <!-- НИЖНЯЯ ЧАСТЬ -->
    <div class="footer">
      <p>Это автоматическое письмо из системы тестирования verny-kurs.ru</p>
      <p>Полные результаты доступны в Google Sheet:</p>
      <p><a href="https://docs.google.com/spreadsheets/d/1nP5GTP9sg8yqgOetbytOTYu5ahFfUOgVjw_NDl5Mi_A/">Открыть Google Sheet</a></p>
      <p style="margin-top: 15px; color: #999;">
        ID результата: ${resultId}<br>
        Отправлено: ${new Date().toISOString()}
      </p>
    </div>

  </div>
</body>
</html>
  `;

  return html;
}

// === ПОЛУЧИТЬ РЕЗУЛЬТАТЫ СТУДЕНТА ===
function getStudentResults(studentName, testId, resultId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const resultsSheet = ss.getSheetByName(SHEET_RESULTS);

  if (!resultsSheet) return [];

  // Получить строку результата по resultId
  const data = resultsSheet.getRange(resultId, 1, 1, resultsSheet.getLastColumn()).getValues()[0];

  if (!data) return [];

  // Данные в строке:
  // [0]=Дата, [1]=Студент, [2]=Тест, [3]=Оценка, [4]=Верно, [5]=Частично, [6]=Неверно, [7]=Резерв,
  // [8]=Q1_ответ, [9]=Q1_верно, [10]=Q1_статус, [11]=Q2_ответ, ...

  const results = [];
  const questions = getTestQuestions(testId);

  for (let i = 0; i < questions.length; i++) {
    const baseIndex = 8 + (i * 3);  // Каждый вопрос занимает 3 колонки

    results.push({
      questionNum: i + 1,
      studentAnswer: data[baseIndex] || '',      // Q_ответ
      correctAnswer: data[baseIndex + 1] || '',  // Q_верно
      status: data[baseIndex + 2] || 'неверно'   // Q_статус
    });
  }

  return results;
}

// === ИНТЕГРИРОВАТЬ В doPost() ===
// Добавить эту строку в функцию doPost() ПОСЛЕ saveTestResults():
//
// sendResultsEmail(testId, studentName, score, resultId);
//
// Пример:
// function doPost(e) {
//   try {
//     const payload = JSON.parse(e.postData.contents);
//     const { testId, studentName, answers } = payload;
//
//     const resultId = saveTestResults(testId, studentName, answers);
//     const score = calculateScore(testId, answers);
//
//     // ✅ ДОБАВИТЬ ЭТУ СТРОКУ:
//     sendResultsEmail(testId, studentName, score, resultId);
//
//     return ContentService.createTextOutput(JSON.stringify({
//       success: true,
//       resultId: resultId,
//       score: score,
//       emailSent: true
//     })).setMimeType(ContentService.MimeType.JSON);
//   } catch (error) { ... }
// }
