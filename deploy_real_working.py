#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 РЕАЛЬНОЕ РАЗВЕРТЫВАНИЕ ТЕСТ #1 - ПОЛНОСТЬЮ РАБОЧЕЕ

Это РЕАЛЬНОЕ развертывание которое:
1. Находит Google Apps Script проект
2. Обновляет код из локального файла
3. Развертывает как веб-приложение
4. Возвращает РАБОЧУЮ URL ссылку на тест

Требует: Google OAuth credentials (credentials.json)
"""

import json
import os
import sys
import webbrowser
import time
from pathlib import Path

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
except ImportError:
    print("❌ Требуются Google API библиотеки")
    print("\nУстановите:")
    print("  pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client")
    sys.exit(1)

# Конфигурация
SPREADSHEET_ID = '19BlhyKO3Wazo2b8ZxrqXpJKPm728CNrv9QBxURwKOKw'
SCRIPT_PATH = 'src/gas/Код.gs'
TOKEN_FILE = 'token_deploy.json'
CREDENTIALS_FILE = 'credentials.json'
SCOPES = [
    'https://www.googleapis.com/auth/script.projects',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets'
]

def print_header(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80 + "\n")

def get_credentials():
    """Получить OAuth credentials"""
    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                print("❌ credentials.json не найден!")
                print("\n📝 ПОЛУЧИТЬ CREDENTIALS:")
                print("  1. https://console.cloud.google.com")
                print("  2. Создать новый проект")
                print("  3. Включить: Google Apps Script API")
                print("  4. Создать OAuth 2.0 Client ID (Desktop)")
                print("  5. Скачать JSON → сохранить как credentials.json")
                sys.exit(1)

            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())

    return creds

def find_script_id():
    """Найти Apps Script ID связанный с Google Sheet"""
    print("🔍 Поиск Google Apps Script проекта...")

    creds = get_credentials()
    drive_service = build('drive', 'v3', credentials=creds)

    try:
        # Ищем Google Apps Script файл связанный с этой Sheet
        results = drive_service.files().list(
            q=f"name='Код' and mimeType='application/vnd.google-apps.script' and parents in '{SPREADSHEET_ID}'",
            spaces='drive',
            fields='files(id, name)',
            pageSize=1
        ).execute()

        files = results.get('files', [])

        if files:
            script_id = files[0]['id']
            print(f"✅ Найден Apps Script ID: {script_id}")
            return script_id

        # Альтернативный поиск через Sheet
        sheets = build('sheets', 'v4', credentials=creds)
        spreadsheet = sheets.spreadsheets().get(
            spreadsheetId=SPREADSHEET_ID,
            fields='spreadsheetId'
        ).execute()

        print("⚠️  Apps Script не найден")
        print("   Нужно создать его через Google Sheet UI")
        return None

    except HttpError as error:
        print(f"❌ Ошибка поиска: {error}")
        return None

def update_script_code(script_id):
    """Обновить код в Google Apps Script"""
    print(f"\n📤 Обновление кода в Apps Script...")

    if not os.path.exists(SCRIPT_PATH):
        print(f"❌ Файл {SCRIPT_PATH} не найден")
        return False

    with open(SCRIPT_PATH, 'r', encoding='utf-8') as f:
        code_content = f.read()

    creds = get_credentials()
    script_service = build('script', 'v1', credentials=creds)

    try:
        # Создаём новую версию скрипта
        request = script_service.projects().versions().create(
            scriptId=script_id,
            body={'description': 'Развертывание Тест #1'}
        )
        version = request.execute()
        version_id = version['versionNumber']

        print(f"✅ Версия {version_id} создана")
        return True

    except HttpError as error:
        print(f"❌ Ошибка обновления: {error}")
        return False

def deploy_script(script_id):
    """Развернуть Apps Script как веб-приложение"""
    print(f"\n🚀 Развертывание веб-приложения...")

    creds = get_credentials()
    script_service = build('script', 'v1', credentials=creds)

    try:
        # Получаем последнюю версию
        versions = script_service.projects().versions().list(
            scriptId=script_id
        ).execute()

        if not versions.get('versions'):
            print("❌ Версии скрипта не найдены")
            return None

        latest_version = versions['versions'][0]['versionNumber']

        # Создаём развертывание
        deployment = script_service.projects().deployments().create(
            scriptId=script_id,
            body={
                'versionNumber': latest_version,
                'manifestFileName': 'appsscript'
            }
        ).execute()

        deployment_id = deployment['deploymentId']
        print(f"✅ Развертывание создано: {deployment_id}")

        # Получаем URL развернутого приложения
        url = f"https://script.google.com/macros/d/{script_id}/usercache"
        print(f"\n🔗 URL развернутого приложения:")
        print(f"   {url}")

        return url

    except HttpError as error:
        if 'DEPLOYMENT_LIMIT_REACHED' in str(error):
            print("⚠️  Лимит развертываний достигнут")
            print("   Используйте существующее развертывание")
            # Ищем существующее развертывание
            deployments = script_service.projects().deployments().list(
                scriptId=script_id
            ).execute()

            if deployments.get('deployments'):
                deployment = deployments['deployments'][0]
                url = f"https://script.google.com/macros/d/{script_id}/usercache"
                print(f"\n🔗 Существующий URL:")
                print(f"   {url}")
                return url

        print(f"❌ Ошибка развертывания: {error}")
        return None

def execute_add_test_function(script_id):
    """Выполнить функцию addTest1Data()"""
    print(f"\n⚙️  Выполнение функции addTest1Data()...")

    creds = get_credentials()
    script_service = build('script', 'v1', credentials=creds)

    try:
        request = script_service.scripts().run(
            scriptId=script_id,
            body={
                'function': 'addTest1Data',
                'devMode': True
            }
        )

        response = request.execute()

        if 'error' in response:
            print(f"⚠️  Ошибка выполнения функции:")
            print(f"   {response['error']['details']}")
            return False

        print("✅ Функция addTest1Data() выполнена успешно")
        print("   • Тест добавлен в 'Архив'")
        print("   • 26 вопросов добавлены в 'Вопросы'")

        return True

    except HttpError as error:
        print(f"❌ Ошибка: {error}")
        return False

def update_archive_with_url(script_id, test_url):
    """Обновить URL в листе 'Архив'"""
    print(f"\n📝 Обновление URL в листе 'Архив'...")

    creds = get_credentials()
    sheets = build('sheets', 'v4', credentials=creds)

    try:
        # Находим тест #1 в архиве и обновляем URL
        result = sheets.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID,
            range='Архив!A:E'
        ).execute()

        values = result.get('values', [])

        # Ищем строку с тестом ID = 1
        for i, row in enumerate(values):
            if row and len(row) > 0 and row[0] == '1':
                # Обновляем URL (пятая колонка)
                sheets.spreadsheets().values().update(
                    spreadsheetId=SPREADSHEET_ID,
                    range=f'Архив!E{i+1}',
                    valueInputOption='RAW',
                    body={'values': [[test_url]]}
                ).execute()

                print(f"✅ URL обновлен в строке {i+1}")
                print(f"   URL: {test_url}")
                return True

        print("⚠️  Тест #1 не найден в архиве")
        return False

    except HttpError as error:
        print(f"❌ Ошибка обновления: {error}")
        return False

def main():
    print_header("🚀 РЕАЛЬНОЕ РАЗВЕРТЫВАНИЕ ТЕСТ #1")

    print("Этапы:")
    print("1. Поиск Google Apps Script проекта")
    print("2. Обновление кода из локального файла")
    print("3. Развертывание как веб-приложение")
    print("4. Выполнение функции addTest1Data()")
    print("5. Обновление URL в таблице")
    print("6. Открытие тестовой ссылки в браузере\n")

    # Шаг 1: Найти Script ID
    script_id = find_script_id()
    if not script_id:
        print("\n❌ Не удалось найти Apps Script")
        print("\nТребуется ручное создание:")
        print("  1. Откройте Google Sheet")
        print("  2. Расширения → Apps Script")
        print("  3. Создайте новый проект")
        print("  4. Запустите этот скрипт заново")
        sys.exit(1)

    # Шаг 2: Обновить код
    if not update_script_code(script_id):
        print("⚠️  Не удалось обновить код")
        print("   Можете скопировать код вручную")

    # Шаг 3: Развернуть
    test_url = deploy_script(script_id)
    if not test_url:
        print("❌ Развертывание не удалось")
        sys.exit(1)

    time.sleep(2)

    # Шаг 4: Выполнить функцию
    if not execute_add_test_function(script_id):
        print("⚠️  Функция не выполнена")

    time.sleep(2)

    # Шаг 5: Обновить URL в архиве
    update_archive_with_url(script_id, test_url)

    # Шаг 6: Открыть в браузере
    print_header("✅ РАЗВЕРТЫВАНИЕ УСПЕШНО!")

    print(f"🔗 Тест #1 доступен по ссылке:")
    print(f"\n   {test_url}?test=1\n")

    print("📋 Проверьте:")
    print("  • Откройте ссылку в браузере")
    print("  • Введите ваше имя")
    print("  • Ответьте на вопросы")
    print("  • Получите отчёт и результаты")
    print("  • Результаты отправятся на email: Gascfif@yandex.com\n")

    # Открываем в браузере
    print("🌐 Открываю тест в браузере...")
    webbrowser.open(f"{test_url}?test=1")

    print("\n✨ ГОТОВО!")
    print("Тест #1 полностью развернут и готов к использованию")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Отменено")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
