#!/bin/bash
# Полностью автоматическое развертывание Тест #1 для Linux/Mac/Windows (Git Bash)

set -e

echo ""
echo "================================================================================"
echo "🚀 ПОЛНОСТЬЮ АВТОМАТИЧЕСКОЕ РАЗВЕРТЫВАНИЕ ТЕСТ #1"
echo "================================================================================"
echo ""

SPREADSHEET_ID="19BlhyKO3Wazo2b8ZxrqXpJKPm728CNrv9QBxURwKOKw"
SCRIPT_PATH="src/gas/Код.gs"

# Проверяем Python
echo "[1/5] Проверка требуемых инструментов..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не найден"
    echo "   Установите Python с https://www.python.org/"
    exit 1
fi

echo "✅ Python3 установлен: $(python3 --version)"

# Проверяем наличие Google Apps Script файла
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Файл $SCRIPT_PATH не найден"
    exit 1
fi

echo "✅ Google Apps Script файл найден"
echo ""

# Пытаемся использовать clasp (если доступна)
echo "[2/5] Проверка clasp..."
if command -v clasp &> /dev/null; then
    echo "✅ clasp найдена"

    echo ""
    echo "[3/5] Отправка кода в Google Apps Script..."
    if clasp push --force; then
        echo "✅ Код отправлен"

        echo ""
        echo "[4/5] Развертывание приложения..."
        if clasp deploy --description "Развертывание Тест #1"; then
            echo "✅ Развертывание создано"

            echo ""
            echo "[5/5] Выполнение функции добавления теста..."
            # Открываем Google Sheet
            python3 -m webbrowser "https://docs.google.com/spreadsheets/d/$SPREADSHEET_ID/"

            echo ""
            echo "✅ ГОТОВО!"
            echo ""
            echo "В Google Sheet:"
            echo "  1. Обновите страницу (F5)"
            echo "  2. Нажмите меню: 🧪 Тесты"
            echo "  3. Нажмите: ➕ Добавить ТЕСТ #1 (26 вопросов)"
            echo ""
            exit 0
        fi
    fi

    echo "⚠️  clasp push/deploy не сработала"
    echo ""
fi

# Фолбек: Использовать Python скрипт
echo "[3/5] Попытка автоматического развертывания через Python..."
echo ""

python3 setup_and_deploy.py
RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "✅ ГОТОВО!"
    exit 0
fi

echo ""
echo "⚠️  Автоматическое развертывание не сработало"
echo ""
echo "Используйте ручное развертывание:"
echo "  1. Откройте: https://docs.google.com/spreadsheets/d/$SPREADSHEET_ID/"
echo "  2. Нажмите: Расширения → Apps Script"
echo "  3. Замените код на содержимое файла $SCRIPT_PATH"
echo "  4. Нажмите: Развернуть → Создать развёртывание"
echo "  5. В Google Sheet нажмите: 🧪 Тесты → ➕ Добавить ТЕСТ #1"
echo ""

exit 1
