"""
Бот-помощник: База знаний по Обществознанию
Работает ТОЛЬКО по загруженным файлам, не ищет в интернете.
Всегда указывает источник ответа.
"""

import os
import logging
from pathlib import Path
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from google import genai
from google.genai import types
from pdfminer.high_level import extract_text as pdf_extract_text
from docx import Document

# ─── Настройки ────────────────────────────────────────────────
TELEGRAM_TOKEN = os.environ.get("SOCIAL_KB_BOT_TOKEN", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
FILES_DIR = Path("files/social")      # папка с учебными материалами
MAX_HISTORY = 10                       # сколько сообщений помним в диалоге
MAX_CONTEXT_CHARS = 80_000            # сколько символов из файлов передаём в запрос

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(message)s",
    level=logging.INFO,
)
log = logging.getLogger(__name__)

# ─── Глобальное хранилище ──────────────────────────────────────
knowledge_base: list[dict] = []   # [{"name": "файл.pdf", "text": "...", "pages": {...}}]
chat_histories: dict[int, list] = {}   # chat_id → список сообщений

# ─── Загрузка файлов ──────────────────────────────────────────

def load_pdf(path: Path) -> tuple[str, dict]:
    """Читает PDF через pdfminer, возвращает (полный_текст, {})."""
    text = pdf_extract_text(str(path)) or ""
    return text.strip(), {}


def load_docx(path: Path) -> tuple[str, dict]:
    """Читает DOCX, страницы не нумерованы — возвращает весь текст."""
    doc = Document(str(path))
    text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return text, {}


def load_txt(path: Path) -> tuple[str, dict]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    return text, {}


def load_all_files() -> list[dict]:
    """Загружает все файлы из FILES_DIR при старте бота."""
    FILES_DIR.mkdir(parents=True, exist_ok=True)
    result = []
    for f in FILES_DIR.iterdir():
        if not f.is_file():
            continue
        try:
            ext = f.suffix.lower()
            if ext == ".pdf":
                text, pages = load_pdf(f)
            elif ext == ".docx":
                text, pages = load_docx(f)
            elif ext in (".txt", ".md"):
                text, pages = load_txt(f)
            else:
                log.info("Пропущен файл: %s (неизвестный тип)", f.name)
                continue
            result.append({"name": f.name, "text": text, "pages": pages})
            log.info("Загружен файл: %s (%d символов)", f.name, len(text))
        except Exception as e:
            log.error("Ошибка при загрузке %s: %s", f.name, e)
    return result


# ─── Формирование контекста для Gemini ────────────────────────

def build_context_block() -> str:
    """Склеивает тексты всех файлов в один блок (с ограничением)."""
    if not knowledge_base:
        return "Файлы не загружены."
    parts = []
    total = 0
    for doc in knowledge_base:
        chunk = f"=== Файл: {doc['name']} ===\n{doc['text']}"
        if total + len(chunk) > MAX_CONTEXT_CHARS:
            remaining = MAX_CONTEXT_CHARS - total
            chunk = chunk[:remaining] + "\n... [текст обрезан]"
            parts.append(chunk)
            break
        parts.append(chunk)
        total += len(chunk)
    return "\n\n".join(parts)


def build_system_prompt() -> str:
    file_names = ", ".join(d["name"] for d in knowledge_base) if knowledge_base else "нет файлов"
    context = build_context_block()
    return f"""Ты — ИИ-помощник по предмету Обществознание для подготовки к ЕГЭ.

СТРОГИЕ ПРАВИЛА:
1. Отвечай ТОЛЬКО на основе материалов ниже. Не используй знания из интернета или другие источники.
2. После каждого ответа обязательно укажи источник: имя файла и, если возможно, номер страницы.
3. Если ответа в материалах нет — честно скажи: «В загруженных материалах эта тема не найдена».
4. Отвечай по-русски, чётко и по делу.
5. Для вопросов ЕГЭ — давай структурированный ответ с примерами из материалов.

ЗАГРУЖЕННЫЕ ФАЙЛЫ: {file_names}

━━━ МАТЕРИАЛЫ ━━━
{context}
━━━ КОНЕЦ МАТЕРИАЛОВ ━━━"""


