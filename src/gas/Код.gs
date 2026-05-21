/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ГЛАВНЫЙ ФАЙЛ - Google Apps Script для тестовой системы
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 * Структура:
 * - doGet(e): точка входа для HTTP GET запросов
 * - doPost(e): обработка отправки результатов тестов
 * - getTest(testId): получить конфигурацию теста
 * - Интеграция с Google Sheets для хранения вопросов и результатов
 */

// === КОНФИГУРАЦИЯ ===
const SPREADSHEET_ID = '1nP5GTP9sg8yqgOetbytOTYu5ahFfUOgVjw_NDl5Mi_A';
const SHEET_QUESTIONS = 'Вопросы';
const SHEET_RESULTS = 'Результаты теста';
const SHEET_TESTS = 'Тесты';

// === ENTRY POINT ===
function doGet(e) {
  const testId = parseInt(e.parameter.test) || 33;

  try {
    const testConfig = getTestConfig(testId);
    if (!testConfig) {
      return HtmlService.createHtmlOutput(`<h2 style="color:red;">Ошибка: тест ${testId} не найден</h2>`);
    }

    const questionsData = getTestQuestions(testId);
    const html = generateTestHTML(testId, testConfig, questionsData);

    return HtmlService.createHtmlOutput(html)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    return HtmlService.createHtmlOutput(`<h2 style="color:red;">Ошибка: ${error.message}</h2>`);
  }
}

// === POST обработчик для сохранения результатов ===
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { testId, studentName, answers } = payload;

    // Сохранить результаты
    const resultId = saveTestResults(testId, studentName, answers);

    // Вычислить оценку
    const score = calculateScore(testId, answers);

    // ✅ ОТПРАВИТЬ РЕЗУЛЬТАТЫ НА ПОЧТУ
    sendResultsEmail(testId, studentName, score, resultId);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      resultId: resultId,
      score: score,
      emailSent: true
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// === Получить конфигурацию теста из листа "Тесты" ===
function getTestConfig(testId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const testsSheet = ss.getSheetByName(SHEET_TESTS);

  if (!testsSheet) return null;

  const data = testsSheet.getRange(2, 1, testsSheet.getLastRow() - 1, 5).getValues();
  for (const row of data) {
    if (row[0] == testId) {
      return {
        id: row[0],
        title: row[1],
        questionCount: row[2],
        timeLimit: row[3],
        instructions: row[4]
      };
    }
  }
  return null;
}

// === Получить все вопросы теста из листа "Вопросы" ===
function getTestQuestions(testId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const questionsSheet = ss.getSheetByName(SHEET_QUESTIONS);

  if (!questionsSheet) return [];

  const data = questionsSheet.getRange(2, 1, questionsSheet.getLastRow() - 1, 10).getValues();
  const questions = [];

  for (const row of data) {
    if (row[0] == testId) {
      questions.push({
        num: row[1],
        text: row[2],
        options: [row[3], row[4], row[5], row[6], row[7]],
        correct: JSON.parse(row[8]), // массив [1,3]
        comment: row[9]
      });
    }
  }

  return questions.sort((a, b) => a.num - b.num);
}

// === Сохранить результаты тестирования ===
function saveTestResults(testId, studentName, answers) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const resultsSheet = ss.getSheetByName(SHEET_RESULTS);
  const questionsSheet = ss.getSheetByName(SHEET_QUESTIONS);

  if (!resultsSheet || !questionsSheet) throw new Error('Листы не найдены');

  const timestamp = new Date();
  const questions = getTestQuestions(testId);

  let correctCount = 0, partialCount = 0, wrongCount = 0;
  const detailArray = [];

  // Для каждого вопроса вычислить статус
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const qNum = q.num;
    const studentAnswers = answers[qNum] || [];
    const correctAnswers = q.correct;

    let status = 'неверно';

    // Сравнить массивы
    const sortedStudent = studentAnswers.sort((a, b) => a - b);
    const sortedCorrect = correctAnswers.sort((a, b) => a - b);

    if (JSON.stringify(sortedStudent) === JSON.stringify(sortedCorrect)) {
      status = 'верно';
      correctCount++;
    } else if (studentAnswers.some(a => correctAnswers.includes(a))) {
      status = 'частично';
      partialCount++;
    } else {
      wrongCount++;
    }

    // Запись: ответ студента | правильный ответ | статус
    detailArray.push(studentAnswers.join(','));
    detailArray.push(correctAnswers.join(','));
    detailArray.push(status);
  }

  const totalQuestions = questions.length;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  // Строка результата: timestamp | студент | тест | оценка | верно | частично | неверно | пусто | [детали]
  const resultRow = [
    timestamp, studentName, testId, scorePercent, correctCount, partialCount, wrongCount, '',
    ...detailArray
  ];

  const lastRow = resultsSheet.getLastRow() + 1;
  resultsSheet.getRange(lastRow, 1, 1, resultRow.length).setValues([resultRow]);

  return lastRow;
}

