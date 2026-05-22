#!/bin/bash
# Скрипт для настройки git remotes для синхронизации TEST repo с my-website

echo "========================================"
echo "Настройка GitHub Remotes"
echo "========================================"
echo ""

# 1. Проверить текущие remotes
echo "[STEP 1] Текущие remotes:"
git remote -v
echo ""

# 2. Добавить TEST repo
echo "[STEP 2] Добавление TEST repo..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Alexandr-Costetchi/TEST.git
echo "[OK] TEST repo добавлен"
echo ""

# 3. Добавить my-website repo как дополнительный remote
echo "[STEP 3] Добавление my-website repo..."
git remote add website https://github.com/Alexandr-Costetchi/my-website.git 2>/dev/null || true
echo "[OK] my-website repo добавлен"
echo ""

# 4. Проверить remotes
echo "[STEP 4] Проверка remotes:"
git remote -v
echo ""

# 5. Предложить отправить текущие изменения
echo "========================================"
echo "[READY] Remotes настроены!"
echo "========================================"
echo ""
echo "[NEXT] Отправить тесты:"
echo "  git push origin master"
echo ""
echo "[NEXT] Синхронизировать с website:"
echo "  python sync_tests.py"
