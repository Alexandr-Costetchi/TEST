# 🔌 API Справочник - Плеер тестов ЕГЭ

## Полный справочник функций, событий и структур данных

---

## 📌 Быстрый старт для разработчиков

### Минимальный пример интеграции
```javascript
// 1. Загрузить данные тестов
const testData = { tests_metadata: [...], questions: [...] };

// 2. Инициализировать приложение
initializeApp();

// 3. Приложение готово к использованию
```

### Структура файла
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Плеер тестов</title>
    <style>/* CSS стили */</style>
  </head>
  <body>
    <!-- Экран 1: Выбор -->
    <div class="screen active" id="screen-select">...</div>
    
    <!-- Экран 2: Тест -->
    <div class="screen" id="screen-test">...</div>
    
    <!-- Экран 3: Результаты -->
    <div class="screen" id="screen-results">...</div>
    
    <script>
      // Данные
      const testData = {...};
      
      // Глобальное состояние
      let currentTestId = null;
      let currentQuestionIndex = 0;
      let userAnswers = {};
      let startTime = null;
      
      // Функции
      function showScreen(id) {...}
      function renderTestSelection() {...}
      // ... и т.д.
      
      // Инициализация
      initializeApp();
    </script>
  </body>
</html>
```

---

## 🎛️ Управление состоянием

### Глобальные переменные (State Object)

```typescript
interface AppState {
  currentTestId: number | null;        // ID текущего теста (31-35)
  currentQuestionIndex: number;        // Текущий вопрос (0-based)
  userAnswers: UserAnswersCache;       // Кэш выбранных ответов
  startTime: number | null;            // Timestamp начала теста (Date.now())
}

interface UserAnswersCache {
  [key: string]: number[];             // "testId-questionIndex" → [1, 3, 5]
}
```

### Инициализация состояния
```javascript
// При начале теста
currentTestId = 31;
currentQuestionIndex = 0;
userAnswers = {};  // очистить
startTime = Date.now();

// При переходе к новому вопросу
currentQuestionIndex = 1;  // не менять currentTestId!

// При выборе ответа
userAnswers["31-0"] = [1, 3];  // сохранить выбор
```

---

## 📊 Структура данных

### TestData Object

```typescript
interface TestData {
  tests_metadata: TestMetadata[];
  questions: Question[];
}

interface TestMetadata {
  test_id: number;              // 31, 32, 33, 34, 35
  test_name: string;            // "Итоговый повтор 3.1"
  topics: string;               // "Темы 3.1–3.4"
  questions_count: number;      // 15
}

interface Question {
  test_id: number;              // 31, 32, ...
  question_id: number;          // 1, 2, 3, ... (в пределах теста)
  question_text: string;        // "Выберите верные суждения..."
  options: string;              // JSON-string: "[\"Опция 1\", \"Опция 2\", ...]"
  correct_answers: string;      // JSON-string: "[1, 3, 5]" (1-based!)
}
```

### Пример `testData`

```javascript
const testData = {
  tests_metadata: [
    {
      test_id: 31,
      test_name: "Итоговый повтор 3.1",
      topics: "Темы 3.1–3.4",
      questions_count: 15
    },
    // ... еще 4 теста
  ],
  questions: [
    {
      test_id: 31,
      question_id: 1,
      question_text: "Выберите верные суждения о социальной дифференциации...",
      options: "[\"Вариант A\", \"Вариант B\", \"Вариант C\", \"Вариант D\", \"Вариант E\"]",
      correct_answers: "[1, 3]"
    },
    // ... много вопросов
  ]
};
```

### Формат ответов (правила нумерации)

```javascript
// Опции нумеруются с 1 (не с 0!)
options = ["Вариант 1", "Вариант 2", "Вариант 3"];
//          ↑ индекс 1    ↑ индекс 2    ↑ индекс 3

// В correct_answers используется та же нумерация
correct_answers = "[1, 3]";  // ✓ Правильно
correct_answers = "[0, 2]";  // ✗ Неправильно!

// В userAnswers тоже 1-based
userAnswers["31-0"] = [1, 3];  // ✓ Правильно
```

---

## 🎬 API функций

### 1. showScreen(id: string)

**Тип:** `function(id: string): void`

**Назначение:** Переключить видимый экран (скрыть остальные)

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|---------|
| `id` | string | ID экрана: "screen-select", "screen-test", "screen-results" |

**Возвращает:** void

**Пример:**
```javascript
showScreen('screen-select');   // Показать выбор тестов
showScreen('screen-test');     // Показать тест
showScreen('screen-results');  // Показать результаты
```

**Внутренняя реализация:**
```javascript
function showScreen(id) {
  // 1. Скрыть все экраны
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  
  // 2. Показать нужный
  document.getElementById(id).classList.add('active');
}
```

**CSS связь:**
```css
.screen {
  display: none;  /* по умолчанию скрыто */
}

