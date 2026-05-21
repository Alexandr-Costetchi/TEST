#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Полностью автоматическое развертывание Тест #1 в Google Apps Script
Запустите: python deploy_test1_automated.py
"""

import os
import sys
import json
import time
import webbrowser
from pathlib import Path

# Попытка импортировать Google API библиотеки
try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_LIBS_AVAILABLE = True
except ImportError:
    GOOGLE_LIBS_AVAILABLE = False
    print("⚠️  Google API библиотеки не установлены")
    print("   Установите: pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client")

# Конфигурация
SPREADSHEET_ID = '19BlhyKO3Wazo2b8ZxrqXpJKPm728CNrv9QBxURwKOKw'
SCRIPT_ID = None  # Будет заполнено автоматически
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/script.projects',
    'https://www.googleapis.com/auth/drive'
]

TOKEN_FILE = 'token.json'
CREDENTIALS_FILE = 'credentials.json'

def print_section(title):
    """Печать заголовка секции"""
    print("\n" + "=" * 70)
    print(f"🔧 {title}")
    print("=" * 70 + "\n")

def get_credentials():
    """Получить или обновить Google credentials"""
    creds = None

    # Если есть сохраненный token, используем его
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    # Если нет валидных credentials, начинаем flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                print("❌ Файл credentials.json не найден!")
                print("\n📝 Как получить credentials:")
                print("   1. Перейдите на: https://console.cloud.google.com")
                print("   2. Создайте новый проект")
                print("   3. Включите Google Sheets API и Google Apps Script API")
                print("   4. Создайте OAuth 2.0 Client ID (Desktop)")
                print("   5. Скачайте JSON и сохраните как credentials.json")
                print("   6. Запустите этот скрипт еще раз")
                sys.exit(1)

            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)

        # Сохраняем token для будущего использования
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())

    return creds

def get_script_id():
    """Получить Script ID из свойств Google Sheet"""
    global SCRIPT_ID

    creds = get_credentials()
    sheets_service = build('sheets', 'v4', credentials=creds)

    try:
        # Получаем метаданные документа
        spreadsheet = sheets_service.spreadsheets().get(
            spreadsheetId=SPREADSHEET_ID,
            fields='spreadsheetId'
        ).execute()

        # Script ID обычно совпадает со SpreadsheetId, но нужно проверить
        # через Google Drive API
        drive_service = build('drive', 'v3', credentials=creds)

        # Пытаемся найти связанный Apps Script
        results = drive_service.files().list(
            q=f"properties has {{'key':'spreadsheetId', 'value':'{SPREADSHEET_ID}'}}",
            spaces='drive',
            fields='files(id, properties)',
            pageSize=10
        ).execute()

        files = results.get('files', [])
        for file in files:
            if 'properties' in file:
                props = {p['key']: p['value'] for p in file['properties']}
                if props.get('spreadsheetId') == SPREADSHEET_ID:
                    SCRIPT_ID = file['id']
                    return SCRIPT_ID

        print("⚠️  Не удалось найти связанный Apps Script")
        print("    Убедитесь, что у Sheet уже есть Apps Script")
        return None

    except HttpError as error:
        print(f"❌ Ошибка Google Sheets API: {error}")
        return None

def deploy_script():
    """Развернуть Google Apps Script"""
    if not GOOGLE_LIBS_AVAILABLE:
        print("❌ Невозможно развернуть без Google API библиотек")
        return None

    print_section("РАЗВЕРТЫВАНИЕ GOOGLE APPS SCRIPT")

    creds = get_credentials()
    script_id = get_script_id()

    if not script_id:
        print("❌ Не удалось получить Script ID")
        return None

    print(f"✅ Script ID найден: {script_id}")

    try:
        script_service = build('script', 'v1', credentials=creds)

        # Создаем развертывание
        request = script_service.projects().deployments().create(
            scriptId=script_id,
            body={
                'versionNumber': 1,
                'description': 'Развертывание Тест #1'
            }
        )

        response = request.execute()
        deployment_id = response.get('deploymentId')

        print(f"✅ Развертывание создано: {deployment_id}")
        return deployment_id

    except HttpError as error:
        print(f"❌ Ошибка развертывания: {error}")
        return None

def execute_test1_function():
    """Выполнить функцию addTest1Data() в Google Apps Script"""
    if not GOOGLE_LIBS_AVAILABLE:
        print("❌ Невозможно выполнить функцию без Google API библиотек")
        return False

    print_section("ВЫПОЛНЕНИЕ ФУНКЦИИ addTest1Data()")

    creds = get_credentials()
    script_id = get_script_id()

    if not script_id:
        print("❌ Не удалось получить Script ID")
        return False

    try:
        script_service = build('script', 'v1', credentials=creds)

        # Выполняем функцию
        request = script_service.scripts().run(
            scriptId=script_id,
            body={
                'function': 'addTest1Data',
                'devMode': True
            }
        )

        response = request.execute()

        if 'error' in response:
            print(f"❌ Ошибка выполнения: {response['error']['details']}")
            return False

        print("✅ Функция addTest1Data() выполнена успешно!")

        # Показываем результат
        if 'response' in response:
            print(f"   Результат: {response['response']}")

        return True

    except HttpError as error:
        print(f"❌ Ошибка Google Apps Script API: {error}")
        return False

def verify_test_added():
    """Проверить, что тест был добавлен в Sheet"""
    print_section("ПРОВЕРКА РЕЗУЛЬТАТОВ")

    creds = get_credentials()
    sheets_service = build('sheets', 'v4', credentials=creds)

    try:
        # Проверяем лист Архив
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID,
            range='Архив!A:J'
        ).execute()

        values = result.get('values', [])

        # Ищем тест #1
        for row in values:
            if len(row) > 0 and row[0] == '1':
                print("✅ Тест #1 найден в листе 'Архив':")
                print(f"   {row}")
                return True

        print("❌ Тест #1 не найден в листе 'Архив'")
        return False

    except HttpError as error:
        print(f"❌ Ошибка проверки: {error}")
        return False

def manual_deployment_alternative():
    """Альтернативный способ - инструкции для ручного развертывания"""
    print_section("АЛЬТЕРНАТИВНОЕ РЕШЕНИЕ - РУЧНОЕ РАЗВЕРТЫВАНИЕ")

    print("Если автоматическое развертывание не сработало, сделайте следующее:\n")

    print("1️⃣  Откройте Google Sheet:")
    print(f"   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/\n")

    print("2️⃣  В Google Sheet нажмите:")
    print("   Расширения → Apps Script\n")

    print("3️⃣  Скопируйте весь код из Код.gs и вставьте его в editor\n")

    print("4️⃣  Нажмите кнопку 'Развернуть' → 'Создать развёртывание'")
    print("   Выберите: Веб-приложение")
    print("   Выполнять как: ваш аккаунт")
    print("   Доступ: Я (только)\n")

    print("5️⃣  После развертывания, вернитесь в Google Sheet и:")
    print("   Нажмите: 🧪 Тесты → ➕ Добавить ТЕСТ #1 (26 вопросов)\n")

    webbrowser.open(f'https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/')

def main():
    """Основная функция"""
    print("\n" + "=" * 70)
    print("🚀 ПОЛНОСТЬЮ АВТОМАТИЧЕСКОЕ РАЗВЕРТЫВАНИЕ ТЕСТ #1")
    print("=" * 70)

    # Проверяем доступность Google библиотек
    if not GOOGLE_LIBS_AVAILABLE:
        print("\n⚠️  Google API библиотеки недоступны")
        print("\n📦 Установите зависимости:")
        print("   pip install --upgrade google-auth-oauthlib google-auth-httplib2 google-api-python-client\n")

        print("После установки запустите скрипт еще раз.\n")

        print("🤖 В ОЖИДАНИИ: Переходим на альтернативное решение...\n")
        manual_deployment_alternative()
        return

    # Основной процесс
    try:
        # Шаг 1: Получить Script ID
        print_section("ШАГ 1: ПОЛУЧЕНИЕ SCRIPT ID")
        print("Подключение к Google Drive...")

        if not get_script_id():
            print("⚠️  Не удалось получить Script ID автоматически")
            manual_deployment_alternative()
            return

        # Шаг 2: Развернуть скрипт
        if not deploy_script():
            print("⚠️  Развертывание через API не удалось")
            manual_deployment_alternative()
            return

        time.sleep(2)

        # Шаг 3: Выполнить функцию
        if not execute_test1_function():
            print("⚠️  Выполнение функции не удалось")
            manual_deployment_alternative()
            return

        time.sleep(2)

        # Шаг 4: Проверить результаты
        if not verify_test_added():
            print("⚠️  Проверка результатов не удалась")
            manual_deployment_alternative()
            return

        # Успех!
        print_section("✅ УСПЕШНО ЗАВЕРШЕНО!")
        print("Тест #1 полностью развернут и добавлен в Google Sheet")
        print("\nПроверьте:")
        print(f"1. Google Sheet: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/")
        print("2. Лист 'Архив' - строка с тестом #1")
        print("3. Лист 'Вопросы' - 26 вопросов для теста")
        print("4. Лист 'Результаты теста' - готов к записи")

    except KeyboardInterrupt:
        print("\n\n❌ Отменено пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Неожиданная ошибка: {e}")
        print("\nПовторите попытку или используйте альтернативное решение")
        manual_deployment_alternative()

if __name__ == '__main__':
    main()
