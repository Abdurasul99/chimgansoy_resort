import { AdminHeading } from "../AdminShell";
import { RoomForm, type PhotoOption, type RoomEditor } from "./RoomForm";
import { PhotoLibrary } from "./PhotoLibrary";
import { resolveRooms } from "@/lib/rooms-live";
import { readForEdit } from "@/lib/site-overrides";
import { getRoomPrices } from "@/lib/room-price";
import { resortImages } from "@/content/images";

/**
 * Photographs the operator can choose from: everything registered on the site.
 *
 * Deliberately the whole registry rather than "photos of this room" — there is
 * no room tag on an image, and guessing one from the key would quietly hide
 * frames the operator wanted. They can see the pictures; they can decide.
 */
function photoOptions(uploaded: { id: string; url: string; alt: string }[]): PhotoOption[] {
  const own: PhotoOption[] = uploaded.map((p) => ({ key: p.id, src: p.url, alt: p.alt }));
  const registry = Object.entries(resortImages)
    .map(([key, img]) => ({
      key,
      src: img.localSrc ?? img.src,
      alt: img.alt.ru,
    }))
    .filter((p) => p.src.startsWith("/images/"))
    .sort((a, b) => a.key.localeCompare(b.key));
  // Uploads first: they are the ones the operator just added and is looking for.
  return [...own, ...registry];
}

export default async function Page() {
  const overrides = await readForEdit();
  const storeReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const photos = photoOptions(overrides.photos);
  // Shown beside the field so the operator can see the number they override.
  const enginePrices = await getRoomPrices();

  const editors: RoomEditor[] = resolveRooms(overrides).map((r) => ({
    slug: r.base.slug,
    title: r.base.title.ru,
    amenities: r.amenities("ru"),
    features: r.features("ru"),
    gallery: r.galleryKeys,
    priceNote: r.priceNote,
    priceFrom: r.priceFrom,
    enginePrice: enginePrices[r.base.slug],
    edited: r.edited,
  }));

  return (
    <>
      <AdminHeading
        title="Домики"
        hint="Что написано и какие фотографии стоят на страницах глэмпинга, шале и бассейна."
      />

      <div className="mb-8">
        <PhotoLibrary photos={overrides.photos} storeReady={storeReady} />
      </div>

      <div className="space-y-8">
        {editors.map((room) => (
          <RoomForm key={room.slug} room={room} photos={photos} storeReady={storeReady} />
        ))}
      </div>

      <div className="mt-10 space-y-3 text-xs leading-6 text-[var(--muted)]">
        <p>
          Списки, которые вы сохранили, показываются на всех трёх языках одинаково —
          переводов здесь нет. Пока вы не тронули список, работает переведённый вариант
          из кода: очистите поле и сохраните, чтобы вернуться к нему.
        </p>
        <p>
          Фотографии выбираются из уже загруженных на сайт, а не с телефона. На сайте нет
          сжатия картинок на лету: снимок на 6 МБ уехал бы каждому посетителю как есть и
          испортил бы скорость страницы. Каждый кадр здесь уже обрезан, выровнен по цвету
          и подписан на трёх языках. Если нужно добавить новые снимки в этот список —
          пришлите их, они появятся здесь.
        </p>
      </div>
    </>
  );
}
