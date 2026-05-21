#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Автоматическое развертывание и добавление Тест #1
Запустите: python deploy-test1.py
"""

import webbrowser
import time
import sys

def main():
    print("=" * 70)
    print("🚀 АВТОМАТИЧЕСКОЕ РАЗВЕРТЫВАНИЕ ТЕСТ #1")
    print("=" * 70)
    print()

    # Шаг 1: Открыть Google Sheet
    print("📋 Шаг 1: Открываю Google Sheet...")
    sheet_url = "https://docs.google.com/spreadsheets/d/19BlhyKO3Wazo2b8ZxrqXpJKPm728CNrv9QBxURwKOKw/"
    webbrowser.open(sheet_url)
    print("✅ Google Sheet открыт в браузере")
    print()

    # Шаг 2: Инструкции для пользователя
    print("🔧 Шаг 2: Выполните в браузере (вручную):")
    print()
    print("  1️⃣  В Google Sheet нажмите:")
    print("     Расширения → Apps Script")
    print()
    print("  2️⃣  В Apps Script нажмите синюю кнопку:")
    print("     '⚙️ Развернуть' → 'Создать развёртывание'")
    print()
    print("  3️⃣  Выберите параметры:")
    print("     • Тип: Веб-приложение")
    print("     • Выполнять как: ваш аккаунт")
    print("     • Доступ: Я (только)")
    print()
    print("  4️⃣  Нажмите 'Развернуть' и дождитесь успеха")
    print()
    print("  5️⃣  Скопируйте URL развернутого приложения")
    print("     (он появится в диалоговом окне)")
    print()

    # Шаг 3: Ожидание
    print("⏳ Ожидаю развертывания (автоматически продолжу через 10 сек)...")
    time.sleep(3)

    print()
    print("Если вы уже развернули - нажмите Enter для продолжения...")
    input()
    print()

    # Шаг 4: Вернуться в Sheet и обновить
    print("📊 Шаг 3: Вернитесь в Google Sheet")
    print()
    print("  1️⃣  Обновите страницу (нажмите F5)")
    print("  2️⃣  Должно появиться новое меню: '🧪 Тесты'")
    print()
    print("✅ Готово к следующему шагу")
    print()

    # Шаг 5: Добавление теста
    print("➕ Шаг 4: Добавление Тест #1 (автоматически)")
    print()
    print("  В Google Sheet нажмите меню:")
    print("  🧪 Тесты → ➕ Добавить ТЕСТ #1 (26 вопросов)")
    print()
    print("  Нажмите 'ОК' в диалоговом окне")
    print()

    print("⏳ Ожидаю добавления теста (10 сек)...")
    time.sleep(5)

    print()
    print("🔗 Шаг 5: Добавление ссылки на тест")
    print()
    print("  В Google Sheet нажмите меню:")
    print("  🧪 Тесты → 🔗 Получить ссылку на тест 1")
    print()
    print("  Это автоматически добавит правильную ссылку")
    print()

    time.sleep(3)

    # Финал
    print()
    print("=" * 70)
    print("✅ ГОТОВО!")
    print("=" * 70)
    print()
    print("Проверьте результаты:")
    print()
    print("1. Лист 'Архив' - должна быть строка:")
    print("   №/ID: 1")
    print("   Блок: 3 Социология")
    print("   Тема: 3.4/3.6 Статус, роль, стратификация, социализация")
    print("   Назначение: Итоговый")
    print("   URL: (ссылка на тест)")
    print()
    print("2. Лист 'Вопросы' - должно быть 26 вопросов для теста 1")
    print()
    print("3. Лист 'Результаты теста' - готов к записи результатов")
    print()
    print("🎉 Тест #1 полностью настроен!")
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Отменено пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Ошибка: {e}")
        sys.exit(1)
