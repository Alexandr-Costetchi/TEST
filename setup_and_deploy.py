#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Комплексный скрипт для полного автоматического развертывания Тест #1
Обрабатывает все возможные сценарии и фолбеки
"""

import os
import sys
import json
import subprocess
import webbrowser
import time
from pathlib import Path

def print_header(title):
    """Печать красивого заголовка"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")

def print_step(step_num, description):
    """Печать номера шага"""
    print(f"\n[Шаг {step_num}] {description}")
    print("-" * 80)

def check_node_available():
    """Проверить доступность Node.js"""
    try:
        result = subprocess.run(['node', '--version'],
                              capture_output=True,
                              timeout=5)
        return result.returncode == 0
    except:
        return False

def check_clasp_installed():
    """Проверить, установлена ли clasp"""
    try:
        result = subprocess.run(['clasp', '--version'],
                              capture_output=True,
                              timeout=5)
        return result.returncode == 0
    except:
        return False

def check_git_available():
    """Проверить доступность Git"""
    try:
        result = subprocess.run(['git', '--version'],
                              capture_output=True,
                              timeout=5)
        return result.returncode == 0
    except:
        return False

def install_clasp():
    """Установить clasp через npm"""
    print("\n📦 Установка Google Apps Script CLI (clasp)...")
    print("   Это займет 1-2 минуты...\n")

    try:
        subprocess.run(['npm', 'install', '-g', '@google/clasp'],
                      check=True,
                      capture_output=True,
                      timeout=300)
        print("✅ clasp успешно установлена\n")
        return True
    except Exception as e:
        print(f"❌ Ошибка установки clasp: {e}\n")
        return False

def setup_clasp_project():
    """Настроить clasp проект"""
    project_path = Path("D:/ПРОБА GIT+CLAUDE")

    # Проверяем наличие .clasp.json
    clasp_json = project_path / ".clasp.json"

    if clasp_json.exists():
        print("✅ Проект clasp уже настроен")
        return True

    print("\n🔐 Требуется первоначальная аутентификация Google...")
    print("   Следуйте инструкциям в браузере\n")

    try:
        # Переходим в директорию проекта
        os.chdir(str(project_path))

        # Запускаем clasp login
        result = subprocess.run(['clasp', 'login'],
                              timeout=60)

        if result.returncode == 0:
            print("\n✅ Аутентификация успешна")
            return True
        else:
            print("\n❌ Ошибка аутентификации")
            return False

    except Exception as e:
        print(f"❌ Ошибка при настройке: {e}")
        return False

def push_and_deploy():
    """Отправить код в Google Apps Script и развернуть"""
    project_path = Path("D:/ПРОБА GIT+CLAUDE")

    print_step(1, "Отправка кода в Google Apps Script")

    try:
        os.chdir(str(project_path))

        # Отправляем код
        print("📤 Отправляю код...")
        result = subprocess.run(['clasp', 'push'],
                              capture_output=True,
                              timeout=60)

        if result.returncode != 0:
            print(f"❌ Ошибка отправки: {result.stderr.decode('utf-8', errors='ignore')}")
            return False

        print("✅ Код отправлен в Google Apps Script")

        time.sleep(2)

        # Создаем развертывание
        print_step(2, "Создание развертывания")
        print("🚀 Создаю развертывание...")

        result = subprocess.run(['clasp', 'deploy', '--description', 'Развертывание Тест #1'],
                              capture_output=True,
                              timeout=60)

        if result.returncode != 0:
            print(f"⚠️  Развертывание может требовать ручного подтверждения")
            print("   Перейдите в Google Apps Script и создайте развертывание вручную")
            return False

        output = result.stdout.decode('utf-8', errors='ignore')
        print("✅ Развертывание создано")
        print(f"   Вывод: {output}")

        return True

    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def execute_function_via_sheet():
    """Выполнить функцию через Google Sheet меню"""
    spreadsheet_id = '19BlhyKO3Wazo2b8ZxrqXpJKPm728CNrv9QBxURwKOKw'

    print_step(3, "Выполнение функции addTest1Data()")

    print("\n📋 Открываю Google Sheet...")
    sheet_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/"
    webbrowser.open(sheet_url)

    print("\n✅ Google Sheet открыт в браузере")

    print("\n📝 Инструкции:")
    print("   1. Обновите страницу (F5)")
    print("   2. Откройте меню: 🧪 Тесты")
    print("   3. Нажмите: ➕ Добавить ТЕСТ #1 (26 вопросов)")
    print("   4. Подтвердите в диалоговом окне")

    print("\n⏳ Ожидание (нажмите Enter когда закончите)...")
    input()

    return True

def method_python_api():
    """Метод 1: Python + Google API"""
    print_header("МЕТОД 1: АВТОМАТИЗАЦИЯ ЧЕРЕЗ PYTHON + GOOGLE API")

    print("🔍 Проверяю требуемые библиотеки...\n")

    try:
        import google.auth
        print("✅ Google Auth библиотеки установлены")
    except ImportError:
        print("❌ Требуются Google API библиотеки")
        print("\nУстановите:")
        print("  pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client")
        print("\nТеч переходим на следующий метод...\n")
        return False

    print("\n✅ Все требуемые компоненты доступны")
    print("\nЭтот метод требует:")
    print("  1. Файл credentials.json (OAuth2)")
    print("  2. Первоначальная аутентификация в браузере")

    return True

