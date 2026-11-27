/**
 * Общее для холстов новогоднего экрана (небо, шар, салют).
 *
 * Каждый холст рисует только пока он на экране и вкладка открыта: страница
 * держит три анимации, и ни одна не должна жечь батарею телефона, пока гость
 * читает карточки ниже или ушёл в другую вкладку.
 */

let sprite: HTMLCanvasElement | null = null;

/** Мягкая снежинка 32×32: рисуется один раз, дальше только копируется. */
export function flakeSprite(): HTMLCanvasElement | null {
  if (sprite) return sprite;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d");
  if (!g) return null;
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.45, "rgba(255,255,255,0.85)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  sprite = c;
  return c;
}

/** Плотность пикселей: выше 1.5 разницы на глаз нет, а холст вчетверо тяжелее. */
export function canvasRatio(): number {
  return Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, 1.5);
}

/** Подогнать холст под его размер на экране. Возвращает ширину и высоту в CSS-пикселях. */
export function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): { w: number; h: number } {
  const box = canvas.getBoundingClientRect();
  const ratio = canvasRatio();
  const w = Math.max(1, box.width);
  const h = Math.max(1, box.height);
  canvas.width = Math.round(w * ratio);
  canvas.height = Math.round(h * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { w, h };
}

/**
 * Следить, виден ли элемент и открыта ли вкладка. Колбэк получает true/false
 * при каждой смене. Возвращает функцию отписки.
 */
export function watchActive(el: Element, onChange: (active: boolean) => void): () => void {
  let inView = true;
  let shown = typeof document === "undefined" ? true : !document.hidden;
  const emit = () => onChange(inView && shown);
  let io: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== "undefined") {
    io = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      emit();
    });
    io.observe(el);
  }
  const onVis = () => {
    shown = !document.hidden;
    emit();
  };
  document.addEventListener("visibilitychange", onVis);
  return () => {
    io?.disconnect();
    document.removeEventListener("visibilitychange", onVis);
  };
}
