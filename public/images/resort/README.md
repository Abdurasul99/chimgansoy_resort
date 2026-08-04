# CHIMGAN DARBAZA image folder

Photographs only. The CGI render set that used to live here (`01-…` to `18-…`,
`pool.jpg`, and a duplicate copy of all eighteen under `photo_2026-03-31_*`) was
deleted in August 2026 together with the "Что мы строим" section: the operator
retired the renders, and nothing on the site should answer "what does it look
like?" with a drawing.

Every file is registered in `src/content/images.ts` under a key that describes
what is in the frame. Add photos there too — an unregistered file is invisible
to the site.

| Folder | What's in it |
| --- | --- |
| `2026-08/` | August-2026 shoot: the finished pool (11 frames) and the chalets (5). The homepage hero, gallery, mosaic and photo strip all come from here. |
| `rooms/` | Interiors and exteriors of the A-frames and the chalets, by room. |
| `gallery/` | June-2026 grounds shoot: topchans, food, paths, the ridge. |
| `hero/` | Wide frames cut to 3:2 for full-bleed use. |
| root | Chimgan-area stock for the /place cards (`chimgan.jpg`, `kanatnaya_doroga.jpg`, `gorniy_progulki.jpg`, `konniy_progulka.webp`), the winter hero, and the brand marks. |

Filenames must say what is inside them. The old numbered set did not — several
were named one frame off from their contents — and that single fact caused every
image mix-up this site has had: the pool page showed the entrance gate, the
sport card showed a swimming pool, and the Telegram bot sent guests a photo of
padel courts captioned "chalets with a mountain view".

## Adding a new drop

`scripts/import-photos.js` is the importer used for the August drop: it resizes
to a 2400px ceiling, strips camera metadata (including the GPS tags phones
write) and writes progressive JPEG. Point its `MAP` at the new files, run it,
then register the results in `src/content/images.ts`.