# ─── Gemini ───────────────────────────────────────────────────

def ask_gemini(user_message: str, history: list) -> str:
    """Отправляет запрос в Gemini с историей диалога."""
    client = genai.Client(api_key=GEMINI_API_KEY)

    # Конвертируем историю в формат Gemini
    gemini_history = []
    for msg in history[:-1]:
        role = "user" if msg["role"] == "user" else "model"
        gemini_history.append(
            types.Content(role=role, parts=[types.Part(text=msg["content"])])
        )

    chat = client.chats.create(
        model="gemini-1.5-flash",
        config=types.GenerateContentConfig(
            system_instruction=build_system_prompt(),
        ),
        history=gemini_history,
    )
    response = chat.send_message(user_message)
    return response.text


# ─── Telegram handlers ────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    chat_histories[chat_id] = []

    if knowledge_base:
        files_list = "\n".join(f"  📄 {d['name']}" for d in knowledge_base)
        text = (
            "📚 *Бот по Обществознанию* запущен!\n\n"
            f"Загружено файлов: *{len(knowledge_base)}*\n{files_list}\n\n"
            "Задавай вопросы — отвечу только по этим материалам и укажу источник.\n\n"
            "Команды:\n"
            "/files — список файлов\n"
            "/reset — начать диалог заново"
        )
    else:
        text = (
            "⚠️ *Файлы не загружены!*\n\n"
            f"Добавь PDF/DOCX/TXT файлы в папку `{FILES_DIR}` и перезапусти бота."
        )
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_files(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not knowledge_base:
        await update.message.reply_text(f"Папка `{FILES_DIR}` пуста. Добавь файлы и перезапусти бота.")
        return
    lines = [f"📁 *Загруженные материалы:*\n"]
    for d in knowledge_base:
        chars = len(d["text"])
        pages = len(d["pages"])
        info = f"{pages} стр." if pages else f"{chars:,} символов"
        lines.append(f"• {d['name']} — {info}")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def cmd_reset(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    chat_histories[chat_id] = []
    await update.message.reply_text("🔄 Память диалога очищена. Начинаем заново!")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    user_text = update.message.text.strip()

    if not knowledge_base:
        await update.message.reply_text(
            f"⚠️ Файлы не загружены. Добавь материалы в папку `{FILES_DIR}` и перезапусти бота."
        )
        return

    # Инициализируем историю если нет
    if chat_id not in chat_histories:
        chat_histories[chat_id] = []

    # Добавляем вопрос в историю
    chat_histories[chat_id].append({"role": "user", "content": user_text})

    # Обрезаем историю
    if len(chat_histories[chat_id]) > MAX_HISTORY:
        chat_histories[chat_id] = chat_histories[chat_id][-MAX_HISTORY:]

    # Индикатор печатания
    await context.bot.send_chat_action(chat_id=chat_id, action="typing")

    try:
        answer = ask_gemini(user_text, chat_histories[chat_id])
        chat_histories[chat_id].append({"role": "model", "content": answer})
        await update.message.reply_text(answer)
    except Exception as e:
        log.error("Ошибка Gemini: %s", e)
        await update.message.reply_text(
            f"❌ Ошибка: {str(e)[:300]}"
        )


# ─── Запуск ───────────────────────────────────────────────────

def main():
    if not TELEGRAM_TOKEN:
        raise ValueError("Не задана переменная SOCIAL_KB_BOT_TOKEN")
    if not GEMINI_API_KEY:
        raise ValueError("Не задана переменная GEMINI_API_KEY")

    global knowledge_base
    log.info("Загружаю файлы из %s ...", FILES_DIR)
    knowledge_base = load_all_files()
    log.info("Загружено файлов: %d", len(knowledge_base))

    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("files", cmd_files))
    app.add_handler(CommandHandler("reset", cmd_reset))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    log.info("Бот Обществознание (База знаний) запущен.")
    app.run_polling()


if __name__ == "__main__":
    main()
