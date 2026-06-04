@echo off
REM Запуск локального веб-сервера для тестирования

echo.
echo ================================================
echo   Запуск веб-сервера для мобильных тестов
echo ================================================
echo.

REM Переходим в папку с тестами
cd /d "%~dp0"

REM Запускаем Python HTTP сервер
echo Запуск сервера на порту 8000...
echo.
echo Откройте браузер и перейдите на:
echo http://localhost:8000/mobile-test-player.html
echo.
echo Для остановки сервера нажмите Ctrl+C
echo.

python -m http.server 8000

REM Если Python не установлен, пробуем python3
if %errorlevel% neq 0 (
    python3 -m http.server 8000
)

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Python не найден!
    echo Пожалуйста установите Python с python.org
    pause
)