// === Вычислить оценку ===
function calculateScore(testId, answers) {
  const questions = getTestQuestions(testId);
  let correctCount = 0;

  for (const q of questions) {
    const studentAnswers = (answers[q.num] || []).sort((a, b) => a - b);
    const correctAnswers = q.correct.sort((a, b) => a - b);

    if (JSON.stringify(studentAnswers) === JSON.stringify(correctAnswers)) {
      correctCount++;
    }
  }

  return Math.round((correctCount / questions.length) * 100);
}

// === Инициализировать листы и меню ===
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧪 Тесты')
    .addItem('📋 Инициализировать листы', 'initializeSheets')
    .addItem('➕ Добавить тест 33 (26 вопросов)', 'addTest33Questions')
    .addSeparator()
    .addItem('🔗 Получить ссылку на тест 33', 'getTestLink')
    .addToUi();
}

function initializeSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Создать лист "Тесты" если нет
  let testsSheet = ss.getSheetByName(SHEET_TESTS);
  if (!testsSheet) {
    testsSheet = ss.insertSheet(SHEET_TESTS);
    const headers = ['ID Теста', 'Название', 'Кол-во вопросов', 'Лимит времени (мин)', 'Инструкции'];
    testsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    testsSheet.getRange(1, 1, 1, headers.length).setBackground('#4472C4').setFontColor('white').setFontWeight('bold');
  }

  // Создать лист "Вопросы" если нет
  let questionsSheet = ss.getSheetByName(SHEET_QUESTIONS);
  if (!questionsSheet) {
    questionsSheet = ss.insertSheet(SHEET_QUESTIONS);
    const headers = [
      'Тест', '№Вопроса', 'Текст',
      'Вариант1', 'Вариант2', 'Вариант3', 'Вариант4', 'Вариант5',
      'Правильные', 'Комментарий'
    ];
    questionsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    questionsSheet.getRange(1, 1, 1, headers.length).setBackground('#4472C4').setFontColor('white').setFontWeight('bold');
  }

  // Создать лист "Результаты теста" если нет
  let resultsSheet = ss.getSheetByName(SHEET_RESULTS);
  if (!resultsSheet) {
    resultsSheet = ss.insertSheet(SHEET_RESULTS);
    const headers = [
      'Дата', 'Студент', 'Тест', 'Оценка %', 'Верно', 'Частично', 'Неверно', 'Резерв'
    ];
    // Добавить заголовки для 26 вопросов × 3 колонки (ответ|верно|статус)
    for (let i = 1; i <= 26; i++) {
      headers.push(`Q${i}_ответ`, `Q${i}_верно`, `Q${i}_статус`);
    }
    resultsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    resultsSheet.getRange(1, 1, 1, headers.length).setBackground('#4472C4').setFontColor('white').setFontWeight('bold');
  }

  SpreadsheetApp.getUi().alert('✅ Листы инициализированы успешно!');
}

function getTestLink() {
  const scriptUrl = ScriptApp.getService().getUrl();
  const testLink = scriptUrl + '?test=33';

  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    'Ссылка на тест 33:\n\n' + testLink + '\n\n(скопирована в буфер обмена)',
    ui.ButtonSet.OK
  );
}

// === Заглушка для добавления тестов ===
function addTest33Questions() {
  SpreadsheetApp.getUi().alert('Используй init_questions.gs для добавления вопросов');
}