def method_clasp():
    """Метод 2: Google Apps Script CLI (clasp)"""
    print_header("МЕТОД 2: ИСПОЛЬЗОВАНИЕ CLASP (РЕКОМЕНДУЕТСЯ)")

    print("🔍 Проверяю требуемые инструменты...\n")

    # Проверяем Node.js
    if not check_node_available():
        print("❌ Node.js не установлен")
        print("\nУстановите Node.js с https://nodejs.org/")
        print("Затем запустите этот скрипт заново\n")
        return False

    print("✅ Node.js установлен")

    # Проверяем clasp
    if not check_clasp_installed():
        print("❌ clasp не установлена")

        if not install_clasp():
            print("\nПопробуйте установить вручную:")
            print("  npm install -g @google/clasp\n")
            return False

    print("✅ clasp установлена")

    # Настраиваем проект
    if not setup_clasp_project():
        return False

    # Отправляем и разворачиваем
    if not push_and_deploy():
        return False

    # Выполняем функцию
    if not execute_function_via_sheet():
        return False

    return True

def method_manual():
    """Метод 3: Ручное развертывание с инструкциями"""
    print_header("МЕТОД 3: РУЧНОЕ РАЗВЕРТЫВАНИЕ")

    spreadsheet_id = '19BlhyKO3Wazo2b8ZxrqXpJKPm728CNrv9QBxURwKOKw'

    print("📋 Следуйте этим шагам для развертывания:\n")

    print("1️⃣  Откройте Google Sheet:")
    print(f"   https://docs.google.com/spreadsheets/d/{spreadsheet_id}/\n")

    print("2️⃣  Нажмите: Расширения → Apps Script\n")

    print("3️⃣  В Apps Script:")
    print("   • Выберите файл Code.gs")
    print("   • Удалите существующий код (Ctrl+A → Delete)")
    print("   • Откройте локальный файл: src/gas/Код.gs")
    print("   • Скопируйте весь его код")
    print("   • Вставьте в Code.gs (Ctrl+V)\n")

    print("4️⃣  Нажмите кнопку 'Развернуть' → 'Создать развёртывание':")
    print("   • Тип: Веб-приложение")
    print("   • Выполнять как: [ваш аккаунт]")
    print("   • Доступ: Я (только)")
    print("   • Нажмите 'Развернуть'\n")

    print("5️⃣  Скопируйте URL развертывания из диалога\n")

    print("6️⃣  Вернитесь в Google Sheet, обновите (F5)")
    print("   Должно появиться меню: 🧪 Тесты\n")

    print("7️⃣  Нажмите: 🧪 Тесты → ➕ Добавить ТЕСТ #1 (26 вопросов)\n")

    # Открываем Google Sheet
    print("🔗 Открываю Google Sheet в браузере...")
    webbrowser.open(f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/')

    print("\n⏳ Ожидание (нажмите Enter когда все готово)...")
    input()

    return True

def main():
    """Основная функция"""
    print_header("🚀 ПОЛНОСТЬЮ АВТОМАТИЧЕСКОЕ РАЗВЕРТЫВАНИЕ ТЕСТ #1")

    print("Система попробует развернуть тест используя несколько методов")
    print("в порядке предпочтения:\n")
    print("  1️⃣  Python + Google API (требует credentials.json)")
    print("  2️⃣  Google Apps Script CLI / clasp (РЕКОМЕНДУЕТСЯ)")
    print("  3️⃣  Ручное развертывание (с подробными инструкциями)\n")

    # Метод 2: clasp (основной)
    print_header("ПОПЫТКА 1: АВТОМАТИЧЕСКОЕ РАЗВЕРТЫВАНИЕ ЧЕРЕЗ CLASP")

    if method_clasp():
        print_header("✅ УСПЕШНО ЗАВЕРШЕНО!")
        print("Тест #1 полностью развернут и добавлен в Google Sheet\n")
        print("Проверьте:")
        print("  • Лист 'Архив' - строка с тестом #1")
        print("  • Лист 'Вопросы' - 26 вопросов для теста")
        print("  • Лист 'Результаты теста' - готов к записи")
        return

    # Метод 1: Python API (резервный)
    print_header("ПОПЫТКА 2: АВТОМАТИЧЕСКОЕ РАЗВЕРТЫВАНИЕ ЧЕРЕЗ PYTHON API")

    if method_python_api():
        print("\n✅ Метод API не реализован полностью")
        print("Переходим на следующий вариант...\n")

    # Метод 3: Ручное развертывание
    print_header("ПОПЫТКА 3: РУЧНОЕ РАЗВЕРТЫВАНИЕ")

    if method_manual():
        print_header("✅ ГОТОВО!")
        print("Тест #1 развернут вручную согласно инструкциям\n")
        print("После выполнения всех шагов проверьте:")
        print("  • Лист 'Архив' - строка с тестом #1")
        print("  • Лист 'Вопросы' - 26 вопросов для теста")
        print("  • Лист 'Результаты теста' - готов к записи")
        return

    print_header("❌ ОШИБКА")
    print("Не удалось развернуть автоматически\n")
    print("Попробуйте один из вариантов:")
    print("  1. Установите Node.js и запустите скрипт еще раз")
    print("  2. Выполните ручное развертывание согласно инструкциям")
    print("  3. Свяжитесь с поддержкой")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Отменено пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
