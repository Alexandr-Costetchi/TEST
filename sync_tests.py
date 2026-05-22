#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт синхронизации тестов между локальным репозиторием и GitHub
Синхронизирует TEST repo с my-website repo
"""

import os
import json
import subprocess
from pathlib import Path
from datetime import datetime

# Конфигурация
TESTS_DIR = Path('tests')
TEST_REPO = 'https://github.com/Alexandr-Costetchi/TEST'
WEBSITE_REPO = 'https://github.com/Alexandr-Costetchi/my-website'
WEBSITE_TESTS_PATH = 'public/tests'  # Где хранятся тесты в website repo

def run_command(cmd):
    """Выполнить команду в консоли"""
    print(f"[EXEC] {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[ERROR] {result.stderr}")
        return False
    print(f"[OK] {result.stdout}")
    return True

def sync_to_test_repo():
    """Синхронизировать локальные тесты в TEST repo"""
    print("\n" + "=" * 60)
    print("СИНХРОНИЗАЦИЯ ЛОКАЛЬНЫХ ТЕСТОВ В TEST REPO")
    print("=" * 60 + "\n")

    # 1. Проверить статус git
    print("[STEP 1] Проверка статуса git...")
    run_command("git status")

    # 2. Добавить все изменения
    print("\n[STEP 2] Добавление файлов тестов...")
    run_command("git add tests/")
    run_command("git add src/gas/Код.gs")
    run_command("git add '*.json'")

    # 3. Создать коммит
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit_msg = f"[TESTS] Синхронизация тестов от {timestamp}"
    print(f"\n[STEP 3] Создание коммита: {commit_msg}...")
    run_command(f'git commit -m "{commit_msg}"')

    # 4. Отправить в TEST repo
    print("\n[STEP 4] Отправка в TEST repo...")
    if not run_command("git push origin master"):
        print("[WARNING] Возможно, нет настроенного remote. Настраиваю...")
        run_command(f"git remote add origin {TEST_REPO}")
        run_command("git push -u origin master")

    print("\n[OK] Синхронизация в TEST repo завершена!")

def read_inventory():
    """Прочитать инвентарь тестов"""
    inventory_file = TESTS_DIR / 'meta' / 'tests_inventory.json'
    if not inventory_file.exists():
        print("[ERROR] Файл инвентаря не найден:", inventory_file)
        return None

    with open(inventory_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_website_content():
    """Сгенерировать контент для вебсайта"""
    print("\n" + "=" * 60)
    print("ГЕНЕРИРОВАНИЕ КОНТЕНТА ДЛЯ ВЕБСАЙТА")
    print("=" * 60 + "\n")

    inventory = read_inventory()
    if not inventory:
        return False

    # Генерировать JSON со списком всех тестов
    tests_list = {
        "version": inventory['version'],
        "generatedAt": datetime.now().isoformat(),
        "subject": inventory['subject'],
        "totalTests": inventory['totalTests'],
        "totalQuestions": inventory['totalQuestions'],
        "tests": []
    }

    # Добавить информацию о каждом тесте
    for test in inventory['tests']:
        tests_list['tests'].append({
            "id": test['testId'],
            "name": test['testName'],
            "topics": test['topics'],
            "questions": test['questionsCount'],
            "format": test['format'],
            "status": test['status'],
            "url": f"https://verny-kurs.ru/test/{test['url']}"
        })

    # Сохранить список тестов
    output_file = TESTS_DIR / 'meta' / 'tests_list_website.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(tests_list, f, ensure_ascii=False, indent=2)

    print(f"[OK] Сгенерирован список тестов: {output_file}")
    print(f"[OK] Всего тестов: {len(tests_list['tests'])}")

    return True

def show_status():
    """Показать статус синхронизации"""
    print("\n" + "=" * 60)
    print("СТАТУС ТЕСТОВ")
    print("=" * 60 + "\n")

    inventory = read_inventory()
    if not inventory:
        return

    print(f"Версия: {inventory['version']}")
    print(f"Обновлено: {inventory['lastUpdated']}")
    print(f"Предмет: {inventory['subject']}")
    print(f"Всего тестов: {inventory['totalTests']}")
    print(f"Всего вопросов: {inventory['totalQuestions']}")
    print(f"Статус синхронизации: {inventory['syncStatus']}")

    print("\n[ТЕСТЫ]")
    for test in inventory['tests']:
        status_icon = "✅" if test['status'] == 'ready' else "⏳"
        print(f"{status_icon} Test {test['testId']:2d} | {test['testName']:30s} | {test['questionsCount']:2d} вопросов")

def main():
    """Главная функция"""
    print("=" * 60)
    print("СИНХРОНИЗАЦИЯ ТЕСТОВ")
    print("=" * 60)

    # Проверить, что мы в правильной директории
    if not TESTS_DIR.exists():
        print("[ERROR] Директория tests/ не найдена!")
        return False

    # Показать статус
    show_status()

    # Синхронизировать в TEST repo
    sync_to_test_repo()

    # Сгенерировать контент для вебсайта
    generate_website_content()

    print("\n" + "=" * 60)
    print("[READY] Синхронизация завершена!")
    print("=" * 60)
    print("\n[NEXT STEPS]:")
    print("1. Проверьте https://github.com/Alexandr-Costetchi/TEST")
    print("2. Синхронизируйте тесты с my-website репозиторием вручную")
    print("3. Обновите вебсайт с новыми тестами")

if __name__ == "__main__":
    main()
