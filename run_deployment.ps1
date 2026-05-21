# Полностью автоматическое развертывание Тест #1 - PowerShell
# Запустите: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Затем:    .\run_deployment.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "🚀 ПОЛНОСТЬЮ АВТОМАТИЧЕСКОЕ РАЗВЕРТЫВАНИЕ ТЕСТ #1" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

$SPREADSHEET_ID = "19BlhyKO3Wazo2b8ZxrqXpJKPm728CNrv9QBxURwKOKw"
$SCRIPT_PATH = "src/gas/Код.gs"

try {
    # Проверяем Python
    Write-Host "[1/5] Проверка требуемых инструментов..." -ForegroundColor Green

    try {
        $pythonVersion = python --version 2>&1
        Write-Host "✅ Python найден: $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Python не найден" -ForegroundColor Red
        Write-Host "   Установите Python с https://www.python.org/" -ForegroundColor Yellow
        exit 1
    }

    # Проверяем наличие Google Apps Script файла
    if (-not (Test-Path $SCRIPT_PATH)) {
        Write-Host "❌ Файл $SCRIPT_PATH не найден" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Google Apps Script файл найден" -ForegroundColor Green
    Write-Host ""

    # Пытаемся использовать clasp (если доступна)
    Write-Host "[2/5] Проверка clasp..." -ForegroundColor Green

    try {
        $claspVersion = clasp --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ clasp найдена: $claspVersion" -ForegroundColor Green

            Write-Host ""
            Write-Host "[3/5] Отправка кода в Google Apps Script..." -ForegroundColor Green

            & clasp push --force
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Код отправлен" -ForegroundColor Green

                Write-Host ""
                Write-Host "[4/5] Развертывание приложения..." -ForegroundColor Green

                & clasp deploy --description "Развертывание Тест #1"
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Развертывание создано" -ForegroundColor Green

                    Write-Host ""
                    Write-Host "[5/5] Выполнение функции добавления теста..." -ForegroundColor Green

                    # Открываем Google Sheet
                    Start-Process "https://docs.google.com/spreadsheets/d/$SPREADSHEET_ID/"

                    Write-Host ""
                    Write-Host "✅ ГОТОВО!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "В Google Sheet:" -ForegroundColor Cyan
                    Write-Host "  1. Обновите страницу (F5)" -ForegroundColor White
                    Write-Host "  2. Нажмите меню: 🧪 Тесты" -ForegroundColor White
                    Write-Host "  3. Нажмите: ➕ Добавить ТЕСТ #1 (26 вопросов)" -ForegroundColor White
                    Write-Host ""
                    exit 0
                }
            }
        }
    } catch {
        Write-Host "⚠️  clasp не установлена или недоступна" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "[3/5] Попытка автоматического развертывания через Python..." -ForegroundColor Green
    Write-Host ""

    & python setup_and_deploy.py
    $RESULT = $LASTEXITCODE

    if ($RESULT -eq 0) {
        Write-Host ""
        Write-Host "✅ ГОТОВО!" -ForegroundColor Green
        exit 0
    }

    Write-Host ""
    Write-Host "⚠️  Автоматическое развертывание не сработало" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Используйте ручное развертывание:" -ForegroundColor Cyan
    Write-Host "  1. Откройте: https://docs.google.com/spreadsheets/d/$SPREADSHEET_ID/" -ForegroundColor White
    Write-Host "  2. Нажмите: Расширения → Apps Script" -ForegroundColor White
    Write-Host "  3. Замените код на содержимое файла $SCRIPT_PATH" -ForegroundColor White
    Write-Host "  4. Нажмите: Развернуть → Создать развёртывание" -ForegroundColor White
    Write-Host "  5. В Google Sheet нажмите: 🧪 Тесты → ➕ Добавить ТЕСТ #1" -ForegroundColor White
    Write-Host ""

    exit 1

} catch {
    Write-Host ""
    Write-Host "❌ ОШИБКА: $_" -ForegroundColor Red
    exit 1
}
