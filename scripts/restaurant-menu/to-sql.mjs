#!/usr/bin/env node
/**
 * Меню → SQL для рабочей базы: заменяет разделы и блюда ресторана целиком.
 *
 *   node scripts/restaurant-menu/to-sql.mjs > menu.sql
 *   (на сервере) sudo -u postgres psql -d chimgandb -v ON_ERROR_STOP=1 -1 < menu.sql
 *
 * -1 — одна транзакция: при любой ошибке база остаётся как была. Файл подаётся
 * через stdin: `psql -f` из /root пользователь postgres не читает.
 *
 * Защита. Замена стирает всё, что ресторан сделал в админке с блюдами. Поэтому
 * скрипт отказывается работать, если там уже есть фото, описание, скрытое
 * блюдо или отметка «временно нет» — тогда меню правят точечно, а не заново.
 */
import { DISH_COUNT, MENU } from "./menu-2026-11.mjs";

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const ls = ([ru, uz, en]) => q(JSON.stringify({ ru, uz, en })) + "::jsonb";

const out = [];
out.push(`-- Меню «Сазанчика», ${MENU.length} разделов, ${DISH_COUNT} позиций. Сгенерировано scripts/restaurant-menu/to-sql.mjs`);
out.push(`DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM restaurant_dishes
    WHERE image <> ''
       OR state <> 'published'
       OR availability = 'unavailable'
       OR coalesce(description->>'ru', '') <> ''
       OR coalesce(description->>'uz', '') <> ''
       OR coalesce(description->>'en', '') <> ''
  ) THEN
    RAISE EXCEPTION 'В меню есть правки из админки (фото, описание, скрытое блюдо или «временно нет») — замена отменена';
  END IF;
END $$;`);
out.push("DELETE FROM restaurant_dishes;");
out.push("DELETE FROM restaurant_categories;");

MENU.forEach((cat, ci) => {
  const sort = (ci + 1) * 10;
  out.push(
    `WITH c AS (INSERT INTO restaurant_categories (title, sort, visible) VALUES (${ls(cat.title)}, ${sort}, true) RETURNING id)`,
  );
  const rows = cat.dishes.map(([ru, uz, en, price, portion = "", image = ""], di) => {
    const availability = cat.preorder ? "preorder" : "available";
    return `  ((SELECT id FROM c), ${ls([ru, uz, en])}, ${q(portion)}, ${price}, ${q(image)}, ${q(availability)}, ${(di + 1) * 10})`;
  });
  out.push(`INSERT INTO restaurant_dishes (category_id, title, portion, price, image, availability, sort) VALUES\n${rows.join(",\n")};`);
});

out.push(`DO $$
BEGIN
  IF (SELECT count(*) FROM restaurant_dishes) <> ${DISH_COUNT} OR (SELECT count(*) FROM restaurant_categories) <> ${MENU.length} THEN
    RAISE EXCEPTION 'После замены число блюд или разделов не сходится — отмена';
  END IF;
END $$;`);
out.push(`SELECT count(*) AS dishes, (SELECT count(*) FROM restaurant_categories) AS categories FROM restaurant_dishes;`);

process.stdout.write(out.join("\n") + "\n");
