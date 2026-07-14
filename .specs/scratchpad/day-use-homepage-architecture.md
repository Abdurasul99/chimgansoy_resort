# Архитектурный scratchpad: day-use homepage

Task: `.specs/tasks/draft/redesign-day-use-homepage.feature.md`
Research: `.specs/research/day-use-homepage-redesign.md`
Codebase: `.specs/analysis/day-use-homepage-codebase.md`
Date: 2026-07-14

## Синтез

- `AGENTS.md` фиксирует day-use как текущий продукт.
- Master расходится с этим состоянием: номера и Exely снова попали в публичную воронку.
- Главная UX-ошибка — две даты для однодневного продукта.
- Главный технический риск — неподтверждённый single-date контракт Exely.
- Главный риск первого рендера — intro-gate и конкурирующие hero media.

## Решения

1. Скрыть ночёвки из navigation/home/FAQ/SEO, но не удалять модули и assets.
2. Сохранить визуальную базу, но сократить IA до семи секций после hero.
3. Публичный контракт: `date`, `guests`, `product=day`; без фиктивного checkout.
4. Сохранить Exely loader, context, `#be-booking-form` и day room type; не менять provider integration в этом релизе.
5. Удалить intro атомарно вместе с head-script и CSS gate.
6. Один LCP-image, `next/image` для смысловых фото, lazy loading ниже fold.
7. Три локали меняются в одном atomic change.
8. FAQ, sticky CTA и safe area проверяются как один mobile layout contract.

## Компромиссы

- Статичный hero сильнее кинематографически и быстрее; slideshow допустим только после performance/a11y доказательств.
- Навигация по якорям сокращает путь, но требует стабильных ids и `scroll-margin-top`.
- Новые секции выносятся в компоненты только если это уменьшает сложность `page.tsx`.

## Порядок rollout

1. Подтвердить business state и Exely contract.
2. Зафиксировать query/i18n/content contracts тестами.
3. Удалить intro и пересобрать hero.
4. Сократить главную, navigation, FAQ и SEO.
5. Провести RU/UZ/EN, responsive, a11y, performance и booking E2E.
6. Мержить в `master` только после owner approval.