.screen.active {
  display: block;  /* показать только активный */
}
```

---

### 2. renderTestSelection()

**Тип:** `function(): void`

**Назначение:** Отрисовать список всех тестов (ЭКРАН 1)

**Побочные эффекты:**
- Очищает `#tests-grid`
- Создаёт кнопки для каждого теста
- Показывает ЭКРАН 1 (вызывает `showScreen()`)

**Пример использования:**
```javascript
// При загрузке приложения
renderTestSelection();

// При возврате с результатов
backBtn.onclick = () => renderTestSelection();
```

**Алгоритм:**
```javascript
function renderTestSelection() {
  const grid = document.getElementById('tests-grid');
  grid.innerHTML = '';  // очистить
  
  // Для каждого теста
  testData.tests_metadata.forEach(test => {
    // Создать кнопку
    const btn = document.createElement('button');
    btn.className = 'test-btn';
    btn.innerHTML = `
      <div class="test-name">Тест ${test.test_id}: ${test.test_name}</div>
      <div class="test-info">${test.questions_count} вопросов • ${test.topics}</div>
    `;
    
    // Обработчик нажатия
    btn.onclick = () => startTest(test.test_id);
    
    // Добавить в сетку
    grid.appendChild(btn);
  });
  
  // Показать экран
  showScreen('screen-select');
}
```

**Генерируемый HTML:**
```html
<div class="tests-grid" id="tests-grid">
  <button class="test-btn">
    <div class="test-name">Тест 31: Итоговый повтор 3.1</div>
    <div class="test-info">15 вопросов • Темы 3.1–3.4</div>
  </button>
  <!-- ... еще 4 кнопки -->
</div>
```

---

### 3. startTest(testId: number)

**Тип:** `function(testId: number): void`

**Назначение:** Начать прохождение теста

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|---------|
| `testId` | number | ID теста (31-35) |

**Побочные эффекты:**
- Устанавливает `currentTestId = testId`
- Сбрасывает `currentQuestionIndex = 0`
- Очищает `userAnswers = {}`
- Сохраняет `startTime = Date.now()`
- Переходит на ЭКРАН 2

**Пример:**
```javascript
// В обработчике кнопки теста
btn.onclick = () => startTest(31);

// Или явно
startTest(33);
```

**Реализация:**
```javascript
function startTest(testId) {
  currentTestId = testId;
  currentQuestionIndex = 0;
  userAnswers = {};  // новый тест = чистые ответы
  startTime = Date.now();
  showScreen('screen-test');
  renderQuestion();
}
```

---

### 4. getTestQuestions(testId: number): Question[]

**Тип:** `function(testId: number): Question[]`

**Назначение:** Получить все вопросы конкретного теста

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|---------|
| `testId` | number | ID теста (31-35) |

**Возвращает:** Массив объектов `Question`

**Пример:**
```javascript
const questions = getTestQuestions(31);
console.log(questions.length);  // 15
console.log(questions[0]);      // { test_id: 31, question_id: 1, ... }
```

**Реализация:**
```javascript
function getTestQuestions(testId) {
  return testData.questions.filter(q => q.test_id === testId);
}
```

---

### 5. renderQuestion()

**Тип:** `function(): void`

**Назначение:** Отрисовать текущий вопрос (ЭКРАН 2)

**Зависит от:**
- `currentTestId` - ID теста
- `currentQuestionIndex` - текущий вопрос

**Побочные эффекты:**
- Обновляет progress bar
- Отрисовывает вопрос и опции
- Обновляет кнопки (prev/next/finish)
- Восстанавливает выбранные ответы из кэша

**Пример:**
```javascript
// При переходе к следующему вопросу
currentQuestionIndex++;
renderQuestion();

// При возврате к предыдущему
currentQuestionIndex--;
renderQuestion();
```

