@echo off
chcp 65001 >nul
title CHIMGAN DARBAZA bot — local dev launcher

REM The bot normally runs 24/7 in production (chimgandarbaza.uz) on a Telegram
REM webhook. This launcher is ONLY for local development. If a webhook is set,
REM scripts/staff-bot-poll.mjs refuses to start (polling would 409-loop), so
REM nothing here can break the live bot.

cd /d "%~dp0.."

echo.
echo Проверяю, не работает ли бот уже на боевом сервере...
"C:\Program Files\nodejs\node.exe" "scripts\check-webhook.mjs"
if errorlevel 1 (
  echo.
  echo Локальный запуск не требуется. Окно закроется по нажатию клавиши.
  pause >nul
  exit /b 0
)

echo [1/2] Запускаю сервер приложения (свёрнутое окно)...
start "bot: app server" /min "C:\Program Files\nodejs\node.exe" "node_modules\next\dist\bin\next" dev -p 3000

echo [2/2] Жду 10 секунд, затем запускаю Telegram-поллер...
timeout /t 10 /nobreak >nul
start "bot: telegram poller" "C:\Program Files\nodejs\node.exe" "scripts\staff-bot-poll.mjs"

echo.
echo Бот запущен ЛОКАЛЬНО. Держите оба окна открытыми; закройте, чтобы остановить.
timeout /t 8 >nul
