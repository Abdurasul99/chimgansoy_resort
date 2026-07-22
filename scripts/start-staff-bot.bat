@echo off
chcp 65001 >nul
title CHIMGAN DARBAZA staff bot launcher
REM Local runner for the staff Telegram bot (until the Vercel webhook is live).
REM Opens two windows: the Next dev server and the Telegram poller.
REM The bot works while BOTH windows stay open. Close them to stop.

cd /d "%~dp0.."

echo [1/2] Starting app server (minimized window)...
start "staff-bot: app server" /min "C:\Program Files\nodejs\node.exe" "node_modules\next\dist\bin\next" dev -p 3000

echo [2/2] Waiting 10s, then starting the Telegram poller...
timeout /t 10 /nobreak >nul
start "staff-bot: telegram poller" "C:\Program Files\nodejs\node.exe" "scripts\staff-bot-poll.mjs"

echo.
echo Bot is RUNNING. Keep both windows open; close them to stop.
echo (Poller window shows every message the bot receives.)
timeout /t 8 >nul
