# AGENTS.md — CHIMGAN DARBAZA

Общие инструкции для Codex и Claude Code. Проверено по локальному коду 16 ноября 2026 года. Старые описания отражают прошлые версии; перед изменением доступности услуг уточняйте состояние у оператора.

## Репозиторий и материалы

- Основной сайт: текущая папка, GitHub `Abdurasul99/chimgansoy_resort`, домен `chimgandarbaza.uz`.
- `chimgan-link/` и `chimgan-uslugi/` — самостоятельные Git-репозитории. Проверяйте их отдельно и сохраняйте историю.
- `Hotel_photo/` — CGI-рендеры генплана от оператора (март 2026), не фото; на сайт не ставить — с августа там только реальная съёмка. `Инструкия Сайта Chimgan Darbaza/` — единственный пакет передачи, в том числе с доступами; исключён из Git. Копий кода в нём нет — код только в репозиториях.
- Документация: [docs/README.md](./docs/README.md). Аудит папки: [docs/WORKSPACE-AUDIT.md](./docs/WORKSPACE-AUDIT.md).
- Не коммитьте `.env.local`, `ACCESS.md`, пароли и закрытые пакеты передачи. Не выводите их содержимое в логи.

## Реализация

- Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS v4, Framer Motion, Vitest и Playwright. Версии и команды — в `package.json`.
- Публичные страницы: `src/app/[locale]/`, языки `ru`, `uz`, `en`. Панель оператора: `src/app/admin/`. Партнёрские страницы и их админка также существуют в локализованных маршрутах.
- `src/content/` содержит значения по умолчанию. Админка, загруженные файлы и Postgres также влияют на сайт; живой контент не ограничивается TypeScript-файлами.
- БД: `src/lib/sql-client.ts`, `src/lib/db.ts` и модули подсистем. Файлы: `src/lib/blob-store.ts`, каталог по умолчанию `/var/lib/chimgan-blob`.
- Код и сентябрьская документация описывают переезд на Contabo. Старые инструкции Vercel исторические. Перед публикацией проверяйте действующую конфигурацию; Git push сам по себе не подтверждает обновление production.

## Доступность и бронирование

- Бренд CHIMGAN DARBAZA, Ташкентская область, высота 1700 м.
- Старое описание day-use-only и приостановленного проживания историческое: в текущем коде есть страницы номеров, навигация, Exely и система заявок оператора. Сохраняйте их при очистке.
- Сезонность задают `src/content/pool-closure.ts` и `src/content/topchan-closure.ts`; в проверенном коде оба закрыты. Сохраняйте материалы для открытия сезона.
- Exely: `ExelyBookingEngine`, loader и slot. Формы заявок — отдельные пути. Bnovo и PayKeeper удалены.
- Формы передают скрытый `formType`: booking → `RESERVATIONS_EMAIL_TO`, inquiry → `INFO_EMAIL_TO`, резервный адрес `BOOKING_EMAIL_TO`. Перед изменением доставки читайте `src/app/actions/contact.ts`.
- Telegram, email и запись в БД имеют собственную обработку ошибок. Успех на экране гостя не подтверждает доставку. Не отправляйте тестовые сообщения без разрешения.
- FAQ/консьерж: `FaqPanel`, `/api/chat`, `src/lib/ai-provider.ts`, `src/content/assistant-knowledge.ts`. Используется Groq; это не только статический FAQ.

## Ресторан и партнёры

- `/[locale]/restaurant`: меню и фото. Заказы, корзина, столики и бот заказов удалены в `980634d`; не восстанавливайте их при обслуживании.
- Ресторанные настройки, категории и блюда — в Postgres. Фото — в файловом хранилище. Админка `/admin/restoran`, роли владелец/менеджер/сотрудник проверяются proxy и actions.
- Стиль ресторана: светлая витрина, категории, карточки с акцентом на цену, золотой акцент. Сохраняйте направление.
- Партнёры: [docs/PARTNERS.md](./docs/PARTNERS.md). Бот сотрудников: [docs/TELEGRAM_STAFF_BOT.md](./docs/TELEGRAM_STAFF_BOT.md). Старые планы сверяйте с реализацией.

## Правила правок

- Пользовательский текст добавляйте на всех трёх языках в `translations.ts` либо `LocalizedString`. Читайте через `text(value, locale)`, ссылки локализуйте существующими helpers.
- `sections/` — блоки страниц, `ui/` — виджеты, `layout/` — общий каркас. По умолчанию server components.
- Реестр изображений: `src/content/images.ts`. Сохраняйте исходники и используемые public assets; различие имён не означает дубль.
- `DatePicker` и `GuestSelect` передают значения через hidden inputs. Сохраняйте стандартную отправку форм.
- Палитра — CSS variables в `src/app/globals.css`: ink, paper/surface, accent, sun, line, shadow.
- Не экспортируйте `dynamicParams = false`: после admin revalidation страницы номеров возвращали 404. Для неизвестных slug используйте `notFound()`. Есть regression test.
- Типы `.next` могут устареть после изменения маршрутов. Перегенерируйте кеш, не удаляйте исходные маршруты ради ошибки кеша.
- Сохраняйте чужие локальные изменения. Очистка папки не подразумевает push, merge веток и deploy.

## Windows и проверки

Node и Git могут отсутствовать в PATH:

```powershell
& 'C:\Program Files\Git\cmd\git.exe' status -sb
& 'C:\Program Files\nodejs\node.exe' .\node_modules\typescript\bin\tsc --noEmit
& 'C:\Program Files\nodejs\node.exe' .\node_modules\vitest\vitest.mjs run --maxWorkers=4
& 'C:\Program Files\nodejs\node.exe' .\node_modules\next\dist\bin\next build
```

Выбирайте проверки по объёму изменений. Перед публикацией кода — типы, тесты, production build. CI описан в `.github/workflows/check.yml`. Интеграционные тесты БД запускайте только на отдельной тестовой базе.
