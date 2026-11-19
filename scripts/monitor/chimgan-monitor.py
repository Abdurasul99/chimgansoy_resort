#!/usr/bin/env python3
"""
Сторож заявок и брони CHIMGAN DARBAZA.

Запускается cron'ом на сервере каждые 10 минут, от сайта не зависит. Пишет
ТОЛЬКО о сбоях, из-за которых теряются или не доходят заявки и брони —
никаких «я жив» и ежедневных сводок (владелец, 19.11.2026).

Что проверяет:
  • журнал сайта за прошедшие 10 минут — заявка не дошла в группу Telegram,
    письмо с заявкой не ушло, форма у гостя не отправилась после выкладки,
    тревога не дошла, группа сменила ID;
  • сайт открывается (иначе заявку оставить негде) и сервис запущен;
  • сертификаты сайта и модуля онлайн-брони Exely — 14.11.2026 у Exely
    истёк сертификат, и онлайн-бронь перестала грузиться.

Куда пишет: только ботом заявок — в группу заявок (TELEGRAM_ADMIN_CHAT_ID;
если она сменила ID — сам находит новый) и в личные чаты ответственных
(TELEGRAM_ALERT_CHAT_IDS). Партнёрского бота и его группу не трогает
(владелец, 19.11.2026).

Длительный сбой (сайт лежит, сертификат) — одно сообщение при начале,
напоминание раз в несколько часов и одно «восстановлено». События из
журнала — одно сообщение на каждые 10 минут, где они были.

Установка — scripts/monitor/README.md. Проверка без отправки: --dry-run.
"""
import datetime
import json
import os
import re
import socket
import ssl
import subprocess
import sys
import time
import urllib.request

ENV_FILE = "/etc/chimgandarbaza.env"
STATE_FILE = os.environ.get("MONITOR_STATE", "/var/lib/chimgan-monitor/state.json")
SERVICE = "chimgandarbaza"
SITE_URL = "https://chimgandarbaza.uz/ru"
CERT_HOSTS = [
    ("chimgandarbaza.uz", "сайт chimgandarbaza.uz"),
    ("cdn.behopenapi.com", "модуль онлайн-брони Exely (CDN)"),
    ("uz-ibe.hopenapi.com", "модуль онлайн-брони Exely"),
]
CERT_WARN_DAYS = 7
REMIND_HOURS = {"site": 2, "service": 2, "cert": 24}
DRY = "--dry-run" in sys.argv
INIT = "--init" in sys.argv

# Ошибки в журнале сайта → что это значит для заявок.
LOG_RULES = [
    ("telegram", re.compile(r"\[telegram\] sendMessage (failed|error)"),
     "Заявки не доходят в группу заявок (Telegram). Сами заявки сохранены в архиве на сервере."),
    ("migrate", re.compile(r"was upgraded to supergroup"),
     "Группа заявок сменила ID (Telegram перевёл её в супергруппу). Сайт уже шлёт в новую, но надо обновить TELEGRAM_ADMIN_CHAT_ID на сервере."),
    ("email", re.compile(r"\[request\] Resend (failed|threw)|DELIVERY FAILED|email=(failed|error)"),
     "Письма с заявками не уходят на почту."),
    # Только настоящие ID действий (длинный hex). «x», «y», «r2s», пустой — это
    # сканеры уязвимостей Next.js, а не гости (271 из 283 за неделю на 19.11).
    ("action", re.compile(r"Failed to find Server Action \"[0-9a-f]{20,}\""),
     "У гостей не отправилась форма заявки: страница была открыта до обновления сайта. Гость видел ошибку — заявка НЕ сохранилась."),
    ("alert", re.compile(r"\[alert\] тревогу не удалось"),
     "Тревога о сбое заявки не дошла ни в один канал — проверьте архив заявок на сервере."),
]


def load_env():
    env = {}
    with open(ENV_FILE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def load_state():
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=1)
    os.replace(tmp, STATE_FILE)


