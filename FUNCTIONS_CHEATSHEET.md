# ⚡ ШПАРГАЛКА: ВСЕ ФУНКЦИИ ПО БЫСТРОМУ

## 🎯 ФУНКЦИИ ПЛЕЕРА (exam-test-player.html)

### Основные функции (6 штук)

```javascript
// 1. Переключение экранов
showScreen('screen-select')      // Показать выбор тестов
showScreen('screen-test')        // Показать тест
showScreen('screen-results')     // Показать результаты

// 2. Список тестов
renderTestSelection()            // Отрисовать 5 тестов на ЭКРАН 1

// 3. Начало теста
startTest(31)                    // Начать тест ID 31, инициализировать
startTest(32)                    // Начать тест ID 32
// ... и т.д.

// 4. Получить вопросы
getTestQuestions(31)             // → Array из 15 вопросов
getTestQuestions(32)             // → Array из 15 вопросов

// 5. Показать вопрос
renderQuestion()                 // Отрисовать текущий вопрос + опции

// 6. Инициализировать приложение
initializeApp()                  // Запустить при загрузке страницы
```

---

## 📊 ПЕРЕМЕННЫЕ СОСТОЯНИЯ

```javascript
currentTestId           // 31-35 или null
currentQuestionIndex    // 0, 1, 2, ... (текущий вопрос)
userAnswers             // { "31-0": [1,3], "31-1": [2] }
startTime               // Date.now() когда начался тест
```

---

## 🔘 ОБРАБОТЧИКИ СОБЫТИЙ

```javascript
// Кнопка "Дальше" (ЭКРАН 2)
nextBtn.onclick = () => {
  currentQuestionIndex++;
  renderQuestion();
}

// Кнопка "Назад" (ЭКРАН 2)
prevBtn.onclick = () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
  }
}

// Кнопка "Завершить" (ЭКРАН 2 → 3)
finishBtn.onclick = () => {
  // Расчёт результатов
  // Показать ЭКРАН 3
}

// Кнопка "Вернуться" (ЭКРАН 3 → 1)
backBtn.onclick = () => {
  renderTestSelection();
}

// Checkbox ответа
checkbox.onchange = (e) => {
  if (e.target.checked) {
    userAnswers[key].push(idx + 1);
    label.classList.add('checked');
  } else {
    userAnswers[key] = userAnswers[key].filter(n => n !== idx + 1);
    label.classList.remove('checked');
  }
}
```

---

## 📈 РАСЧЁТЫ

```javascript
// Прогресс (%)
percent = Math.round((currentQuestionIndex + 1) / questions.length * 100);

// Проверка ответа
const userAnswer = userAnswers[`${testId}-${idx}`].sort((a,b) => a-b);
const correct = JSON.parse(question.correct_answers).sort((a,b) => a-b);
const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correct);

// Результат (%)
correctCount = 0;
questions.forEach((q, idx) => {
  // проверка...
});
resultPercent = Math.round(correctCount / questions.length * 100);

// Время (минуты)
timeMinutes = Math.round((Date.now() - startTime) / 60000);
```

---

## 🗂️ СТРУКТУРА ДАННЫХ

```javascript
// testData
{
  tests_metadata: [
    { test_id: 31, test_name: "...", topics: "...", questions_count: 15 }
  ],
  questions: [
    {
      test_id: 31,
      question_id: 1,
      question_text: "Выберите...",
      options: "[\"A\", \"B\", \"C\", \"D\", \"E\"]",
      correct_answers: "[1, 3]"
    }
  ]
}

// userAnswers
{
  "31-0": [1, 3],      // тест 31, вопрос 0 → опции 1,3
  "31-1": [2],         // тест 31, вопрос 1 → опция 2
  "31-2": []           // тест 31, вопрос 2 → пусто
}
```

---

## 🔌 GOOGLE APPS SCRIPT (BACKEND)

### Файл: Код.gs (основной)
```javascript
doGet()              // GET запрос → отправить HTML
doPost(e)            // POST запрос → сохранить результаты
getTestConfig()      // Получить конфиг из Google Sheet
getQuestions()       // Получить вопросы из листа
saveResults(data)    // Сохранить в "Результаты теста"
```

### Файл: generateTestHTML.gs (генератор)
```javascript
generateHTML()       // Сгенерировать полный HTML плеера
buildCSSStyles()     // Встроить CSS
buildJSCode()        // Встроить JavaScript
```

### Файл: init_questions.gs (инициализация)
```javascript
addTest33Questions() // Добавить 26 вопросов теста 33
initializeSheet()    // Создать листы в таблице
```

---

## 📚 GOOGLE SHEETS API

### Листы в таблице

| Лист | Назначение |
|------|-----------|
| "Архив" | Управление тестами (test_id, название, кол-во вопросов) |
| "Вопросы" | Вопросы (test_id, question_id, текст, опции, ответы) |
| "Результаты теста" | Результаты учащихся (дата, ученик, тест, %) |

### Получить лист
```javascript
SpreadsheetApp.openById(SPREADSHEET_ID)
  .getSheetByName('Вопросы')
  .getDataRange()
  .getValues();  // → Array массивов
```

### Записать в лист
```javascript
sheet.appendRow([
  new Date(),
  studentName,
  testId,
  percent,
  correctCount,
  totalQuestions
]);
```