**Алгоритм:**
```javascript
function renderQuestion() {
  // Получить вопросы теста
  const questions = getTestQuestions(currentTestId);
  const q = questions[currentQuestionIndex];
  
  // 1. Progress bar
  const percent = Math.round((currentQuestionIndex + 1) / questions.length * 100);
  document.getElementById('progress-fill').style.width = percent + '%';
  document.getElementById('progress-text').textContent = 
    `Вопрос ${currentQuestionIndex + 1} из ${questions.length}`;
  
  // 2. Текст вопроса
  document.getElementById('question-text').textContent = q.question_text;
  
  // 3. Опции
  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = '';
  
  const options = JSON.parse(q.options);
  options.forEach((option, idx) => {
    // Проверить, был ли этот ответ выбран ранее
    const key = `${currentTestId}-${currentQuestionIndex}`;
    const checked = userAnswers[key]?.includes(idx + 1) || false;
    
    // Создать checkbox
    const label = document.createElement('label');
    label.className = 'option-label' + (checked ? ' checked' : '');
    label.innerHTML = `
      <input type="checkbox" class="option-checkbox" ${checked ? 'checked' : ''}>
      <span class="option-text">${option}</span>
    `;
    
    // Обработчик выбора
    label.querySelector('input').onchange = (e) => {
      const key = `${currentTestId}-${currentQuestionIndex}`;
      if (!userAnswers[key]) userAnswers[key] = [];
      
      if (e.target.checked) {
        // Добавить индекс (1-based!)
        if (!userAnswers[key].includes(idx + 1)) {
          userAnswers[key].push(idx + 1);
        }
        label.classList.add('checked');
      } else {
        // Удалить индекс
        userAnswers[key] = userAnswers[key].filter(n => n !== idx + 1);
        label.classList.remove('checked');
      }
    };
    
    optionsContainer.appendChild(label);
  });
  
  // 4. Обновить кнопки
  document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;
  document.getElementById('next-btn').style.display = 
    currentQuestionIndex < questions.length - 1 ? 'block' : 'none';
  document.getElementById('finish-btn').style.display = 
    currentQuestionIndex === questions.length - 1 ? 'block' : 'none';
}
```

---

### 6. initializeApp()

**Тип:** `function(): void`

**Назначение:** Инициализировать приложение (вызывается при загрузке)

**Побочные эффекты:**
- Находит все кнопки в DOM
- Регистрирует обработчики событий
- Показывает ЭКРАН 1

**Вызов:**
```javascript
// Автоматически при загрузке
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
```

**Реализация:**
```javascript
function initializeApp() {
  try {
    // Получить элементы
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const finishBtn = document.getElementById('finish-btn');
    const backBtn = document.getElementById('back-btn');

    // Проверка
    if (!prevBtn || !nextBtn || !finishBtn || !backBtn) {
      console.error('DOM elements not found');
      return;
    }

    // Обработчики
    prevBtn.onclick = () => {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
      }
    };

    nextBtn.onclick = () => {
      const questions = getTestQuestions(currentTestId);
      if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
      }
    };

    finishBtn.onclick = () => {
      // Расчет результатов
      const questions = getTestQuestions(currentTestId);
      let correctCount = 0;
      
      questions.forEach((q, idx) => {
        const userAnswer = (userAnswers[`${currentTestId}-${idx}`] || [])
          .sort((a, b) => a - b);
        const correctAnswer = JSON.parse(q.correct_answers)
          .sort((a, b) => a - b);
        
        if (JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)) {
          correctCount++;
        }
      });

      // Показать результаты
      const percent = Math.round(correctCount / questions.length * 100);
      const time = Math.round((Date.now() - startTime) / 60000);
      
      let msg = '';
      if (percent === 100) msg = '👏 Отличный результат!\nВы ответили на все вопросы!';
      else if (percent >= 80) msg = '😊 Хороший результат!\nПродолжайте так!';
      else if (percent >= 60) msg = '👍 Неплохо!\nПовторите материал!';
      else msg = '💪 Не сдавайтесь!\nПробуйте снова!';

      document.getElementById('score-circle').textContent = percent + '%';
      document.getElementById('result-message').textContent = msg;
      document.getElementById('correct-count').textContent = `${correctCount} / ${questions.length}`;
      document.getElementById('percentage').textContent = percent + '%';
      document.getElementById('time-spent').textContent = time + ' мин';

      showScreen('screen-results');
    };

    backBtn.onclick = () => {
      renderTestSelection();
    };

    renderTestSelection();
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}
```

---

## ⚡ Event Handlers

### Кнопка "Назад" (ЭКРАН 2)

```javascript
prevBtn.onclick = () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();  // перерисовать
  }
};
```

**Условие:** Активна только если `currentQuestionIndex > 0`

---

### Кнопка "Дальше" (ЭКРАН 2)

