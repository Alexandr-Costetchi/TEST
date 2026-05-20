/**
 * ИНИЦИАЛИЗАЦИЯ: Заполнить лист "Вопросы" данными теста 33
 * Запустить один раз из меню
 */

function addTest33Questions() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const questionsSheet = ss.getSheetByName(SHEET_QUESTIONS);

  if (!questionsSheet) {
    SpreadsheetApp.getUi().alert('❌ Лист "Вопросы" не найден. Сначала запусти "Инициализировать листы"');
    return;
  }

  // ДАННЫЕ ВСЕХ 26 ВОПРОСОВ ТЕСТА 33
  // Структура: [testId, questionNum, text, option1-5, correct, comment]
  const test33Questions = [
    // Вопрос 1
    [33, 1, "[ВСТАВИТЬ ТЕКСТ ВОПРОСА 1]", "Опция А", "Опция Б", "Опция В", "Опция Г", "Опция Д", "[1,3]", "[КОММЕНТАРИЙ]"],
    // Вопрос 2
    [33, 2, "[ВСТАВИТЬ ТЕКСТ ВОПРОСА 2]", "Опция А", "Опция Б", "Опция В", "Опция Г", "Опция Д", "[2]", "[КОММЕНТАРИЙ]"],
    // ... продолжить для вопросов 3-26 ...
    // Вопрос 26
    [33, 26, "[ВСТАВИТЬ ТЕКСТ ВОПРОСА 26]", "Опция А", "Опция Б", "Опция В", "Опция Г", "Опция Д", "[1,2,4]", "[КОММЕНТАРИЙ]"]
  ];

  // Найти последнюю строку с данными
  let lastRow = questionsSheet.getLastRow();

  // Вставить вопросы
  if (test33Questions.length > 0) {
    questionsSheet.getRange(lastRow + 1, 1, test33Questions.length, 10)
      .setValues(test33Questions);

    SpreadsheetApp.getUi().alert(`✅ ${test33Questions.length} вопросов добавлено!`);
  }

  // Обновить кэш вопросов
  updateQuestionsCache();
}

function updateQuestionsCache() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const questionsSheet = ss.getSheetByName(SHEET_QUESTIONS);

  if (!questionsSheet) return;

  const data = questionsSheet.getRange(2, 1, questionsSheet.getLastRow() - 1, 10).getValues();
  const cache = {};

  data.forEach(row => {
    const testId = row[0];
    const qNum = row[1];

    if (!cache[testId]) cache[testId] = {};

    cache[testId][qNum] = {
      num: qNum,
      text: row[2],
      options: [row[3], row[4], row[5], row[6], row[7]],
      correct: JSON.parse(row[8]),
      comment: row[9]
    };
  });

  PropertiesService.getScriptProperties().setProperty("QUESTIONS_CACHE", JSON.stringify(cache));
}
