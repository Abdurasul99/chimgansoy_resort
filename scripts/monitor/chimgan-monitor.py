#!/usr/bin/env python3
"""
Сторож заявок и брони CHIMGAN DARBAZA.

Запускается cron'ом на сервере каждые 10 минут, от сайта не зависит. Пишет
ТОЛЬКО о сбоях, из-за которых теряются или не доходят заявки и брони —
никаких «я жив» и ежедневных сводок (владелец, 19.11.2026).

Что проверяет:
  • журнал сайта за прошедшие 10 минут — заявка не дошла в группу Telegram и
    письмо-тревога с ней тоже не ушло, письмо с заявкой не ушло, форма у гостя
    не отправилась после выкладки, группа заявок сменила ID;
  • сайт открывается (иначе заявку оставить негде) и сервис запущен.

Сертификаты и связь с Exely НЕ проверяет — владелец просил писать только
о сбоях с заявками (20.11.2026).

Куда пишет: ТОЛЬКО письмом, в Telegram — ничего (владелец, 20.11.2026).
Адрес — ALERT_EMAIL_TO в /etc/chimgandarbaza.env. Пока домен не подтверждён
в Resend, письмо на этот адрес Resend не пропускает (403) — тогда то же
письмо уходит в ящик заявок (RESERVATIONS_EMAIL_TO), тема всегда с меткой
ALERT_TAG, по ней фильтр пересылает дальше. Так же делает сайт (src/lib/alerts.ts).

Длительный сбой (сайт лежит, сервис остановлен) — одно письмо при начале,
напоминание раз в 2 часа и одно «восстановлено». События из журнала — одно
письмо на каждые 10 минут, где они были.

Установка — scripts/monitor/README.md. Проверка без отправки: --dry-run.
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

ENV_FILE = "/etc/chimgandarbaza.env"
STATE_FILE = os.environ.get("MONITOR_STATE", "/var/lib/chimgan-monitor/state.json")
# Новый ID группы заявок пишет сам сайт (src/lib/telegram.ts) — вне папки, которую nginx отдаёт наружу.
MIGRATIONS_FILE = "/var/www/chimgandarbaza/.next/cache/telegram-chat-migrations.json"
SERVICE = "chimgandarbaza"
SITE_URL = "https://chimgandarbaza.uz/ru"
REMIND_HOURS = {"site": 2, "service": 2}
# Та же метка темы, что у сайта (ALERT_TAG в src/lib/alerts.ts) — по ней фильтр в почте.
ALERT_TAG = "[Сбой заявок]"
DRY = "--dry-run" in sys.argv
INIT = "--init" in sys.argv

# Ошибки в журнале сайта → что это значит для заявок.
LOG_RULES = [
    # Сайт сам шлёт письмом каждую заявку, которая не дошла в группу. Пишем,
    # только если и это письмо не ушло (строка UNDELIVERED_MARK из
    # src/lib/alerts.ts). Общее «[telegram] sendMessage failed» не берём: так
    # падает и ответ гостю в боте-консьерже (гость заблокировал бота) — это не заявка.
    ("telegram", re.compile(r"\[alert\] заявка не дошла в группу заявок — письмо-тревога: НЕ ушло"),
     "Заявка не дошла в группу заявок, и письмо с ней тоже не ушло. Заявка сохранена только в архиве на сервере."),
    ("migrate", re.compile(r"^\[telegram\] chat -?\d+ was upgraded to supergroup -?\d+ — sending there"),
     "Группа заявок сменила ID (Telegram перевёл её в супергруппу). Сайт уже шлёт в новую, но надо обновить TELEGRAM_ADMIN_CHAT_ID на сервере."),
    ("email", re.compile(r"\[request\] Resend (failed|threw)|DELIVERY FAILED|email=(failed|error)"),
     "Письма с заявками не уходят на почту."),
    # Только настоящие ID действий (длинный hex). «x», «y», «r2s», пустой — это
    # сканеры уязвимостей Next.js, а не гости (271 из 283 за неделю на 19.11).
    ("action", re.compile(r"Failed to find Server Action \"[0-9a-f]{20,}\""),
     "У гостей не отправилась форма заявки: страница была открыта до обновления сайта. Гость видел ошибку — заявка НЕ сохранилась."),
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


def addresses(raw):
    return [a.strip() for a in (raw or "").split(",") if a.strip()]


def subject_of(text):
    """Тема письма — первая мысль сообщения, без разметки, с меткой для фильтра."""
    plain = re.sub(r"<[^>]+>", "", text).replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
    plain = " ".join(plain.split())
    return ALERT_TAG + " " + (plain[:140] + "…" if len(plain) > 140 else plain)


def mail_send(env, to, subject, html):
    sender = env.get("BOOKING_EMAIL_FROM", "")
    if "<" not in sender:
        sender = "CHIMGAN DARBAZA <" + sender + ">"
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps({"from": sender, "to": to, "subject": subject, "html": html}).encode(),
        headers={
            "Authorization": "Bearer " + env.get("RESEND_API_KEY", ""),
            "Content-Type": "application/json",
            # Без своего User-Agent Cloudflare перед Resend отбивает urllib.
            "User-Agent": "chimgan-monitor",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return True, "HTTP %s" % r.status
    except urllib.error.HTTPError as e:
        return False, "HTTP %s %s" % (e.code, e.read().decode("utf-8", "replace")[:200])
    except Exception as e:  # сеть
        return False, str(e)[:200]


def notify(env, text):
    """Письмо о сбое. text — в разметке Telegram (<b>, <code>, переносы строк)."""
    subject = subject_of(text)
    if DRY:
        print("--- было бы отправлено письмом ---\nТема: " + subject + "\n" + text + "\n")
        return True
    if not env.get("RESEND_API_KEY") or not env.get("BOOKING_EMAIL_FROM"):
        print("[monitor] RESEND_API_KEY / BOOKING_EMAIL_FROM не заданы — письмо не отправить:", subject, file=sys.stderr)
        return False
    html = ('<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;white-space:pre-wrap">'
            + text + "</div>")
    direct = addresses(env.get("ALERT_EMAIL_TO"))
    if direct:
        ok, info = mail_send(env, direct, subject, html)
        if ok:
            return True
        print("[monitor] ALERT_EMAIL_TO: письмо не принято —", info, file=sys.stderr)
    else:
        print("[monitor] ALERT_EMAIL_TO не задан — пишу в ящик заявок", file=sys.stderr)
    # Resend пока не пускает на чужие адреса — в ящик заявок, оттуда пересылка.
    fallback = [a for a in addresses(env.get("RESERVATIONS_EMAIL_TO") or env.get("BOOKING_EMAIL_TO")) if a not in direct]
    if fallback:
        ok, info = mail_send(env, fallback, subject, html)
        if ok:
            return True
        print("[monitor] почта заявок: письмо не принято —", info, file=sys.stderr)
    print("[monitor] не удалось отправить ни на одну почту:", subject, file=sys.stderr)
    return False


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


def condition(env, state, key, failing, start_text, recover_text, remind_hours):
    """Длительное состояние: тревога при начале, напоминание, «восстановлено»."""
    now = time.time()
    rec = state.setdefault("conditions", {}).get(key)
    if failing:
        if not rec:
            state["conditions"][key] = {"since": now, "last": now}
            notify(env, start_text)
        elif now - rec["last"] >= remind_hours * 3600:
            hrs = int((now - rec["since"]) // 3600)
            notify(env, "⏳ Всё ещё не исправлено (" + str(hrs) + " ч): " + start_text)
            rec["last"] = now
    elif rec:
        mins = int((now - rec["since"]) // 60)
        dur = (str(mins // 60) + " ч " if mins >= 60 else "") + str(mins % 60) + " мин"
        notify(env, recover_text + " (сбой длился " + dur + ")")
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
                found.setdefault(key, []).append(mask(line))
    # Переезд группы — не сбой: сайт сам шлёт в новую и запоминает её. Одно
    # информационное письмо на каждый новый ID, без «🚨» и без повторов
    # (19.11.2026 после каждой выкладки приходила ложная тревога).
    if "migrate" in found:
        found.pop("migrate")
        # Новый ID — только из файла, который пишет сам сайт; текст журнала мог
        # прийти от гостя (поле формы), ему не верим. Только «-100…».
        seen = state.setdefault("migrations_seen", [])
        try:
            with open(MIGRATIONS_FILE, encoding="utf-8") as f:
                targets = [str(v) for v in json.load(f).values()]
        except (OSError, ValueError):
            targets = []
        for target in targets:
            if re.fullmatch(r"-100\d{6,}", target) and target not in seen:
                seen.append(target)
                notify(env, "ℹ️ <b>Группа заявок сменила ID</b> — Telegram перевёл её в супергруппу. Заявки доходят: сайт "
                       "сам переключился на новую группу. Чтобы убрать лишний шаг, в настройках сервера стоит обновить "
                       "<code>TELEGRAM_ADMIN_CHAT_ID=" + target + "</code>.")

    if found:
        parts = ["🚨 <b>Сбой с заявками на сайте</b>", ""]
        for key, rx, meaning in LOG_RULES:
            if key in found:
                n = len(found[key])
                parts.append("• " + meaning + " — " + str(n) + " раз за последние ~" + str(max(1, int((now - since) // 60))) + " мин.")
                parts.append("  <code>" + found[key][-1].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") + "</code>")
        notify(env, "\n".join(parts))

    # 2. Сайт и сервис — без них заявку оставить негде.
    ok, info = site_ok()
    condition(env, state, "site", not ok,
              "🚨 <b>Сайт chimgandarbaza.uz не открывается</b> (" + info + ") — гости не могут оставить заявку или забронировать.",
              "✅ Сайт снова открывается", REMIND_HOURS["site"])
    ok, info = service_ok()
    condition(env, state, "service", not ok,
              "🚨 <b>Сервис сайта остановлен</b> (" + info + ") — заявки не принимаются.",
              "✅ Сервис сайта снова работает", REMIND_HOURS["service"])

    state["last_run"] = now
    save_state(state)


if __name__ == "__main__":
    main()