```javascript
nextBtn.onclick = () => {
  const questions = getTestQuestions(currentTestId);
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  }
};
```

**Условие:** Показана только если это не последний вопрос

---

### Кнопка "Завершить" (ЭКРАН 2)

```javascript
finishBtn.onclick = () => {
  // Расчеты...
  showScreen('screen-results');
};
```

**Условие:** Показана только на последнем вопросе

---

### Кнопка "Вернуться" (ЭКРАН 3)

```javascript
backBtn.onclick = () => {
  renderTestSelection();  // Вернуться на выбор тестов
};
```

---

### Checkbox выбора ответа

```javascript
label.querySelector('input').onchange = (e) => {
  const key = `${currentTestId}-${currentQuestionIndex}`;
  
  if (!userAnswers[key]) {
    userAnswers[key] = [];
  }
  
  if (e.target.checked) {
    // Добавить (если ещё не добавлен)
    if (!userAnswers[key].includes(idx + 1)) {
      userAnswers[key].push(idx + 1);
    }
    label.classList.add('checked');  // CSS стиль
  } else {
    // Удалить
    userAnswers[key] = userAnswers[key].filter(n => n !== idx + 1);
    label.classList.remove('checked');
  }
};
```

---

## 📐 Расчёты

### Процент прогресса

```javascript
const percent = Math.round((currentQuestionIndex + 1) / questions.length * 100);
// Пример: вопрос 5 из 15 → (5 + 1) / 15 * 100 = 40%
```

### Процент правильных ответов

```javascript
let correctCount = 0;
questions.forEach((q, idx) => {
  const userAnswer = (userAnswers[`${currentTestId}-${idx}`] || [])
    .sort((a, b) => a - b);
  const correctAnswer = JSON.parse(q.correct_answers)
    .sort((a, b) => a - b);
  
  // Сравнение как JSON-строк
  if (JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)) {
    correctCount++;
  }
});

const resultPercent = Math.round(correctCount / questions.length * 100);
```

**Важно:** Массивы сортируются перед сравнением!

### Время прохождения

```javascript
const timeInMs = Date.now() - startTime;
const timeInMinutes = Math.round(timeInMs / 60000);
// Пример: 600000 мс = 10 минут
```

---

## 🐛 Отладка

### Логирование состояния
```javascript
console.log('Current Test:', currentTestId);
console.log('Current Question:', currentQuestionIndex);
console.log('User Answers:', userAnswers);
console.log('Questions:', getTestQuestions(currentTestId));
```

### Проверка данных
```javascript
// Проверить, загружены ли данные
console.log('Tests loaded:', testData.tests_metadata.length);  // должно быть 5
console.log('Questions loaded:', testData.questions.length);    // должно быть 75

// Проверить, правильный ли формат ответов
const testQuestion = testData.questions[0];
console.log('Options:', JSON.parse(testQuestion.options));
console.log('Correct:', JSON.parse(testQuestion.correct_answers));
```

### DevTools контрольный список
- [ ] Все 5 тестов загружены (`renderTestSelection()`)
- [ ] Вопросы загружаются при клике на тест
- [ ] Progress bar обновляется
- [ ] Checkboxes сохраняют состояние
- [ ] Prev/Next/Finish кнопки работают
- [ ] Результаты рассчитываются правильно

---

## 💾 Сохранение прогресса (расширение)

### Локальное сохранение (localStorage)
```javascript
// Сохранить состояние
function saveProgress() {
  localStorage.setItem('testProgress', JSON.stringify({
    currentTestId,
    currentQuestionIndex,
    userAnswers,
    startTime
  }));
}

// Восстановить состояние
function loadProgress() {
  const saved = localStorage.getItem('testProgress');
  if (saved) {
    const state = JSON.parse(saved);
    currentTestId = state.currentTestId;
    currentQuestionIndex = state.currentQuestionIndex;
    userAnswers = state.userAnswers;
    startTime = state.startTime;
  }
}
```

### Вызов сохранения
```javascript
// При изменении ответа
label.querySelector('input').onchange = (e) => {
  // ... обновить userAnswers ...
  saveProgress();  // новая строка
};
```

---

## 📝 Версионирование

**Текущая версия:** 1.0.0  
**API Версия:** 1.0  
**Последнее обновление:** 2026-06-04

### Обратная совместимость
- ✅ Формат `testData` стабилен
- ✅ Функции не меняют сигнатуры
- ✅ CSS классы зарезервированы

---

**Конец API справочника**