def tg_send(token, chat, text):
    req = urllib.request.Request(
        "https://api.telegram.org/bot" + token + "/sendMessage",
        data=json.dumps({"chat_id": chat, "text": text, "parse_mode": "HTML", "disable_web_page_preview": True}).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        try:
            return json.load(e)
        except ValueError:
            return {"ok": False, "description": "HTTP %s" % e.code}
    except Exception as e:  # сеть
        return {"ok": False, "description": str(e)}


def notify(env, state, text):
    if DRY:
        print("--- было бы отправлено ---\n" + text + "\n")
        return True
    delivered = False
    staff = env.get("TELEGRAM_STAFF_BOT_TOKEN", "")
    group = state.get("group_chat") or env.get("TELEGRAM_ADMIN_CHAT_ID", "").split(",")[0].strip()
    if staff and group:
        d = tg_send(staff, group, text)
        moved = (d.get("parameters") or {}).get("migrate_to_chat_id")
        if not d.get("ok") and moved:
            state["group_chat"] = str(moved)
            d = tg_send(staff, moved, text)
        delivered = bool(d.get("ok"))
    for chat in [c.strip() for c in env.get("TELEGRAM_ALERT_CHAT_IDS", "").split(",") if c.strip()]:
        if staff and tg_send(staff, chat, text).get("ok"):
            delivered = True
    if not delivered:
        print("[monitor] не удалось отправить ни в один канал:", text[:200], file=sys.stderr)
    return delivered


def journal_since(ts):
    out = subprocess.run(
        ["journalctl", "-u", SERVICE, "--since", "@%d" % int(ts), "--no-pager", "-o", "cat"],
        capture_output=True, text=True, timeout=60,
    )
    return out.stdout.splitlines()


def mask(line):
    # Имена и телефоны гостей в журнал попадают из строк [contact:…] — в тревогу их не несём.
    line = re.sub(r"name: [^,|]*", "name: …", line)
    line = re.sub(r"phone: [^,|]*", "phone: …", line)
    line = re.sub(r"\+?\d[\d \-()]{8,}\d", "…", line)
    return line[:220]


def site_ok():
    try:
        req = urllib.request.Request(SITE_URL, headers={"User-Agent": "chimgan-monitor"})
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status == 200, "HTTP %s" % r.status
    except urllib.error.HTTPError as e:
        return False, "HTTP %s" % e.code
    except Exception as e:
        return False, str(e)[:120]


def service_ok():
    r = subprocess.run(["systemctl", "is-active", SERVICE], capture_output=True, text=True)
    return r.stdout.strip() == "active", r.stdout.strip()


def cert_days(host):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE  # читаем и просроченный — чтобы сказать, когда истёк
    with socket.create_connection((host, 443), timeout=15) as s:
        with ctx.wrap_socket(s, server_hostname=host) as ss:
            der = ss.getpeercert(binary_form=True)
    # дату берём из openssl: в stdlib нет разбора DER без проверки
    pem = ssl.DER_cert_to_PEM_cert(der)
    out = subprocess.run(["openssl", "x509", "-noout", "-enddate"], input=pem, capture_output=True, text=True)
    end = datetime.datetime.strptime(out.stdout.strip().split("=", 1)[1], "%b %d %H:%M:%S %Y %Z")
    now_utc = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    return (end - now_utc).total_seconds() / 86400, end


def condition(env, state, key, failing, start_text, recover_text, remind_hours):
    """Длительное состояние: тревога при начале, напоминание, «восстановлено»."""
    now = time.time()
    rec = state.setdefault("conditions", {}).get(key)
    if failing:
        if not rec:
            state["conditions"][key] = {"since": now, "last": now}
            notify(env, state, start_text)
        elif now - rec["last"] >= remind_hours * 3600:
            hrs = int((now - rec["since"]) // 3600)
            notify(env, state, "⏳ Всё ещё не исправлено (" + str(hrs) + " ч):\n\n" + start_text)
            rec["last"] = now
    elif rec:
        mins = int((now - rec["since"]) // 60)
        dur = (str(mins // 60) + " ч " if mins >= 60 else "") + str(mins % 60) + " мин"
        notify(env, state, recover_text + " (сбой длился " + dur + ")")
        del state["conditions"][key]


def main():
    env = load_env()
    state = load_state()
    now = time.time()
    since = state.get("last_run", now - 600)
    if INIT:
        state["last_run"] = now
        save_state(state)
        print("monitor: начальное состояние записано, прошлые события не отправляются")
        return

    # 1. Журнал сайта — события с прошлого запуска.
    lines = journal_since(since)
    found = {}
    for line in lines:
        for key, rx, _ in LOG_RULES:
            if rx.search(line):
                # Строка о переезде группы — без маски: в ней только ID чатов, а ID нужен целиком.
                found.setdefault(key, []).append(line if key == "migrate" else mask(line))
    # Переезд группы — не сбой: сайт сам шлёт в новую и запоминает её. Одно
    # информационное сообщение на каждый новый ID, без «🚨» и без повторов
    # (19.11.2026 после каждой выкладки приходила ложная тревога).
    if "migrate" in found:
        lines_m = found.pop("migrate")
        seen = state.setdefault("migrations_seen", [])
        for line in lines_m:
            m = re.search(r"upgraded to supergroup (-?\d+)", line)
            target = m.group(1) if m else ""
            if target and target not in seen:
                seen.append(target)
                notify(env, state, "ℹ️ <b>Группа заявок сменила ID</b> — Telegram перевёл её в супергруппу. Заявки доходят: сайт "
                       "сам переключился на новую группу. Чтобы убрать лишний шаг, в настройках сервера стоит обновить "
                       "<code>TELEGRAM_ADMIN_CHAT_ID=" + target + "</code>.")

    if found:
        parts = ["🚨 <b>Сбой с заявками на сайте</b>", ""]
        for key, rx, meaning in LOG_RULES:
            if key in found:
                n = len(found[key])
                parts.append("• " + meaning + " — " + str(n) + " раз за последние ~" + str(max(1, int((now - since) // 60))) + " мин.")
                parts.append("  <code>" + found[key][-1].replace("<", "&lt;").replace(">", "&gt;") + "</code>")
        notify(env, state, "\n".join(parts))

    # 2. Сайт и сервис — без них заявку оставить негде.
    ok, info = site_ok()
    condition(env, state, "site", not ok,
              "🚨 <b>Сайт chimgandarbaza.uz не открывается</b> (" + info + ") — гости не могут оставить заявку или забронировать.",
              "✅ Сайт снова открывается", REMIND_HOURS["site"])
    ok, info = service_ok()
    condition(env, state, "service", not ok,
              "🚨 <b>Сервис сайта остановлен</b> (" + info + ") — заявки не принимаются.",
              "✅ Сервис сайта снова работает", REMIND_HOURS["service"])

    # 3. Сертификаты сайта и онлайн-брони — раз в 6 часов достаточно.
    if now - state.get("cert_checked", 0) >= 6 * 3600:
        state["cert_checked"] = now
        for host, label in CERT_HOSTS:
            try:
                days, end = cert_days(host)
                bad = days < CERT_WARN_DAYS
                text = ("🚨 <b>Сертификат истёк</b>" if days < 0 else "⚠️ <b>Сертификат скоро истекает</b>") + \
                       ": " + label + " (" + host + "), срок — " + end.strftime("%d.%m.%Y") + "."
                if host != "chimgandarbaza.uz":
                    text += " Онлайн-бронь у гостей не загрузится — напишите в поддержку Exely."
            except Exception as e:
                bad, text = True, "⚠️ Не удаётся проверить сертификат: " + label + " (" + host + "): " + str(e)[:100]
            condition(env, state, "cert:" + host, bad, text, "✅ Сертификат в порядке: " + label, REMIND_HOURS["cert"])

    state["last_run"] = now
    save_state(state)


if __name__ == "__main__":
    main()
