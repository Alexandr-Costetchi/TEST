# 🧪 Руководство по синхронизации тестов

## 📋 Обзор

Этот проект использует двойную синхронизацию тестов:

```
┌─────────────────────────┐
│  Local Repository       │
│  (D:\ПРОБА GIT+CLAUDE)  │
└────────┬────────────────┘
         │
         ├──→ TEST Repository
         │    https://github.com/Alexandr-Costetchi/TEST
         │
         └──→ my-website Repository
              https://github.com/Alexandr-Costetchi/my-website
              (tests/ directory)
```

## 🚀 Быстрый старт

### 1. Настройка git remotes (первый раз)

**Windows:**
```bash
setup_git_remotes.bat
```

**Linux/Mac:**
```bash
bash setup_git_remotes.sh
```

**Или вручную:**
```bash
git remote add origin https://github.com/Alexandr-Costetchi/TEST.git
git remote add website https://github.com/Alexandr-Costetchi/my-website.git
```

### 2. Проверить remotes

```bash
git remote -v
```

**Ожидаемый результат:**
```
origin   https://github.com/Alexandr-Costetchi/TEST.git (fetch)
origin   https://github.com/Alexandr-Costetchi/TEST.git (push)
website  https://github.com/Alexandr-Costetchi/my-website.git (fetch)
website  https://github.com/Alexandr-Costetchi/my-website.git (push)
```

### 3. Синхронизировать тесты

```bash
# Отправить в TEST repo
git push origin master

# Синхронизировать с website repo (см. ниже)
python sync_tests.py
```

## 📊 Структура репозитория

```
D:\ПРОБА GIT+CLAUDE/
├── tests/                          # Основная папка с тестами
│   ├── exported/                   # JSON файлы для импорта
│   │   └── tests_31_35_sociologiya.json
│   ├── archived/                   # Архивированные версии
│   ├── meta/                       # Метаинформация
│   │   ├── tests_inventory.json    # Инвентарь всех тестов
│   │   └── tests_list_website.json # Для вебсайта (генерируется)
│   └── README.md
├── src/
│   └── gas/
│       └── Код.gs                 # Google Apps Script (функции импорта)
├── sync_tests.py                  # Скрипт синхронизации
├── setup_git_remotes.sh           # Скрипт настройки (Linux/Mac)
├── setup_git_remotes.bat          # Скрипт настройки (Windows)
└── TESTS_SYNC_GUIDE.md           # Этот файл
```

## 🔄 Полный процесс синхронизации

### Сценарий 1: Добавление нового теста

```bash
# 1. Создать HTML файл с тестом (с QUESTIONS массивом)
# Пример: test_36.html

# 2. Экспортировать тест в JSON
python add_tests_to_sheet.py
# Результат: tests/exported/tests_36_sociologiya.json

# 3. Обновить инвентарь в tests/meta/tests_inventory.json
# Добавить новый тест в массив "tests"

# 4. Коммитить изменения
git add tests/
git add src/gas/Код.gs
git commit -m "[TESTS] Добавлен тест 36"

# 5. Отправить в TEST repo
git push origin master

# 6. Синхронизировать с my-website
python sync_tests.py
```

### Сценарий 2: Обновление существующего теста

```bash
# 1. Обновить HTML файл теста

# 2. Переэкспортировать тест
python add_tests_to_sheet.py

# 3. Обновить timestamp в tests/meta/tests_inventory.json

# 4. Коммитить
git add tests/
git commit -m "[TESTS] Обновлен тест 31"

# 5. Отправить в TEST repo
git push origin master

# 6. Синхронизировать с my-website
python sync_tests.py
```

### Сценарий 3: Синхронизация с my-website

```bash
# Опция 1: Использовать скрипт (автоматически)
python sync_tests.py

# Опция 2: Вручную клонировать тесты в my-website
cd /path/to/my-website
cp -r /path/to/TEST/tests ./tests

# Коммитить в my-website
git add tests/
git commit -m "[SYNC] Синхронизированы тесты из TEST repo"
git push origin master
```

## 📝 Git команды для синхронизации

### Основные команды