---

## 🎬 ПОТОК ВЫПОЛНЕНИЯ

### 1. Загрузка страницы
```
DOMContentLoaded
    ↓
initializeApp()
    ↓
Регистрация обработчиков событий
    ↓
renderTestSelection()  → Показать ЭКРАН 1
```

### 2. Выбор теста
```
Клик на тест (кнопка)
    ↓
startTest(testId)
    ↓
Инициализировать состояние
    ↓
renderQuestion()  → Показать ЭКРАН 2
```

### 3. Прохождение
```
Клик на опцию (checkbox)
    ↓
checkbox.onchange()
    ↓
Сохранить в userAnswers
    ↓
Клик "Дальше" или "Назад"
    ↓
currentQuestionIndex++/--
    ↓
renderQuestion()
```

### 4. Завершение
```
Последний вопрос + клик "Завершить"
    ↓
finishBtn.onclick()
    ↓
Расчёт результатов
    ↓
POST /doPost с результатами (Google Apps Script)
    ↓
showScreen('screen-results')  → Показать ЭКРАН 3
```

### 5. Возврат
```
Клик "Вернуться"
    ↓
backBtn.onclick()
    ↓
renderTestSelection()  → Показать ЭКРАН 1
```

---

## 🎨 CSS СЕЛЕКТОРЫ

```css
.screen              /* Все экраны (по умолчанию display: none) */
.screen.active       /* Активный экран (display: block) */

.progress-bar        /* Полоса прогресса */
.progress-fill       /* Заполненная часть */

.question-text       /* Текст вопроса */

.option-label        /* Вариант ответа (label) */
.option-label.checked /* Выбранный вариант */

.option-checkbox     /* Checkbox */
.option-text         /* Текст варианта */

.nav-btn             /* Кнопка навигации */
.prev-btn            /* Кнопка "Назад" */
.next-btn            /* Кнопка "Дальше" */
.finish-btn          /* Кнопка "Завершить" */

.score-circle        /* Круг с процентом */
.result-message      /* Сообщение результата */
.result-stats        /* Блок статистики */
.stat-item           /* Элемент статистики */

.back-btn            /* Кнопка "Вернуться" */
```

---

## 🔐 ПРОВЕРКА ОТВЕТОВ

```javascript
// ВАЖНО: Индексы 1-based (не 0-based!)

// JSON формат правильных ответов
correct_answers: "[1, 3, 5]"  // опции 1, 3, 5

// Как хранится выбор пользователя
userAnswers["31-0"] = [1, 3]  // также 1-based

// Сравнение
const user = [1, 3].sort((a,b) => a-b);
const correct = [1, 3].sort((a,b) => a-b);
JSON.stringify(user) === JSON.stringify(correct)  // true
```

---

## 📱 АДАПТИВНОСТЬ

```html
<!-- Viewport мета-теги -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#667eea">

<!-- Максимальная ширина контейнера -->
<div class="container" style="max-width: 600px;">

<!-- Flexbox для адаптивности -->
<div class="navigation">  <!-- flex: 1 на кнопках -->
</div>
```

---

## 🚀 БЫСТРЫЙ ЗАПУСК

```html
<!DOCTYPE html>
<html>
<head>
  <title>Плеер тестов</title>
  <style>/* CSS */</style>
</head>
<body>
  <div id="screen-select">...</div>
  <div id="screen-test">...</div>
  <div id="screen-results">...</div>

  <script>
    // testData = {...};
    // Глобальные переменные
    // Функции
    // initializeApp();
  </script>
</body>
</html>
```

---

## 🔧 DEBUG КОМАНДЫ (консоль)

```javascript
// Проверить состояние
console.log(currentTestId);
console.log(currentQuestionIndex);
console.log(userAnswers);

// Получить вопросы
console.log(getTestQuestions(31));

// Показать данные теста
console.log(testData.tests_metadata);
console.log(testData.questions);

// Показать текущий вопрос
const q = getTestQuestions(currentTestId)[currentQuestionIndex];
console.log(q);

// Показать опции
console.log(JSON.parse(q.options));

// Показать правильный ответ
console.log(JSON.parse(q.correct_answers));
```

---

## ✅ ЧЕКЛИСТ: Что должно работать

- [ ] Загружается страница → видна ЭКРАН 1
- [ ] Клик на тест → переход на ЭКРАН 2
- [ ] Progress bar обновляется
- [ ] Текст вопроса меняется
- [ ] Checkboxes сохраняют состояние
- [ ] Prev button disabled на первом вопросе
- [ ] Next button исчезает на последнем вопросе
- [ ] Finish button появляется на последнем вопросе
- [ ] Клик "Завершить" → ЭКРАН 3
- [ ] Результаты рассчитаны правильно
- [ ] Клик "Вернуться" → ЭКРАН 1

---

## 📊 ЧИСЛА

```
5 тестов (ID 31-35)
15 вопросов в каждом
5 вариантов ответа в каждом
75 вопросов всего
3 экрана в приложении
6 основных функций
4 обработчика событий
3 файла Google Apps Script
```

---

**Версия:** 1.0  
**Обновлено:** 2026-06-04  
**Для быстрого доступа**

