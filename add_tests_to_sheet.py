#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для добавления 5 тестов (3.1-3.5) в Google Sheet
Парсит QUESTIONS массивы из HTML файлов и добавляет их в таблицу
"""

import json
import re
from datetime import datetime
from pathlib import Path

# Данные тестов (метаинформация и пути)
TESTS_DATA = [
    {
        "test_id": 31,
        "test_name": "Итоговый повтор 3.1",
        "topics": "Темы 3.1–3.4: Социальная дифференциация, стратификация, традиционные ценности",
        "file": r"C:\Users\Hi-tech\AppData\Local\Packages\CLAUDE~1\LOCALC~1\Roaming\Claude\LOCAL-~1\8840EE~1\1D02CA~1\LOCAL_~1\outputs\__3_1~1.HTM"
    },
    {
        "test_id": 32,
        "test_name": "Итоговый повтор 3.2",
        "topics": "Темы 3.4–3.5: Социальные роли, статус, семья и её функции",
        "file": r"C:\Users\Hi-tech\AppData\Local\Packages\CLAUDE~1\LOCALC~1\Roaming\Claude\LOCAL-~1\8840EE~1\1D02CA~1\LOCAL_~1\outputs\__3_2~1.HTM"
    },
    {
        "test_id": 33,
        "test_name": "Итоговый повтор 3.3",
        "topics": "Темы 3.5–3.6: Семья, социальные нормы, девиантное поведение, конфликты",
        "file": r"C:\Users\Hi-tech\AppData\Local\Packages\CLAUDE~1\LOCALC~1\Roaming\Claude\LOCAL-~1\8840EE~1\1D02CA~1\LOCAL_~1\outputs\__3_3~1.HTM"
    },
    {
        "test_id": 34,
        "test_name": "Итоговый повтор 3.4",
        "topics": "Темы 3.6–3.7: Наука, образование, искусство, социальная политика РФ",
        "file": r"C:\Users\Hi-tech\AppData\Local\Packages\CLAUDE~1\LOCALC~1\Roaming\Claude\LOCAL-~1\8840EE~1\1D02CA~1\LOCAL_~1\outputs\__3_4~1.HTM"
    },
    {
        "test_id": 35,
        "test_name": "Итоговый повтор 3.5",
        "topics": "Темы 3.7: Социальная политика РФ, социальные группы, нормы, санкции",
        "file": r"C:\Users\Hi-tech\AppData\Local\Packages\CLAUDE~1\LOCALC~1\Roaming\Claude\LOCAL-~1\8840EE~1\1D02CA~1\LOCAL_~1\outputs\__3_5~1.HTM"
    }
]

def extract_questions_from_html(file_path):
    """Извлекает QUESTIONS массив из HTML файла"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Ищем const QUESTIONS = [...]
    match = re.search(r'const QUESTIONS = (\[.*?\]);', content, re.DOTALL)
    if not match:
        print(f"[WARNING] QUESTIONS array not found in {file_path}")
        return None

    questions_json = match.group(1)
    try:
        questions = json.loads(questions_json)
        print(f"✓ Извлечено {len(questions)} вопросов из {Path(file_path).name}")
        return questions
    except json.JSONDecodeError as e:
        print(f"❌ Ошибка парсинга JSON: {e}")
        return None

def format_questions_for_sheet(questions, test_id):
    """Форматирует вопросы в формат для Google Sheet"""
    formatted = []
    for q in questions:
        formatted.append({
            "test_id": test_id,
            "question_id": q.get("id"),
            "question_text": q.get("text"),
            "options": json.dumps(q.get("options", []), ensure_ascii=False),
            "correct_answers": json.dumps(q.get("correct", []), ensure_ascii=False),
            "timestamp": datetime.now().isoformat()
        })
    return formatted

def main():
    """Главная функция"""
    print("=" * 60)
    print("Добавление тестов 3.1-3.5 в Google Sheet")
    print("=" * 60)
    print()

    all_questions = []
    test_metadata = []

    for test_info in TESTS_DATA:
        print(f"[PROCESSING] {test_info['test_name']}")

        # Извлекаем вопросы
        questions = extract_questions_from_html(test_info['file'])

        if questions:
            # Форматируем для таблицы
            formatted = format_questions_for_sheet(questions, test_info['test_id'])
            all_questions.extend(formatted)

            # Добавляем метаданные теста
            test_metadata.append({
                "test_id": test_info['test_id'],
                "test_name": test_info['test_name'],
                "topics": test_info['topics'],
                "questions_count": len(questions),
                "subject": "Обществознание ЕГЭ",
                "format": "EGE Task 20",
                "created_date": datetime.now().strftime("%Y-%m-%d"),
                "status": "ready"
            })
            print(f"  [OK] Test {test_info['test_id']}: {len(questions)} questions added")
        print()

    print("=" * 60)
    print(f"TOTAL: {len(test_metadata)} tests processed")
    print(f"TOTAL: {len(all_questions)} questions processed")
    print("=" * 60)
    print()

    # Сохраняем в JSON для импорта
    output_data = {
        "tests_metadata": test_metadata,
        "questions": all_questions
    }

    output_file = r"D:\ПРОБА GIT+CLAUDE\tests_data_export.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"[SAVED] Data exported to: {output_file}")
    print()
    print("[NEXT] STEP:")
    print("   1. Import tests to Google Sheet via Google Apps Script")
    print("   2. Use addTestsToSheet() function in Kod.gs")
    print("=" * 60)

if __name__ == "__main__":
    main()
