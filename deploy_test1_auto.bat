@echo off
REM Автоматическое развертывание Тест #1
REM Windows batch скрипт

setlocal enabledelayedexpansion
chcp 65001 > nul

echo.
echo ================================================================================
echo 🚀 ПОЛНОСТЬЮ АВТОМАТИЧЕСКОЕ РАЗВЕРТЫВАНИЕ ТЕСТ #1
echo ================================================================================
echo.

REM Проверяем Python
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python не найден!
    echo.
    echo Установите Python с https://www.python.org/
    echo И убедитесь, что добавили Python в PATH
    echo.
    pause
    exit /b 1
)

echo ✅ Python найден
echo.

REM Проверяем Google API библиотеки
python -c "import google.auth" > nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Google API библиотеки не установлены
    echo.
    echo Устанавливаю необходимые пакеты...
    echo (это займет 1-2 минуты)
    echo.

    pip install --upgrade google-auth-oauthlib google-auth-httplib2 google-api-python-client > nul 2>&1

    if %errorlevel% neq 0 (
        echo ❌ Ошибка при установке пакетов
        echo.
        echo Попробуйте вручную:
        echo   pip install --upgrade google-auth-oauthlib google-auth-httplib2 google-api-python-client
        echo.
        pause
        exit /b 1
    )

    echo ✅ Пакеты установлены
    echo.
)

REM Запускаем Python скрипт
echo 🔧 Запускаю развертывание...
echo.

python deploy_test1_automated.py

if %errorlevel% neq 0 (
    echo.
    echo ❌ Ошибка развертывания
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ ГОТОВО!
echo.
pause
