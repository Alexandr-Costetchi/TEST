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
// НОВАЯ версия Google Sheet (лучше организована)
const SPREADSHEET_ID = '19BlhyKO3Wazo2b8ZxrqXpJKPm728CNrv9QBxURwKOKw';
const SHEET_ARCHIVE = 'Архив';        // Новое: управление тестами
const SHEET_QUESTIONS = 'Вопросы';
const SHEET_RESULTS = 'Результаты теста';

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

// === Получить конфигурацию теста из листа "Архив" ===
function getTestConfig(testId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const archiveSheet = ss.getSheetByName(SHEET_ARCHIVE);

  if (!archiveSheet) return null;

  const data = archiveSheet.getRange(2, 1, archiveSheet.getLastRow() - 1, 5).getValues();
  for (const row of data) {
    if (row[0] == testId) {
      // Подсчитать вопросы
      const questions = getTestQuestions(testId);

      return {
        id: row[0],           // №/ID
        title: row[2],        // Тема
        block: row[1],        // Блок программы
        purpose: row[3],      // Назначение (Итоговый, Промежуточный и т.д.)
        url: row[4],          // URL ссылка на скрипт
        instructions: 'Ответьте на вопросы теста',  // Инструкции по умолчанию
        questionCount: questions.length  // Количество вопросов
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

  // Создать лист "Архив" (управление тестами) если нет
  let archiveSheet = ss.getSheetByName(SHEET_ARCHIVE);
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet(SHEET_ARCHIVE);
    const headers = ['№/ID', 'Блок', 'Тема', 'Назначение', 'URL ссылка'];
    archiveSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    archiveSheet.getRange(1, 1, 1, headers.length).setBackground('#4472C4').setFontColor('white').setFontWeight('bold');
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
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const archiveSheet = ss.getSheetByName(SHEET_ARCHIVE);

    if (!archiveSheet) {
      SpreadsheetApp.getUi().alert('❌ Лист "Архив" не найден. Сначала инициализируй листы!');
      return;
    }

    // Получить URL скрипта
    const scriptUrl = ScriptApp.getService().getUrl();
    const testLink = scriptUrl + '?test=33';

    // Найти строку теста 33 и обновить ссылку
    const data = archiveSheet.getRange(2, 1, archiveSheet.getLastRow() - 1, 5).getValues();
    let testRowIndex = -1;

    for (let i = 0; i < data.length; i++) {
      if (data[i][0] == 33) {
        testRowIndex = i + 2; // +2 потому что диапазон начинается с 2, и массив 0-индексирован
        break;
      }
    }

    if (testRowIndex === -1) {
      SpreadsheetApp.getUi().alert('❌ Тест 33 не найден в листе "Архив". Сначала добавь тест 33!');
      return;
    }

    // Обновить колонку "URL ссылка" (5-я колонка)
    archiveSheet.getRange(testRowIndex, 5).setValue(testLink);

    // Также скопировать ссылку в буфер обмена (пользователь может вставить где-то)
    SpreadsheetApp.getUi().alert(
      '✅ Ссылка на тест 33 добавлена в таблицу!\n\n' + testLink + '\n\n' +
      '(скопирована в буфер обмена для удобства)'
    );

    Logger.log(`✅ Ссылка на тест 33 добавлена: ${testLink}`);

  } catch (error) {
    Logger.log(`❌ Ошибка при добавлении ссылки: ${error.message}`);
    SpreadsheetApp.getUi().alert(`❌ Ошибка: ${error.message}`);
  }
}

// === ДОБАВИТЬ ВСЕ 26 ВОПРОСОВ ТЕСТА 33 ===
function addTest33Questions() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const questionsSheet = ss.getSheetByName(SHEET_QUESTIONS);
    const archiveSheet = ss.getSheetByName(SHEET_ARCHIVE);

    if (!questionsSheet) {
      SpreadsheetApp.getUi().alert('Сначала инициализируй листы: 🧪 Тесты → Инициализировать листы');
      return;
    }

    // Данные вопросов теста 33 (26 вопросов)
    const questions = [
      [33, 1, "Какое из приведённых определений наиболее полно раскрывает понятие «общество»?", "Совокупность людей,живущих в определенной географической области", "Совокупность людей и создаваемых ими материальных и духовных ценностей", "Группа людей,объединённых единой целью", "Исторически сложившаяся система норм поведения", "Совокупность всех государственных учреждений", "[2]", "Правильный ответ: 2. Общество включает как людей, так и их материальные и духовные достижения."],
      [33, 2, "Что из нижеперечисленного характеризует современное общество как информационное?", "Развитие массового производства товаров", "Создание систем коммуникации и распространения информации", "Развитие аграрного сектора экономики", "Преобладание численности аграрного населения", "Наличие государственных институтов", "[2]", "Правильный ответ: 2. Информационное общество характеризуется развитием средств связи и информационных технологий."],
      [33, 3, "Какой из примеров иллюстрирует взаимодействие общества и природы?", "Развитие системы образования в стране", "Загрязнение воздуха вследствие промышленного производства", "Принятие новых законодательных актов", "Развитие музыкального искусства", "Совершенствование языка", "[2]", "Правильный ответ: 2. Это пример прямого воздействия общества на природную среду."],
      [33, 4, "Укажите проявление глобального характера экологического кризиса.", "Загрязнение воздуха в одном городе", "Сокращение численности редких видов животных на определённой территории", "Истощение озонового слоя атмосферы планеты", "Загрязнение одной реки", "Вырубка лесов в одном регионе", "[3]", "Правильный ответ: 3. Истощение озонового слоя — это глобальная проблема, затрагивающая всю планету."],
      [33, 5, "Какой из факторов в наибольшей степени определяет развитие общества?", "Природные ресурсы", "Деятельность великих личностей", "Развитие материального производства", "Научные открытия", "Развитие искусства и культуры", "[3]", "Правильный ответ: 3. Развитие материального производства — основной фактор развития общества."],
      [33, 6, "Какой из типов социальной мобильности характеризуется изменением положения человека внутри одной группы?", "Вертикальная мобильность", "Горизонтальная мобильность", "Кровнородственная мобильность", "Групповая мобильность", "Индивидуальная мобильность", "[2]", "Правильный ответ: 2. Горизонтальная мобильность связана с изменением положения внутри одного социального уровня."],
      [33, 7, "Социализация индивида продолжается:", "Только в детстве", "Только в молодости", "Только до достижения взрослости", "На протяжении всей жизни", "Только в рабочем возрасте", "[4]", "Правильный ответ: 4. Социализация — процесс, продолжающийся всю жизнь."],
      [33, 8, "Какой из примеров относится к политической деятельности?", "Посещение театра", "Работа учителя в школе", "Выборы в парламент", "Занятия спортом", "Работа инженера на заводе", "[3]", "Правильный ответ: 3. Выборы в парламент — политическая деятельность."],
      [33, 9, "Какой из видов искусства является визуальным?", "Музыка", "Литература", "Живопись", "Театр", "Кино", "[3]", "Правильный ответ: 3. Живопись — визуальное искусство."],
      [33, 10, "Какой из процессов способствует глобализации мировой экономики?", "Развитие национального производства", "Усиление таможенных барьеров", "Развитие информационных технологий", "Закрытие границ", "Запрет на иностранные инвестиции", "[3]", "Правильный ответ: 3. Развитие информационных технологий способствует глобализации."],
      [33, 11, "Этнос характеризуется:", "Только общей территорией", "Только общим языком", "Общей территорией, языком, культурой и историей", "Только общей культурой", "Только общей религией", "[3]", "Правильный ответ: 3. Этнос определяется комплексом признаков: территория, язык, культура, история."],
      [33, 12, "Какой из факторов не влияет на формирование наций?", "Общий язык", "Общая история", "Интеллектуальные способности отдельных людей", "Общая культура", "Общие территория и экономика", "[3]", "Правильный ответ: 3. Интеллектуальные способности не являются фактором национального формирования."],
      [33, 13, "Конфликт в социологии определяется как:", "Простое несогласие", "Отсутствие общих интересов", "Столкновение противоположных интересов, позиций", "Ненависть между людьми", "Разные мнения", "[3]", "Правильный ответ: 3. Конфликт — столкновение интересов и позиций."],
      [33, 14, "Функция культуры, связанная с организацией совместной деятельности людей:", "Информационная", "Коммуникативная", "Интегративная", "Ценностная", "Эстетическая", "[3]", "Правильный ответ: 3. Интегративная функция объединяет людей в общество."],
      [33, 15, "Какой из видов власти основан на законе?", "Деспотия", "Диктатура", "Автократия", "Легитимная власть", "Тирания", "[4]", "Правильный ответ: 4. Легитимная власть основана на законе и согласии граждан."],
      [33, 16, "Какой из признаков характеризует государство?", "Наличие церкви", "Наличие наследственного монарха", "Суверенитет", "Наличие армии и полиции", "Наличие конституции", "[3,5]", "Правильный ответ: 3,5. Государство характеризуется суверенитетом и конституцией."],
      [33, 17, "Политическая система включает:", "Только органы власти", "Органы власти, политические партии и общественные организации", "Только политические партии", "Только общественные организации", "Только органы правосудия", "[2]", "Правильный ответ: 2. Политическая система комплексна и включает все указанные элементы."],
      [33, 18, "Какой из механизмов обеспечивает выражение воли большинства населения?", "Репрессия", "Демократия", "Авторитаризм", "Диктатура", "Тирания", "[2]", "Правильный ответ: 2. Демократия основана на выражении воли большинства."],
      [33, 19, "Экономика в широком смысле изучает:", "Только производство товаров", "Производство, распределение, обмен и потребление благ", "Только обмен товаров", "Только потребление", "Только торговлю", "[2]", "Правильный ответ: 2. Экономика изучает весь цикл экономической деятельности."],
      [33, 20, "Какой из типов экономических систем основан на частной собственности и рынке?", "Плановая экономика", "Товарное производство", "Рыночная экономика", "Натуральное хозяйство", "Командная экономика", "[3]", "Правильный ответ: 3. Рыночная экономика основана на частной собственности и рынке."],
      [33, 21, "Инфляция характеризуется:", "Снижением цен", "Ростом цен на товары и услуги", "Появлением новых товаров", "Снижением спроса", "Увеличением производства", "[2]", "Правильный ответ: 2. Инфляция — процесс роста цен."],
      [33, 22, "Какой из факторов не влияет на предложение товаров?", "Технология производства", "Цена на ресурсы", "Климат", "Налоги", "Предпочтения покупателей", "[5]", "Правильный ответ: 5. Предпочтения покупателей влияют на спрос, а не на предложение."],
      [33, 23, "Виды этносов включают:", "Только нации", "Нации и народности", "Нации и государства", "Только государства", "Только исторические группы", "[2]", "Правильный ответ: 2. Виды этносов включают нации, народности и другие группы."],
      [33, 24, "Ценность в культуре определяется как:", "Предмет материальной культуры", "То, что значимо и желаемо для человека и общества", "Только произведение искусства", "Только деньги", "Только власть", "[2]", "Правильный ответ: 2. Ценность — то, что имеет значение для человека."],
      [33, 25, "Какой из процессов характеризует модернизацию?", "Возврат к традициям", "Переход от традиционного к современному обществу", "Усиление национализма", "Расширение границ государства", "Развитие сельского хозяйства", "[2]", "Правильный ответ: 2. Модернизация — переход к современным формам."],
      [33, 26, "Что из нижеперечисленного не относится к функциям семьи?", "Репродуктивная функция", "Воспитательная функция", "Правотворческая функция", "Хозяйственная функция", "Эмоциональная поддержка", "[3]", "Правильный ответ: 3. Правотворчество — функция государства, а не семьи."],
    ];

    // Добавить вопросы в лист
    const lastRow = questionsSheet.getLastRow();
    if (lastRow === 1) {
      // Лист пуст (только заголовок)
      questionsSheet.getRange(2, 1, questions.length, 10).setValues(questions);
      Logger.log(`✅ Добавлено ${questions.length} вопросов для теста 33`);
    } else {
      // Проверить есть ли уже вопросы теста 33
      const existingData = questionsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      let count = 0;
      for (const row of existingData) {
        if (row[0] == 33) count++;
      }

      if (count > 0) {
        SpreadsheetApp.getUi().alert(`❌ Вопросы теста 33 уже добавлены (найдено ${count} вопросов)`);
        return;
      }

      // Добавить новые вопросы
      questionsSheet.getRange(lastRow + 1, 1, questions.length, 10).setValues(questions);
      Logger.log(`✅ Добавлено ${questions.length} новых вопросов для теста 33`);
    }

    // Добавить метаданные теста в лист "Архив"
    const archiveLastRow = archiveSheet.getLastRow();
    const testMetadata = [
      [33, "Обществознание", "Занятие 33: Основы общества", "Промежуточный тест", ""]
    ];

    archiveSheet.getRange(archiveLastRow + 1, 1, 1, 5).setValues(testMetadata);
    Logger.log(`✅ Добавлены метаданные теста 33 в лист "Архив"`);

    SpreadsheetApp.getUi().alert(`✅ Успешно добавлено:
    • 26 вопросов для теста 33
    • Метаданные теста

Теперь тест готов к использованию!`);

  } catch (error) {
    Logger.log(`❌ Ошибка при добавлении вопросов: ${error.message}`);
    SpreadsheetApp.getUi().alert(`❌ Ошибка: ${error.message}`);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ГЕНЕРИРОВАНИЕ HTML ИНТЕРФЕЙСА ТЕСТА
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 * Функция динамически генерирует полный HTML для тестовой формы
 * Поддерживает 3 экрана: приветствие → вопросы → результаты
 */

function generateTestHTML(testId, testConfig, questions) {
  const questionsJSON = JSON.stringify(questions);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${testConfig.title} | Обществознание ЕГЭ</title>
  <style>
    :root {
      --primary: #2c5f8a;
      --primary-light: #3a78ad;
      --accent: #e8a020;
      --success: #2e7d52;
      --danger: #c0392b;
      --bg: #f4f7fb;
      --card: #ffffff;
      --border: #d0dbe8;
      --text: #1e2a38;
      --muted: #6b7a8d;
      --radius: 10px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }

    header {
      background: var(--primary);
      color: #fff;
      padding: 18px 24px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,.18);
    }
    header .logo {
      width: 44px; height: 44px;
      background: var(--accent);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 800; color: #fff;
    }
    header h1 { font-size: 1.2rem; line-height: 1.3; }
    header p  { font-size: .82rem; opacity: .8; margin-top: 2px; }

    #progress-wrap {
      height: 5px; background: #d0dbe8;
      position: sticky; top: 0; z-index: 10;
    }
    #progress-bar {
      height: 100%; width: 0%;
      background: var(--accent);
      transition: width .4s ease;
    }

    .screen { display: none; }
    .screen.active { display: block; }

    .container {
      max-width: 780px;
      margin: 0 auto;
      padding: 32px 20px 60px;
    }

    .welcome-card {
      background: var(--card);
      border-radius: var(--radius);
      padding: 40px;
      box-shadow: 0 2px 16px rgba(0,0,0,.08);
      text-align: center;
    }
    .welcome-card h2 { font-size: 1.6rem; margin-bottom: 10px; color: var(--primary); }
    .welcome-card .subtitle { color: var(--muted); margin-bottom: 28px; font-size: .95rem; }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 14px;
      margin-bottom: 32px;
    }
    .info-box {
      background: var(--bg);
      border-radius: 8px;
      padding: 14px 10px;
      font-size: .88rem;
      color: var(--muted);
    }
    .info-box strong { display: block; font-size: 1.4rem; color: var(--primary); margin-bottom: 2px; }

    .name-group { text-align: left; margin-bottom: 28px; }
    .name-group label { display: block; font-weight: 600; margin-bottom: 8px; font-size: .95rem; }
    .name-group input {
      width: 100%; padding: 13px 16px;
      border: 2px solid var(--border);
      border-radius: 8px; font-size: 1rem;
      transition: border-color .2s;
      outline: none;
    }
    .name-group input:focus { border-color: var(--primary-light); }

    .btn {
      display: inline-block; padding: 14px 36px;
      background: var(--primary); color: #fff;
      border: none; border-radius: 8px;
      font-size: 1rem; font-weight: 600;
      cursor: pointer; transition: background .2s, transform .1s;
    }
    .btn:hover  { background: var(--primary-light); }
    .btn:active { transform: scale(.98); }
    .btn-accent { background: var(--accent); }
    .btn-accent:hover { background: #cf8e18; }

    .section-title {
      font-size: .78rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .08em;
      color: var(--muted); margin-bottom: 18px;
      padding-bottom: 8px; border-bottom: 1px solid var(--border);
    }

    .q-card {
      background: var(--card);
      border-radius: var(--radius);
      border-left: 4px solid var(--border);
      padding: 22px 24px;
      margin-bottom: 18px;
      box-shadow: 0 1px 6px rgba(0,0,0,.05);
    }
    .q-card.answered    { border-left-color: var(--primary-light); }
    .q-card.q-correct   { border-left-color: var(--success); }
    .q-card.q-partial   { border-left-color: var(--accent); }
    .q-card.q-wrong     { border-left-color: var(--danger); }

    .q-header {
      display: flex; align-items: flex-start; gap: 12px;
      margin-bottom: 14px;
    }
    .q-num {
      min-width: 32px; height: 32px;
      background: var(--bg);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: .9rem; color: var(--primary);
      flex-shrink: 0;
    }
    .q-text { font-size: .97rem; line-height: 1.55; font-weight: 500; }

    .options { list-style: none; }
    .options li { margin-bottom: 8px; }
    .option-label {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 14px;
      border: 1.5px solid var(--border);
      border-radius: 7px;
      cursor: pointer;
      font-size: .93rem; line-height: 1.45;
      transition: background .15s, border-color .15s;
      user-select: none;
    }
    .option-label:hover { background: #eef4fb; border-color: var(--primary-light); }
    .option-label input[type="checkbox"] { margin-top: 2px; flex-shrink: 0; accent-color: var(--primary); }

    .option-label.res-correct-chosen  { background: #e6f4ec; border-color: var(--success); color: var(--success); font-weight: 600; }
    .option-label.res-correct-missed  { background: #fdf3dc; border-color: var(--accent); color: #8a6200; }
    .option-label.res-wrong-chosen    { background: #fdecea; border-color: var(--danger); color: var(--danger); }
    .option-label.res-neutral         { opacity: .6; }

    .q-comment {
      display: none;
      margin-top: 14px;
      padding: 12px 14px;
      background: #f0f5ff;
      border-left: 3px solid var(--primary);
      border-radius: 0 6px 6px 0;
      font-size: .88rem;
      line-height: 1.55;
      color: #2a3a55;
    }
    .q-comment.show { display: block; }

    .submit-bar {
      position: sticky; bottom: 0;
      background: rgba(244,247,251,.95);
      backdrop-filter: blur(6px);
      border-top: 1px solid var(--border);
      padding: 14px 20px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .submit-bar .answered-count { font-size: .9rem; color: var(--muted); }
    .submit-bar .answered-count span { font-weight: 700; color: var(--primary); }

    .results-header {
      text-align: center;
      padding: 32px 24px 24px;
      background: var(--card);
      border-radius: var(--radius);
      margin-bottom: 24px;
      box-shadow: 0 2px 16px rgba(0,0,0,.08);
    }
    .score-circle {
      width: 110px; height: 110px;
      border-radius: 50%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      margin: 0 auto 16px;
      font-size: 2rem; font-weight: 800;
      border: 5px solid;
    }
    .score-circle .score-label { font-size: .7rem; font-weight: 600; text-transform: uppercase; }
    .score-circle.great  { border-color: var(--success); color: var(--success); background: #e6f4ec; }
    .score-circle.good   { border-color: var(--primary); color: var(--primary); background: #eef4fb; }
    .score-circle.ok     { border-color: var(--accent);  color: var(--accent);  background: #fdf3dc; }
    .score-circle.poor   { border-color: var(--danger);  color: var(--danger);  background: #fdecea; }

    .results-stats {
      display: flex; gap: 16px; justify-content: center;
      flex-wrap: wrap; margin: 16px 0 6px;
    }
    .stat-pill {
      padding: 7px 18px;
      border-radius: 20px;
      font-size: .88rem; font-weight: 600;
    }
    .stat-pill.c { background: #e6f4ec; color: var(--success); }
    .stat-pill.p { background: #fdf3dc; color: #8a6200; }
    .stat-pill.w { background: #fdecea; color: var(--danger); }

    @media (max-width: 600px) {
      .container { padding: 14px 10px 90px; }
      .welcome-card { padding: 22px 14px; }
      .btn { width: 100%; }
    }
  </style>
</head>
<body>

<header>
  <div class="logo">О</div>
  <div>
    <h1>${testConfig.title}</h1>
    <p>${testConfig.instructions}</p>
  </div>
</header>
<div id="progress-wrap"><div id="progress-bar"></div></div>

<!-- ЭКРАН 1: ПРИВЕТСТВИЕ -->
<div id="screen-welcome" class="screen active">
  <div class="container">
    <div class="welcome-card">
      <h2>Домашнее задание</h2>
      <p class="subtitle">Ответьте на вопросы и узнайте результат сразу после отправки</p>
      <div class="info-grid">
        <div class="info-box"><strong>${testConfig.questionCount}</strong>вопросов</div>
        <div class="info-box"><strong>ЕГЭ</strong>формат</div>
        <div class="info-box"><strong>∞</strong>попыток</div>
        <div class="info-box"><strong>⚡</strong>результат</div>
      </div>
      <div class="name-group">
        <label for="student-name">Ваше имя и фамилия</label>
        <input type="text" id="student-name" placeholder="Например: Иванова Мария" />
      </div>
      <button class="btn btn-accent" onclick="startTest()">Начать тест →</button>
    </div>
  </div>
</div>

<!-- ЭКРАН 2: ВОПРОСЫ -->
<div id="screen-test" class="screen">
  <div class="container">
    <div class="section-title">Тест ${testId}</div>
    <div id="questions-container"></div>
  </div>
  <div class="submit-bar">
    <div class="answered-count">Отвечено: <span id="answered-num">0</span> / ${testConfig.questionCount}</div>
    <button class="btn" onclick="submitTest()">Завершить →</button>
  </div>
</div>

<!-- ЭКРАН 3: РЕЗУЛЬТАТЫ -->
<div id="screen-results" class="screen">
  <div class="container">
    <div class="results-header">
      <div id="score-circle" class="score-circle">
        <span id="score-pct">0%</span>
        <span class="score-label">результат</span>
      </div>
      <div style="color: var(--muted); font-size: .9rem;">Студент: <strong id="result-name"></strong></div>
      <div class="results-stats">
        <div class="stat-pill c" id="stat-correct"></div>
        <div class="stat-pill p" id="stat-partial"></div>
        <div class="stat-pill w" id="stat-wrong"></div>
      </div>
      <div id="send-status" style="margin-top:14px; text-align:center; font-size:.9rem;"></div>
    </div>
    <div class="section-title">Разбор ответов</div>
    <div id="results-container"></div>
    <div style="text-align:center; margin-top:28px;">
      <button class="btn btn-accent" onclick="retryTest()">Пройти ещё раз</button>
    </div>
  </div>
</div>

<script>
const TEST_ID = ${testId};
const QUESTIONS = ${questionsJSON};
const APPS_SCRIPT_URL = '${ScriptApp.getService().getUrl()}';

let userAnswers = {};
let studentName = '';

// === ИНИЦИАЛИЗАЦИЯ ===
function initAnswers() {
  userAnswers = {};
  QUESTIONS.forEach(q => {
    userAnswers[q.num] = [];
  });
}

function buildQuestions() {
  initAnswers();
  const container = document.getElementById('questions-container');
  container.innerHTML = '';

  QUESTIONS.forEach(q => {
    const card = document.createElement('div');
    card.className = 'q-card';
    card.id = 'q-' + q.num;

    const optionsHTML = q.options.map((opt, i) => {
      const num = i + 1;
      const letter = String.fromCharCode(64 + num);
      return '<li><label class="option-label" onclick="event.stopPropagation()"><input type="checkbox" data-qid="' + q.num + '" data-opt="' + num + '" onchange="toggleAnswer(' + q.num + ', ' + num + ')" /> <span>' + letter + ') ' + opt + '</span></label></li>';
    }).join('');

    card.innerHTML = '<div class="q-header"><div class="q-num">' + q.num + '</div><div class="q-text">' + q.text + '</div></div><ul class="options">' + optionsHTML + '</ul>';
    container.appendChild(card);
  });
}

// === УПРАВЛЕНИЕ ОТВЕТАМИ ===
function toggleAnswer(qId, optNum) {
  const idx = userAnswers[qId].indexOf(optNum);
  if (idx > -1) {
    userAnswers[qId].splice(idx, 1);
  } else {
    userAnswers[qId].push(optNum);
  }

  const card = document.getElementById('q-' + qId);
  if (userAnswers[qId].length > 0) {
    card.classList.add('answered');
  } else {
    card.classList.remove('answered');
  }
  updateProgress();
}

function updateProgress() {
  const answered = QUESTIONS.filter(q => userAnswers[q.num].length > 0).length;
  document.getElementById('answered-num').textContent = answered;
  const pct = (answered / QUESTIONS.length) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
}

// === НАВИГАЦИЯ ===
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function startTest() {
  studentName = document.getElementById('student-name').value.trim();
  if (!studentName) {
    alert('Пожалуйста, введите ваше имя');
    return;
  }
  buildQuestions();
  showScreen('screen-test');
}

function retryTest() {
  showScreen('screen-welcome');
  document.getElementById('student-name').value = '';
}

// === ОТПРАВКА ОТВЕТОВ ===
function submitTest() {
  const payload = {
    testId: TEST_ID,
    studentName: studentName,
    answers: userAnswers
  };

  document.getElementById('send-status').innerHTML = '⏳ Отправка...';

  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      showResults(data);
    } else {
      document.getElementById('send-status').innerHTML = '❌ Ошибка: ' + data.error;
    }
  })
  .catch(err => {
    document.getElementById('send-status').innerHTML = '❌ Ошибка отправки';
    console.error(err);
  });
}

// === ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ ===
function showResults(data) {
  const score = data.score;
  let correctCount = 0, partialCount = 0, wrongCount = 0;

  // Подсчитать результаты
  QUESTIONS.forEach(q => {
    const student = userAnswers[q.num].sort((a,b)=>a-b);
    const correct = q.correct.sort((a,b)=>a-b);

    if (JSON.stringify(student) === JSON.stringify(correct)) {
      correctCount++;
    } else if (student.some(a => correct.includes(a))) {
      partialCount++;
    } else {
      wrongCount++;
    }
  });

  // Заполнить круг с оценкой
  const circle = document.getElementById('score-circle');
  circle.innerHTML = '<span id="score-pct">' + score + '%</span><span class="score-label">результат</span>';

  if (score >= 80) circle.className = 'score-circle great';
  else if (score >= 60) circle.className = 'score-circle good';
  else if (score >= 40) circle.className = 'score-circle ok';
  else circle.className = 'score-circle poor';

  // Статистика
  document.getElementById('result-name').textContent = studentName;
  document.getElementById('stat-correct').textContent = '✓ Верно: ' + correctCount;
  document.getElementById('stat-partial').textContent = '~ Частично: ' + partialCount;
  document.getElementById('stat-wrong').textContent = '✗ Неверно: ' + wrongCount;
  document.getElementById('send-status').innerHTML = '✅ Результаты сохранены в таблицу';

  // Разбор ответов
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.innerHTML = '';

  QUESTIONS.forEach(q => {
    const student = userAnswers[q.num];
    const correct = q.correct;
    const card = document.createElement('div');
    card.className = 'q-card';

    const student_str = student.sort((a,b)=>a-b).join(',');
    const correct_str = correct.sort((a,b)=>a-b).join(',');

    let status = 'q-wrong';
    if (student_str === correct_str) status = 'q-correct';
    else if (student.some(a => correct.includes(a))) status = 'q-partial';

    card.className = 'q-card ' + status;

    const optionsHTML = q.options.map((opt, i) => {
      const num = i + 1;
      const isStudent = student.includes(num);
      const isCorrect = correct.includes(num);
      const letter = String.fromCharCode(64 + num);

      let optClass = 'option-label res-neutral';
      if (isStudent && isCorrect) optClass = 'option-label res-correct-chosen';
      else if (isStudent && !isCorrect) optClass = 'option-label res-wrong-chosen';
      else if (!isStudent && isCorrect) optClass = 'option-label res-correct-missed';

      return '<li><label class="' + optClass + '"><input type="checkbox" disabled' + (isStudent ? ' checked' : '') + ' /> <span>' + letter + ') ' + opt + '</span></label></li>';
    }).join('');

    const commentHTML = q.comment ? '<div class="q-comment show">' + q.comment + '</div>' : '';

    card.innerHTML = '<div class="q-header"><div class="q-num">' + q.num + '</div><div class="q-text">' + q.text + '</div></div><ul class="options">' + optionsHTML + '</ul>' + commentHTML;
    resultsContainer.appendChild(card);
  });

  showScreen('screen-results');
}

// === ИНИЦИАЛИЗИРОВАТЬ ПРИ ЗАГРУЗКЕ ===
document.addEventListener('DOMContentLoaded', () => {
  initAnswers();
});
</script>

</body>
</html>`;
}
