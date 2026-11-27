/**
 * Фоновые фото (imageStyle/frameStyle/backgroundOf из images.ts) — только
 * рядом с экраном.
 *
 * Фон из CSS браузер качает, как только видит элемент, — loading="lazy" у
 * него нет. Главная поэтому сразу тянула все 47 кадров (4,7 МБ), хотя на
 * первом экране два-три (замер 27.11.2026). Здесь фон по умолчанию выключен
 * и включается для кадра, когда тот ближе полутора экранов.
 *
 * Как, не трогая разметку React. Атрибут или класс на элементе до гидратации
 * — расхождение с сервером (React 19 ругается на лишние атрибуты), а после
 * гидратации поздно: первый экран ждал бы весь JavaScript. Поэтому скрипт
 * пишет правила в свой <style>, по адресу кадра:
 *   [style*="<адрес>"][style*="--bg-sm"] { background-image: var(--bg-sm) }
 * Адрес и так есть в атрибуте style. Тот же кадр в другом месте страницы
 * включается заодно — он уже в кэше.
 *
 * Расстояние меряется только по вертикали: карусели прокручиваются вбок, и
 * их кадры за краем ряда должны быть готовы к свайпу. Невидимые элементы
 * (display:none — например, вариант для другой ширины экрана) не качаются,
 * пока не появятся.
 *
 * Без JavaScript <style> не появляется — фоны грузятся сразу, как раньше.
 *
 * Функция встраивается строкой в <head> (layout.tsx) и должна быть
 * самодостаточной: никаких внешних переменных и импортов, синтаксис ES2015 (let/const), без внешних хелперов.
 */
export function lazyBackgrounds() {
  const d = document;
  const w = window;
  if (!w.requestAnimationFrame || !w.MutationObserver || !d.documentElement) return;
  const SEL = '[style*="--bg-sm"]';
  const style = d.createElement("style");
  style.setAttribute("data-lazy-bg", "");
  style.textContent = SEL + "{background-image:none!important}";
  (d.head || d.documentElement).appendChild(style);
  const sheet = style.sheet as CSSStyleSheet;
  const shown: Record<string, 1> = {};
  const pending: HTMLElement[] = [];
  let frame = 0;

  function keyOf(el: HTMLElement) {
    const m = /url\(\s*["']?([^"')]+)/.exec(el.style.getPropertyValue("--bg-sm"));
    return m ? m[1] : "";
  }
  function show(key: string) {
    shown[key] = 1;
    const q = '[style*="' + key.replace(/["\\]/g, "\\$&") + '"]' + SEL;
    try {
      sheet.insertRule(q + "{background-image:var(--bg-sm)!important}", sheet.cssRules.length);
      sheet.insertRule("@media (min-width:640px){" + q + "{background-image:var(--bg-lg)!important}}", sheet.cssRules.length);
    } catch {
      // Кривой адрес не должен оставить без фона остальные кадры.
    }
  }
  function check() {
    frame = 0;
    const h = w.innerHeight || 800;
    for (let i = pending.length - 1; i >= 0; i--) {
      const el = pending[i];
      const key = keyOf(el);
      if (!key || shown[key] || !el.isConnected) {
        pending.splice(i, 1);
        continue;
      }
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      if (r.top < h * 2.5 && r.bottom > -h) {
        show(key);
        pending.splice(i, 1);
      }
    }
  }
  function queue() {
    if (!frame && pending.length) frame = w.requestAnimationFrame(check);
  }
  function add(el: Element) {
    if (el.nodeType === 1 && el.matches(SEL) && pending.indexOf(el as HTMLElement) < 0) {
      const key = keyOf(el as HTMLElement);
      if (key && !shown[key]) pending.push(el as HTMLElement);
    }
  }
  function scan(node: Node) {
    if (node.nodeType !== 1) return;
    add(node as Element);
    const list = (node as Element).querySelectorAll(SEL);
    for (let i = 0; i < list.length; i++) add(list[i]);
  }

  new MutationObserver(function (records) {
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      if (rec.type === "attributes") add(rec.target as Element);
      else for (let j = 0; j < rec.addedNodes.length; j++) scan(rec.addedNodes[j]);
    }
    queue();
  }).observe(d.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
  scan(d.documentElement);
  queue();
  w.addEventListener("scroll", queue, { passive: true, capture: true });
  w.addEventListener("resize", queue);
  w.addEventListener("load", queue);
}

/** Строка для <script> в <head>. */
export const lazyBackgroundsScript = `(${lazyBackgrounds.toString()})();`;
