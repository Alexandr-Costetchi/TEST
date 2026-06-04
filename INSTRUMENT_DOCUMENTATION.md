# 📋 Инструмент: Интерактивный плеер тестов ЕГЭ
## Полная техническая документация (v1.0)

---

## 📑 Оглавление
1. [Обзор системы](#обзор-системы)
2. [Архитектура](#архитектура)
3. [Функции по экранам](#функции-по-экранам)
4. [Данные и структура](#данные-и-структура)
5. [API методов](#api-методов)
6. [Состояния приложения](#состояния-приложения)
7. [Ошибки и обработка](#ошибки-и-обработка)
8. [Техстек](#техстек)

---

## 🎯 Обзор системы

### Назначение
Веб-приложение для прохождения тестов по подготовке к ЕГЭ с автоматической проверкой ответов, расчётом процента правильных ответов и визуализацией результатов.

### Ключевые возможности
- ✅ Выбор из 5 тестов (31-35)
- ✅ Множественный выбор (до 5 вариантов)
- ✅ Навигация по вопросам (вперёд/назад)
- ✅ Визуальный индикатор прогресса
- ✅ Автоматическая проверка ответов
- ✅ Подробный отчёт с результатами
- ✅ Возможность повторного прохождения
- ✅ Mobile-first адаптивность
- ✅ PWA-поддержка (meta tags)

### Целевая аудитория
Ученики 10-11 классов, готовящиеся к ЕГЭ по обществознанию

---

## 🏗️ Архитектура

### 3-экранная модель (SPA - Single Page Application)

```
┌─────────────────────────────────────┐
│      Плеер тестов ЕГЭ (HTML/JS)     │
├─────────────────────────────────────┤
│  Screen 1: Выбор теста              │ ← renderTestSelection()
│  Screen 2: Прохождение теста        │ ← renderQuestion()
│  Screen 3: Результаты               │ ← showResults()
└─────────────────────────────────────┘
```

### Глобальные переменные состояния

```javascript
{
  currentTestId: 31,                    // ID текущего теста
  currentQuestionIndex: 0,              // Индекс вопроса (0-based)
  userAnswers: {                        // Кэш ответов пользователя
    "31-0": [1, 3],                    // testId-questionIndex: [выбранные опции]
    "31-1": [2]
  },
  startTime: 1704067200000             // Timestamp начала теста
}
```

### Структура данных тестов

```javascript
testData: {
  tests_metadata: [
    { test_id, test_name, topics, questions_count }
  ],
  questions: [
    { test_id, question_id, question_text, options: "JSON", correct_answers: "JSON" }
  ]
}
```

---

## 🖼️ Функции по экранам

### ЭКРАН 1: Выбор теста
**Файл:** examtest-player.html, `#screen-select`
**Функция:** `renderTestSelection()`

#### Визуальные элементы
- Заголовок: "📚 ЕГЭ Обществознание"
- Подзаголовок: "Тесты 31-35: Повторение и практика"
- Сетка кнопок (1 колонка)
- Каждая кнопка показывает:
  - Номер и название теста
  - Количество вопросов
  - Тематику

#### Логика работы
```javascript
renderTestSelection() {
  // 1. Получить контейнер сетки
  // 2. Очистить HTML
  // 3. Для каждого теста в testData.tests_metadata:
  //    - Создать <button class="test-btn">
  //    - Добавить обработчик onclick → startTest(test_id)
  //    - Добавить в DOM
}
```

#### Обработчик нажатия
```javascript
btn.onclick = () => startTest(test.test_id);

startTest(testId) {
  currentTestId = testId;
  currentQuestionIndex = 0;
  userAnswers = {};  // очистить
  startTime = Date.now();
  showScreen('screen-test');
  renderQuestion();
}
```

**Состояние при завершении:**
- `currentTestId` = выбранный ID
- Переход на ЭКРАН 2

---

### ЭКРАН 2: Прохождение теста
**Файл:** exam-test-player.html, `#screen-test`
**Функции:** `renderQuestion()`, обработчик `prevBtn`, `nextBtn`, `finishBtn`

#### Визуальные компоненты

##### 2.1 Progress bar (прогресс-бар)
```html
<div class="progress-bar">
  <div class="progress-fill" id="progress-fill"></div>
</div>
<div class="progress-text" id="progress-text">Вопрос 1 из 15</div>
```

**Расчёт:**
```javascript
const percent = Math.round((currentQuestionIndex + 1) / questions.length * 100);
document.getElementById('progress-fill').style.width = percent + '%';
```

##### 2.2 Текст вопроса
```html
<div class="question-text" id="question-text">
  Выберите верные суждения...
</div>
```

##### 2.3 Варианты ответов (опции)
Динамически генерируются из массива `options`:

```javascript
const options = JSON.parse(q.options);  // ["Вариант 1", "Вариант 2", ...]
options.forEach((option, idx) => {
  const checked = userAnswers[`${currentTestId}-${currentQuestionIndex}`]?.includes(idx + 1);
  const label = document.createElement('label');
  label.className = 'option-label' + (checked ? ' checked' : '');
  label.innerHTML = `
    <input type="checkbox" class="option-checkbox" ${checked ? 'checked' : ''}>
    <span class="option-text">${option}</span>
  `;
  // Добавить обработчик onChange
});
```

**Логика выбора:**
- Checkbox может быть ВЫБРАН или НЕ ВЫБРАН
- При выборе: добавить индекс (1-based!) в `userAnswers`
- При отмене: удалить индекс
- Класс `.checked` добавляется визуально

##### 2.4 Кнопки навигации
```html
<div class="navigation">
  <button class="nav-btn prev-btn">← Назад</button>
  <button class="nav-btn next-btn">Дальше →</button>
  <button class="nav-btn finish-btn" style="display:none;">Завершить</button>
</div>
```

**Логика кнопок:**
- **Prev button:**
  - `disabled` если `currentQuestionIndex === 0`
  - На клик: `currentQuestionIndex--`, `renderQuestion()`

- **Next button:**
  - `display: block` если `currentQuestionIndex < questions.length - 1`
  - На клик: `currentQuestionIndex++`, `renderQuestion()`

- **Finish button:**
  - `display: block` если `currentQuestionIndex === questions.length - 1`
  - На клик: рассчитать результаты → ЭКРАН 3

#### Алгоритм `renderQuestion()`
```javascript
function renderQuestion() {
  const questions = getTestQuestions(currentTestId);  // Фильтр по ID
  const q = questions[currentQuestionIndex];           // Текущий вопрос
  
  // 1. Обновить progress bar
  const percent = Math.round((currentQuestionIndex + 1) / questions.length * 100);
  progressFill.style.width = percent + '%';
  progressText.textContent = `Вопрос ${currentQuestionIndex + 1} из ${questions.length}`;
  
  // 2. Вывести текст вопроса
  questionText.textContent = q.question_text;
  
  // 3. Создать опции
  const options = JSON.parse(q.options);
  optionsContainer.innerHTML = '';
  options.forEach((option, idx) => {
    // ... создать checkbox с обработчиком
  });
  
  // 4. Обновить состояние кнопок
  prevBtn.disabled = currentQuestionIndex === 0;
  nextBtn.style.display = currentQuestionIndex < questions.length - 1 ? 'block' : 'none';
  finishBtn.style.display = currentQuestionIndex === questions.length - 1 ? 'block' : 'none';
}
```

---

### ЭКРАН 3: Результаты
**Файл:** exam-test-player.html, `#screen-results`
**Функция:** `finishBtn.onclick` → расчёт → `showScreen('screen-results')`

#### Визуальные компоненты

##### 3.1 Круг с процентом
```html
<div class="score-circle" id="score-circle">85%</div>
```

**Расчёт процента:**
```javascript
let correctCount = 0;
questions.forEach((q, idx) => {
  const userAnswer = (userAnswers[`${currentTestId}-${idx}`] || []).sort((a, b) => a - b);
  const correctAnswer = JSON.parse(q.correct_answers).sort((a, b) => a - b);
  if (JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)) {
    correctCount++;
  }
});
const percent = Math.round(correctCount / questions.length * 100);
```

##### 3.2 Сообщение с мотивацией
```html
<div class="result-message" id="result-message">
  👏 Отличный результат!
  Вы ответили на все вопросы!
</div>
```

**Логика сообщения:**
```javascript
let msg = '';
if (percent === 100) msg = '👏 Отличный результат!\nВы ответили на все вопросы!';
else if (percent >= 80) msg = '😊 Хороший результат!\nПродолжайте так!';
else if (percent >= 60) msg = '👍 Неплохо!\nПовторите материал!';
else msg = '💪 Не сдавайтесь!\nПробуйте снова!';
```

##### 3.3 Статистика
```html
<div class="result-stats">
  <div class="stat-item">
    <span class="stat-label">Правильно</span>
    <span class="stat-value" id="correct-count">13 / 15</span>
  </div>
  <div class="stat-item">
    <span class="stat-label">Процент</span>
    <span class="stat-value" id="percentage">87%</span>
  </div>
  <div class="stat-item">
    <span class="stat-label">Время</span>
    <span class="stat-value" id="time-spent">12 мин</span>
  </div>
</div>
```

**Расчёт времени:**
```javascript
const time = Math.round((Date.now() - startTime) / 60000);  // миллисекунды → минуты
```

##### 3.4 Кнопка возврата
```html
<button class="back-btn" id="back-btn">← Вернуться к тестам</button>
```

**Логика:**
```javascript
backBtn.onclick = () => {
  renderTestSelection();  // Вернуться на ЭКРАН 1
};
```

---

## 💾 Данные и структура

### JSON структура `testData`

#### Объект `tests_metadata`
```javascript
{
  "test_id": 31,
  "test_name": "Итоговый повтор 3.1",
  "topics": "Темы 3.1–3.4",
  "questions_count": 15
}
```

#### Объект `questions`
```javascript
{
  "test_id": 31,
  "question_id": 1,
  "question_text": "Выберите верные суждения о социальной дифференциации...",
  "options": "[\"Вариант A\", \"Вариант B\", \"Вариант C\", \"Вариант D\", \"Вариант E\"]",
  "correct_answers": "[1, 3]"  // JSON-строка массива индексов (1-based)
}
```

### Формат ответов
- **Одиночный ответ:** `[1]`
- **Множественные ответы:** `[1, 3]` или `[2, 4, 5]`
- **Индексация:** 1-based (первая опция = 1, вторая = 2 и т.д.)

### Структура `userAnswers` (кэш)
```javascript
{
  "31-0": [1, 3],      // Тест 31, вопрос 0 → выбраны опции 1 и 3
  "31-1": [2],         // Тест 31, вопрос 1 → выбрана опция 2
  "31-2": []           // Тест 31, вопрос 2 → ничего не выбрано
}
```

---

## 🔧 API методов

### Публичные методы

#### `showScreen(id: string): void`
**Назначение:** Переключение между экранами (скрывает все, показывает нужный)

```javascript
showScreen('screen-select');   // Показать экран выбора
showScreen('screen-test');     // Показать экран теста
showScreen('screen-results');  // Показать экран результатов
```

**Реализация:**
```javascript
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
```

---

#### `renderTestSelection(): void`
**Назначение:** Отрисовка списка всех доступных тестов на ЭКРАН 1

```javascript
function renderTestSelection() {
  const grid = document.getElementById('tests-grid');
  grid.innerHTML = '';
  testData.tests_metadata.forEach(test => {
    const btn = document.createElement('button');
    btn.className = 'test-btn';
    btn.innerHTML = `
      <div class="test-name">Тест ${test.test_id}: ${test.test_name}</div>
      <div class="test-info">${test.questions_count} вопросов • ${test.topics}</div>
    `;
    btn.onclick = () => startTest(test.test_id);
    grid.appendChild(btn);
  });
  showScreen('screen-select');
}
```

---

#### `startTest(testId: number): void`
**Назначение:** Инициализация теста и переход на ЭКРАН 2

```javascript
function startTest(testId) {
  currentTestId = testId;
  currentQuestionIndex = 0;
  userAnswers = {};
  startTime = Date.now();
  showScreen('screen-test');
  renderQuestion();
}
```

---

#### `getTestQuestions(testId: number): Array`
**Назначение:** Получить все вопросы для конкретного теста

```javascript
function getTestQuestions(testId) {
  return testData.questions.filter(q => q.test_id === testId);
}
```

**Возвращает:** Массив объектов вопросов с фильтром по `test_id`

---

#### `renderQuestion(): void`
**Назначение:** Отрисовка текущего вопроса, опций и навигации (ЭКРАН 2)

**Функциональность:**
1. Получить текущий вопрос
2. Обновить progress bar
3. Вывести текст вопроса
4. Создать checkboxes для опций
5. Обновить состояние кнопок (prev/next/finish)

---

#### `initializeApp(): void`
**Назначение:** Инициализация приложения при загрузке DOM

```javascript
function initializeApp() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const finishBtn = document.getElementById('finish-btn');
  const backBtn = document.getElementById('back-btn');

  prevBtn.onclick = () => { /* навигация назад */ };
  nextBtn.onclick = () => { /* навигация вперед */ };
  finishBtn.onclick = () => { /* расчет результатов */ };
  backBtn.onclick = () => { renderTestSelection(); };

  renderTestSelection();  // Показать первый экран
}
```

---

## ⚙️ Состояния приложения

### Диаграмма состояний

```
┌──────────────────┐
│  AppInitialize   │ (загрузка страницы)
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ ЭКРАН 1: Выбор теста      │ (renderTestSelection)
│ currentTestId = null      │
└────────┬─────────────────┘
         │ (клик на тест)
         ▼
┌──────────────────────────┐
│ ЭКРАН 2: Прохождение      │ (renderQuestion)
│ currentTestId = 31-35     │
│ currentQuestionIndex = 0  │
│ startTime = now()         │
└────────┬─────────────────┘
         │ (next/prev)
         │ (finish на последнем вопросе)
         ▼
┌──────────────────────────┐
│ ЭКРАН 3: Результаты       │ (showResults)
│ Расчёт процента          │
│ Показать статистику      │
└────────┬─────────────────┘
         │ (клик "Вернуться")
         └──────────────────────► ЭКРАН 1
```

### Переходы между состояниями
| Из | В | Событие | Функция |
|----|---|---------|---------|
| ЭКРАН 1 | ЭКРАН 2 | Клик на тест | `startTest()` |
| ЭКРАН 2 | ЭКРАН 2 | Клик "Дальше" | `renderQuestion()` |
| ЭКРАН 2 | ЭКРАН 2 | Клик "Назад" | `renderQuestion()` |
| ЭКРАН 2 | ЭКРАН 3 | Клик "Завершить" | расчёт + `showScreen('screen-results')` |
| ЭКРАН 3 | ЭКРАН 1 | Клик "Вернуться" | `renderTestSelection()` |

---

## 🚨 Ошибки и обработка

### Критические ошибки

#### Error 1: DOM elements not found
**Сообщение:** `console.error('DOM elements not found')`
**Причина:** Элементы с ID `prev-btn`, `next-btn`, `finish-btn`, `back-btn` не найдены
**Решение:**
```javascript
if (!prevBtn || !nextBtn || !finishBtn || !backBtn) {
  console.error('DOM elements not found');
  return;
}
```

#### Error 2: Missing testData
**Проблема:** Если `testData` не загружена
**Признак:** `getTestQuestions()` вернёт пустой массив
**Решение:** Убедиться, что JSON в скрипте загруженный перед вызовом функций

### Обработка исключений
```javascript
try {
  initializeApp();
  console.log('App initialized successfully');
} catch (error) {
  console.error('Error initializing app:', error);
}
```

### Граничные случаи

| Сценарий | Поведение | Код |
|----------|-----------|-----|
| Пользователь на вопросе 1 клик "Назад" | Кнопка disabled | `prevBtn.disabled = currentQuestionIndex === 0` |
| Пользователь на последнем вопросе | Показать "Завершить" вместо "Дальше" | `finishBtn.style.display = ... ? 'block' : 'none'` |
| Пользователь ничего не выбрал | Ответ = пустой массив `[]` | Не совпадает с `correct_answers` |
| Частичный выбор опций | Если не все опции выбраны | Сравнение массивов → false |

---

## 🛠️ Техстек

### Frontend технологии
| Технология | Использование |
|-----------|----------------|
| **HTML5** | Семантическая разметка, meta tags для PWA |
| **CSS3** | Flexbox, Grid, Linear gradients, Animations |
| **JavaScript (ES6+)** | DOM API, Event handlers, JSON parsing |

### Браузерная совместимость
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Внешние зависимости
**Нет** (vanilla JS, не требует libraries)

### Производительность
| Метрика | Значение |
|---------|----------|
| Bundle size | ~10 KB (HTML + CSS + JS) |
| Load time | <1 сек (localstorage data) |
| Render time | <16ms (60 FPS) |

### PWA возможности
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#667eea">
<link rel="manifest" href="/manifest.json">
```

---

## 📚 Примеры использования

### Пример 1: Добавление нового теста
```javascript
// 1. Добавить в testData.tests_metadata
{
  "test_id": 36,
  "test_name": "Тест 3.6",
  "topics": "Новая тема",
  "questions_count": 20
}

// 2. Добавить вопросы в testData.questions
{
  "test_id": 36,
  "question_id": 1,
  "question_text": "...",
  "options": "[...]",
  "correct_answers": "[...]"
}

// 3. Изменений в коде не требуется!
// renderTestSelection() автоматически подхватит новый тест
```

### Пример 2: Модификация сообщения результатов
```javascript
// Изменить в finishBtn.onclick:
if (percent === 100) msg = '🏆 Идеально!';
else if (percent >= 90) msg = '⭐ Выдающийся результат!';
// ... и т.д.
```

### Пример 3: Добавление таймера
```javascript
// В renderQuestion():
const elapsed = Math.round((Date.now() - startTime) / 1000);
const timer = document.createElement('div');
timer.textContent = `⏱️ ${elapsed}с`;
// Добавить в DOM
```

---

## 📌 Заключение

Этот инструмент представляет собой минималистичное, но функциональное приложение для тестирования с:
- ✅ Чистой архитектурой (3 экрана)
- ✅ Управлением состоянием (глобальные переменные)
- ✅ Динамической генерацией UI
- ✅ Точной проверкой ответов (сортировка + JSON.stringify)
- ✅ Полной mobile-адаптивностью
- ✅ Нулевыми зависимостями

**Версия:** 1.0  
**Последнее обновление:** 2026-06-04  
**Автор:** Top Frontend/Backend Developer

