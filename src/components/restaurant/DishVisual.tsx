import { RestIcon } from "./RestIcon";

/**
 * Картинка блюда — фото из админки или спокойная заглушка без фото.
 *
 * ТЗ (п. 3): нет фото — аккуратная заглушка без чужих фотографий, и меню
 * публикуется, не дожидаясь съёмки. Заглушка нейтральная, как в приложениях
 * доставки: светлый квадрат с клошем. Цветные плитки с буквами перетягивали
 * внимание с цены и названия (28.09.2026: «больше минимализма»).
 */
export function DishVisual({ image, title, className = "" }: { image: string; title: string; className?: string }) {
  if (image) {
    return (
      // Обычный <img>: фото лежат в собственном хранилище /blob/, next/image
      // для них не настроен и не нужен — они уже ужаты при загрузке.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={title} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} />
    );
  }
  return (
    <div role="img" aria-label={title} className={`flex h-full w-full items-center justify-center bg-[#efece6] ${className}`}>
      <RestIcon name="cloche" className="h-1/3 max-h-16 w-1/3 max-w-16 text-[#cdc5b8]" />
    </div>
  );
}