```bash
# Показать статус файлов
git status

# Добавить все изменения в тестах
git add tests/

# Добавить изменения в Google Apps Script
git add src/gas/Код.gs

# Коммитить с информативным сообщением
git commit -m "[TESTS] Добавлены тесты 31-35 (75 вопросов)"

# Отправить в TEST repo
git push origin master

# Отправить в my-website repo (если настроены правильно)
git push website master
```

### Работа с remotes

```bash
# Список всех remotes
git remote -v

# Добавить новый remote
git remote add <name> <url>

# Удалить remote
git remote remove <name>

# Изменить URL remote
git remote set-url <name> <new-url>

# Получить изменения с remote
git fetch origin

# Слить изменения
git merge origin/master
```

## 🔐 Безопасность и .gitignore

### Файлы, которые НЕ должны быть в git

```
client_secret*.json          # OAuth токены
*.pem, *.key                # Приватные ключи
.env, .env.local            # Конфигурация с секретами
credentials.json            # Учетные данные
```

### Файлы, которые ДОЛЖНЫ быть в git

```
tests/exported/*.json       # JSON файлы с вопросами
tests/meta/*.json          # Метаинформация
src/gas/Код.gs            # Google Apps Script
README.md, *.md            # Документация
*.py                       # Python скрипты (без секретов)
```

## 📦 Структура JSON файлов

### tests/exported/tests_31_35_sociologiya.json

```json
{
  "tests_metadata": [
    {
      "test_id": 31,
      "test_name": "Итоговый повтор 3.1",
      "topics": "Темы 3.1–3.4: ...",
      "questions_count": 15,
      "subject": "Обществознание ЕГЭ",
      "format": "EGE Task 20",
      "created_date": "2026-05-22",
      "status": "ready"
    }
  ],
  "questions": [
    {
      "test_id": 31,
      "question_id": 1,
      "question_text": "...",
      "options": "[\"вар1\", \"вар2\", ...]",
      "correct_answers": "[1, 3]",
      "timestamp": "2026-05-22T12:47:58.776519"
    }
  ]
}
```

### tests/meta/tests_inventory.json

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-05-22T12:47:58Z",
  "totalTests": 6,
  "totalQuestions": 106,
  "tests": [
    {
      "testId": 31,
      "testName": "Итоговый повтор 3.1",
      "questionsCount": 15,
      "status": "ready",
      "url": "test=31"
    }
  ]
}
```

## 🐛 Решение проблем

### Проблема: "fatal: remote origin already exists"

**Решение:**
```bash
git remote remove origin
git remote add origin https://github.com/Alexandr-Costetchi/TEST.git
```

### Проблема: "permission denied" при push

**Решение:**
1. Проверить SSH ключи: `ssh -T git@github.com`
2. Настроить HTTPS вместо SSH:
```bash
git remote set-url origin https://github.com/Alexandr-Costetchi/TEST.git
```
3. Убедиться, что у вас есть доступ к репозиторию

### Проблема: Конфликты при слиянии

**Решение:**
```bash
git pull origin master --rebase
# Разрешить конфликты
git add .
git rebase --continue
```

## 📞 Полезные ссылки

- **TEST Repo**: https://github.com/Alexandr-Costetchi/TEST
- **Website Repo**: https://github.com/Alexandr-Costetchi/my-website
- **Google Sheet**: https://docs.google.com/spreadsheets/d/19BlhyKO3Wazo2b8ZxrqXpJKPm728CNrv9QBxURwKOKw
- **Вебсайт**: https://verny-kurs.ru

## 📋 Чек-лист для добавления теста

- [ ] Создан HTML файл с тестом
- [ ] QUESTIONS массив валиден
- [ ] Экспортирован в JSON
- [ ] Обновлен tests/meta/tests_inventory.json
- [ ] Добавлены в git: `git add tests/`
- [ ] Создан коммит: `git commit -m "..."`
- [ ] Отправлено в TEST: `git push origin master`
- [ ] Синхронизировано: `python sync_tests.py`
- [ ] Проверено на вебсайте

## 🎯 Следующие шаги

1. ✅ Настроить git remotes
2. ✅ Отправить текущие тесты (31-35)
3. ⏳ Синхронизировать с my-website
4. ⏳ Создать CI/CD для автоматической синхронизации
5. ⏳ Добавить GitHub Actions для валидации тестов

---

**Версия**: 1.0.0  
**Последнее обновление**: 2026-05-22  
**Автор**: Alexandr-Costetchi
