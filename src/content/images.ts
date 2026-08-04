import type { ImageAsset } from "./types";

export const resortImages = {
  /* ── Real photography (June 2026 shoot, curated from 98-photo gallery) ── */
  galTopchanPeaks: {
    src: "/images/resort/gallery/gal-topchan-peaks.jpg",
    localSrc: "/images/resort/gallery/gal-topchan-peaks.jpg",
    position: "center",
    alt: {
      ru: "Топчан с занавесями на фоне снежных вершин Чимгана",
      uz: "Chimg'onning qorli cho'qqilari fonida pardali topchan",
      en: "Curtained topchan against the snowy peaks of Chimgan",
    },
  },
  galTopchanRidge: {
    src: "/images/resort/gallery/gal-topchan-ridge.jpg",
    localSrc: "/images/resort/gallery/gal-topchan-ridge.jpg",
    position: "center",
    alt: {
      ru: "Топчаны на фоне горного хребта",
      uz: "Tog' tizmasi fonidagi topchanlar",
      en: "Topchans against the mountain ridge",
    },
  },
  galTopchanRow: {
    src: "/images/resort/gallery/gal-topchan-row.jpg",
    localSrc: "/images/resort/gallery/gal-topchan-row.jpg",
    position: "center",
    alt: {
      ru: "Ряд топчанов среди молодых сосен",
      uz: "Yosh qarag'aylar orasidagi topchanlar qatori",
      en: "Row of topchans among young pines",
    },
  },
  galTerritoryPanorama: {
    src: "/images/resort/gallery/gal-territory-panorama.jpg",
    localSrc: "/images/resort/gallery/gal-territory-panorama.jpg",
    position: "center",
    alt: {
      ru: "Панорама территории CHIMGAN DARBAZA с горами",
      uz: "CHIMGAN DARBAZA hududining tog'lar bilan panoramasi",
      en: "Panorama of CHIMGAN DARBAZA grounds with mountains",
    },
  },
  galPathway: {
    src: "/images/resort/gallery/gal-pathway.jpg",
    localSrc: "/images/resort/gallery/gal-pathway.jpg",
    position: "center",
    alt: {
      ru: "Прогулочная дорожка между топчанами",
      uz: "Topchanlar orasidagi sayr yo'lakchasi",
      en: "Walking path between the topchans",
    },
  },
  galTopchanSwing: {
    src: "/images/resort/gallery/gal-topchan-swing.jpg",
    localSrc: "/images/resort/gallery/gal-topchan-swing.jpg",
    position: "center",
    alt: {
      ru: "Топчан с подвесной кроватью-качелями",
      uz: "Osma karavotli topchan",
      en: "Topchan with a hanging swing bed",
    },
  },
  galTopchanInside: {
    src: "/images/resort/gallery/gal-topchan-inside.jpg",
    localSrc: "/images/resort/gallery/gal-topchan-inside.jpg",
    position: "center",
    alt: {
      ru: "Топчан с курпачами изнутри",
      uz: "Kurpachali topchan ichkaridan",
      en: "Inside a topchan with kurpacha cushions",
    },
  },
  /* ── A-frame glamping, finished & furnished (July 2026 shoot) ──
     Shot portrait (2:3); stored pre-cropped to 4:3, which is the ratio the
     room gallery uses. The room hero crops this further to ~2:1, so every
     frame here is chosen to survive that second crop.

     There is deliberately no A-frame photo here from the June shoot: both of
     those (gal-aframe-trio, gal-aframe-closeup) showed the cabins as open
     shells on bare earth, and were removed from the repo entirely rather than
     left around to be picked up by mistake. */
  aframeRoom: {
    src: "/images/resort/rooms/aframe-room.jpg",
    localSrc: "/images/resort/rooms/aframe-room.jpg",
    position: "center",
    alt: {
      ru: "Интерьер глэмпинга A-frame: кровать, панорамное окно с шторами и зона отдыха",
      uz: "A-frame glemping ichki ko'rinishi: karavot, pardali panoramali deraza va dam olish zonasi",
      en: "A-frame glamping interior: bed, curtained panoramic window and seating area",
    },
  },
  aframeExterior: {
    src: "/images/resort/rooms/aframe-exterior.jpg",
    localSrc: "/images/resort/rooms/aframe-exterior.jpg",
    position: "center",
    alt: {
      ru: "Готовые домики A-frame среди молодых сосен",
      uz: "Yosh qarag'aylar orasidagi tayyor A-frame uychalari",
      en: "Finished A-frame cabins among young pines",
    },
  },
  /* Landscaping finished — lawn, path and grown pines. Shot after the gallery
     above, so it is the only frame that shows the grounds as they are now.
     Supplied at 896px (not the camera original), hence two purpose-built crops
     instead of one master: each is used at a size that 896px actually covers.
     A full-resolution original would let both go sharper. */
  aframeLawn: {
    src: "/images/resort/rooms/aframe-lawn.jpg",
    localSrc: "/images/resort/rooms/aframe-lawn.jpg",
    position: "center",
    alt: {
      ru: "Домики A-frame на подстриженном газоне с соснами и дорожкой",
      uz: "Qarag'ay va yo'lakli o'rilgan maysazordagi A-frame uychalari",
      en: "A-frame cabins on a manicured lawn with pines and a walkway",
    },
  },
  /* Wide banner cut of the lawn frame — the sky above y≈395 is cropped away
     because it holds a tower crane and the overhead wires. Used on the About
     and /bron heroes and behind the closing promo band. */
  aframeLawnBanner: {
    src: "/images/resort/hero/hero-lawn-banner.jpg",
    localSrc: "/images/resort/hero/hero-lawn-banner.jpg",
    position: "center",
    alt: {
      ru: "Готовый глэмпинг A-frame на зелёном газоне",
      uz: "Yashil maysazordagi tayyor A-frame glemping",
      en: "Finished A-frame glamping on a green lawn",
    },
  },
  /* 3:4 — matches the emotion-strip cell natively, so no upscale here: the
     cell renders ~288px wide and the 888px source is already 3x oversampled. */
  aframeLawnTall: {
    src: "/images/resort/rooms/aframe-lawn-tall.jpg",
    localSrc: "/images/resort/rooms/aframe-lawn-tall.jpg",
    position: "center",
    alt: {
      ru: "Домики A-frame на зелёном газоне среди сосен",
      uz: "Qarag'aylar orasidagi yashil maysazorda A-frame uychalari",
      en: "A-frame cabins on a green lawn among pines",
    },
  },
  /* ── Chalet / Шале, finished & furnished (July 2026 shoot) ──
     Same treatment as the A-frame set: portrait 2:3 sources stored at 4:3,
     each frame checked at the room-gallery ratio AND at the ~2:1 the room
     hero crops it to. Chosen to mirror the published spec — two bedrooms
     (one double, one twin), an ensuite per bedroom, kitchen-lounge with sofa. */
  // The chalet's only exterior. Every other chalet frame is an interior, so
  // the room page could show what the inside looks like but never the building
  // a guest is actually booking.
  chaletExterior: {
    src: "/images/resort/rooms/chalet-exterior.jpg",
    localSrc: "/images/resort/rooms/chalet-exterior.jpg",
    position: "center",
    alt: {
      ru: "Шале снаружи: деревянный фасад, терраса с перилами и сосны на газоне",
      uz: "Shale tashqaridan: yog'och fasad, panjarali terrasa va maysazordagi qarag'aylar",
      en: "The chalet from outside: timber façade, railed terrace and pines on the lawn",
    },
  },
  chaletLounge: {
    src: "/images/resort/rooms/chalet-lounge.jpg",
    localSrc: "/images/resort/rooms/chalet-lounge.jpg",
    position: "center",
    alt: {
      ru: "Кухня-зал шале: угловой диван, обеденный стол и деревянный свод",
      uz: "Shale oshxona-zali: burchak divan, ovqat stoli va yog'och gumbaz",
      en: "Chalet kitchen-lounge: corner sofa, dining table and timber vault",
    },
  },
  chaletDining: {
    src: "/images/resort/rooms/chalet-dining.jpg",
    localSrc: "/images/resort/rooms/chalet-dining.jpg",
    position: "center",
    alt: {
      ru: "Обеденная зона шале с телевизором и диваном",
      uz: "Shale ovqatlanish zonasi: televizor va divan",
      en: "Chalet dining area with TV and sofa",
    },
  },
  chaletBedroomDouble: {
    src: "/images/resort/rooms/chalet-bedroom-double.jpg",
    localSrc: "/images/resort/rooms/chalet-bedroom-double.jpg",
    position: "center",
    alt: {
      ru: "Спальня шале с двуспальной кроватью 180×200 и окном",
      uz: "Shale yotoqxonasi: 180×200 ikki kishilik karavot va deraza",
      en: "Chalet bedroom with a 180×200 double bed and window",
    },
  },
  chaletBedroomTwin: {
    src: "/images/resort/rooms/chalet-bedroom-twin.jpg",
    localSrc: "/images/resort/rooms/chalet-bedroom-twin.jpg",
    position: "center",
    alt: {
      ru: "Вторая спальня шале с двумя односпальными кроватями 90×200",
      uz: "Shalening ikkinchi yotoqxonasi: ikkita 90×200 bir kishilik karavot",
      en: "Second chalet bedroom with two 90×200 single beds",
    },
  },
  chaletBathroom: {
    src: "/images/resort/rooms/chalet-bathroom.jpg",
    localSrc: "/images/resort/rooms/chalet-bathroom.jpg",
    position: "center",
    alt: {
      ru: "Санузел шале со стеклянной душевой — свой у каждой спальни",
      uz: "Shale sanuzeli shishali dush bilan — har bir yotoqxonada o'zi bor",
      en: "Chalet bathroom with a glass shower — one per bedroom",
    },
  },
  chaletKitchen: {
    src: "/images/resort/rooms/chalet-kitchen.jpg",
    localSrc: "/images/resort/rooms/chalet-kitchen.jpg",
    position: "center",
    alt: {
      ru: "Кухонная зона шале: холодильник, минибар и посуда",
      uz: "Shale oshxona zonasi: muzlatkich, minibar va idishlar",
      en: "Chalet kitchen area: fridge, minibar and crockery",
    },
  },
  /* The ridge, wide, with nothing man-made in frame except a terrace rail.
     Added because every "mountains" image in the gallery set has a topchan or a
     tent somewhere in it, and those were illustrating page heroes. */
  /* hero-ridge.jpg itself has two red-and-white lattice pylons standing in the
     middle of the view and a blurred terrace rail across the bottom — it was
     wrong of this key to point there while heading /place, /contact and every
     legal page. This is the same frame cropped left of the pylons. */
  mountainRidge: {
    src: "/images/resort/hero/hero-ridge-clean.jpg",
    localSrc: "/images/resort/hero/hero-ridge-clean.jpg",
    position: "center",
    alt: {
      ru: "Хребет Чимгана с террасы курорта",
      uz: "Kurort terrasasidan Chimgon tizmasi",
      en: "The Chimgan ridge seen from the resort terrace",
    },
  },
  aframeTerraceView: {
    src: "/images/resort/rooms/aframe-terrace-view.jpg",
    localSrc: "/images/resort/rooms/aframe-terrace-view.jpg",
    position: "center",
    alt: {
      ru: "Вид на горный хребет с террасы домика",
      uz: "Uycha terrasasidan tog' tizmasiga manzara",
      en: "View of the mountain ridge from a cabin terrace",
    },
  },
  aframeLawnWide: {
    src: "/images/resort/rooms/aframe-lawn-wide.jpg",
    localSrc: "/images/resort/rooms/aframe-lawn-wide.jpg",
    position: "center",
    alt: {
      ru: "Ряд домиков A-frame вдоль газона и дорожки",
      uz: "Maysazor va yo'lak bo'ylab A-frame uychalari qatori",
      en: "A row of A-frame cabins along the lawn and walkway",
    },
  },
  aframeBed: {
    src: "/images/resort/rooms/aframe-bed.jpg",
    localSrc: "/images/resort/rooms/aframe-bed.jpg",
    position: "center",
    alt: {
      ru: "Двуспальная кровать под деревянным сводом A-frame",
      uz: "A-frame yog'och gumbazi ostidagi ikki kishilik karavot",
      en: "Double bed under the wooden A-frame vault",
    },
  },
  aframeLounge: {
    src: "/images/resort/rooms/aframe-lounge.jpg",
    localSrc: "/images/resort/rooms/aframe-lounge.jpg",
    position: "center",
    alt: {
      ru: "Зона отдыха в глэмпинге: кресла, столик и телевизор",
      uz: "Glempingdagi dam olish zonasi: kreslolar, stolcha va televizor",
      en: "Glamping seating area: armchairs, side table and TV",
    },
  },
  aframeBathroom: {
    src: "/images/resort/rooms/aframe-bathroom.jpg",
    localSrc: "/images/resort/rooms/aframe-bathroom.jpg",
    position: "center",
    alt: {
      ru: "Собственный санузел в глэмпинге с душем и раковиной",
      uz: "Glempingdagi dush va rakovinali xususiy sanuzel",
      en: "Ensuite glamping bathroom with shower and washbasin",
    },
  },
  aframeMinibar: {
    src: "/images/resort/rooms/aframe-minibar.jpg",
    localSrc: "/images/resort/rooms/aframe-minibar.jpg",
    position: "center",
    alt: {
      ru: "Мини-бар с чайником, посудой и снеками в номере",
      uz: "Xonadagi choynak, idish va gazaklar bilan mini-bar",
      en: "In-room minibar with kettle, cups and snacks",
    },
  },

  galFoodServing: {
    src: "/images/resort/gallery/gal-food-serving.jpg",
    localSrc: "/images/resort/gallery/gal-food-serving.jpg",
    position: "center",
    alt: {
      ru: "Подача шашлыка на территории",
      uz: "Hududda shashlik tortilishi",
      en: "Shashlik being served on the grounds",
    },
  },
  galWaiterPlov: {
    src: "/images/resort/gallery/gal-waiter-plov.jpg",
    localSrc: "/images/resort/gallery/gal-waiter-plov.jpg",
    position: "center",
    alt: {
      ru: "Официант несёт блюда гостям",
      uz: "Ofitsiant mehmonlarga taom olib bormoqda",
      en: "Waiter carrying dishes to guests",
    },
  },
  galMangalFire: {
    src: "/images/resort/gallery/gal-mangal-fire.jpg",
    localSrc: "/images/resort/gallery/gal-mangal-fire.jpg",
    position: "center",
    alt: {
      ru: "Огонь в мангале",
      uz: "Mangaldagi olov",
      en: "Fire in the mangal grill",
    },
  },
  galKazanStone: {
    src: "/images/resort/gallery/gal-kazan-stone.jpg",
    localSrc: "/images/resort/gallery/gal-kazan-stone.jpg",
    position: "center",
    alt: {
      ru: "Казаны, встроенные в каменную печь",
      uz: "Tosh o'choqqa o'rnatilgan qozonlar",
      en: "Kazan pots built into a stone hearth",
    },
  },
  galMountainView: {
    src: "/images/resort/gallery/gal-mountain-view.jpg",
    localSrc: "/images/resort/gallery/gal-mountain-view.jpg",
    position: "center",
    alt: {
      ru: "Вид на зелёные горы с территории",
      uz: "Hududdan yashil tog'larga qarash",
      en: "View of green mountains from the grounds",
    },
  },
  galGreenHills: {
    src: "/images/resort/gallery/gal-green-hills.jpg",
    localSrc: "/images/resort/gallery/gal-green-hills.jpg",
    position: "center",
    alt: {
      ru: "Зелёные холмы Чимгана",
      uz: "Chimg'onning yashil tepaliklari",
      en: "Green hills of Chimgan",
    },
  },
  galKidsSwing: {
    src: "/images/resort/gallery/gal-kids-swing.jpg",
    localSrc: "/images/resort/gallery/gal-kids-swing.jpg",
    position: "center",
    alt: {
      ru: "Качели на детской площадке",
      uz: "Bolalar maydonchasidagi arg'imchoq",
      en: "Swing at the kids playground",
    },
  },
  /* ── August-2026 shoot: the finished pool and the chalets ──────────────
     This block replaces the CGI render set (01–18 + pool.jpg) that used to
     live here. Twenty-eight keys pointed at renderings — the pool, the
     chalets, the entrance, the master plan — and the site sold a place with
     drawings of it. The operator retired them; these are photographs of the
     built property, shot in August 2026, and nothing on the site renders a
     computer image any more.

     Only five of those twenty-eight keys were ever referenced (pool,
     poolAerial, poolLifestyle, poolEvening, tapchanAerial). The other
     twenty-three — entrance, reception, parking, night aerials, padel,
     football, kids, nature — were dead weight pointing at pictures of things
     that either do not exist or were never shown. They are gone rather than
     repointed: a key nothing uses is a trap for the next person, who wires it
     up trusting the name.

     Filenames here say what is in the frame. The old set did not, which is the
     single cause of every image mix-up this site has had. */
  poolPanorama: {
    src: "/images/resort/2026-08/pool-panorama.jpg",
    localSrc: "/images/resort/2026-08/pool-panorama.jpg",
    position: "center",
    alt: {
      ru: "Бассейн с пул-баром под навесом и горы за ним",
      uz: "Soyabon ostidagi pul-bar bilan basseyn va orqasidagi tog'lar",
      en: "The pool with its shaded swim-up bar and the mountains behind",
    },
  },
  poolWideChalets: {
    src: "/images/resort/2026-08/pool-wide-chalets.jpg",
    localSrc: "/images/resort/2026-08/pool-wide-chalets.jpg",
    position: "center",
    alt: {
      ru: "Бассейн, шезлонги и ряд шале за ним",
      uz: "Basseyn, shezlonglar va orqasidagi shale qatori",
      en: "The pool, the loungers and the chalet row behind them",
    },
  },
  poolLoungers: {
    src: "/images/resort/2026-08/pool-loungers.jpg",
    localSrc: "/images/resort/2026-08/pool-loungers.jpg",
    position: "center",
    alt: {
      ru: "Шезлонги и зонты вдоль бортика бассейна",
      uz: "Basseyn cheti bo'ylab shezlonglar va soyabonlar",
      en: "Loungers and parasols along the pool deck",
    },
  },
  poolDeckChalets: {
    src: "/images/resort/2026-08/pool-deck-chalets.jpg",
    localSrc: "/images/resort/2026-08/pool-deck-chalets.jpg",
    position: "center",
    alt: {
      ru: "Шезлонги у бассейна и деревянные шале за ними",
      uz: "Basseyn yonidagi shezlonglar va ular ortidagi yog'och shalelar",
      en: "Poolside loungers with the wooden chalets right behind them",
    },
  },
  poolCurveTall: {
    src: "/images/resort/2026-08/pool-curve-tall.jpg",
    localSrc: "/images/resort/2026-08/pool-curve-tall.jpg",
    position: "center",
    alt: {
      ru: "Изгиб бассейна на фоне холмов",
      uz: "Tepaliklar fonida basseynning egri chizig'i",
      en: "The curve of the pool against the hills",
    },
  },
  poolStepsTall: {
    src: "/images/resort/2026-08/pool-steps-tall.jpg",
    localSrc: "/images/resort/2026-08/pool-steps-tall.jpg",
    position: "center",
    alt: {
      ru: "Пологий вход в воду с поручнем и мозаикой",
      uz: "Ushlagich va mozaikali qulay suvga tushish joyi",
      en: "The shallow entry with its handrail and mosaic",
    },
  },
  poolCabanasSky: {
    src: "/images/resort/2026-08/pool-cabanas-sky.jpg",
    localSrc: "/images/resort/2026-08/pool-cabanas-sky.jpg",
    position: "center",
    alt: {
      ru: "Бунгало у воды под открытым небом",
      uz: "Ochiq osmon ostida suv bo'yidagi bungalolar",
      en: "Bungalows by the water under an open sky",
    },
  },
  poolCabanasValley: {
    src: "/images/resort/2026-08/pool-cabanas-valley.jpg",
    localSrc: "/images/resort/2026-08/pool-cabanas-valley.jpg",
    position: "center",
    alt: {
      ru: "Бунгало у бассейна с видом на долину",
      uz: "Vodiy manzarali basseyn yonidagi bungalolar",
      en: "Poolside bungalows looking out over the valley",
    },
  },
  poolCabanas: {
    src: "/images/resort/2026-08/pool-cabanas.jpg",
    localSrc: "/images/resort/2026-08/pool-cabanas.jpg",
    position: "center",
    alt: {
      ru: "Ряд бунгало у бассейна",
      uz: "Basseyn yonidagi bungalolar qatori",
      en: "The row of bungalows beside the pool",
    },
  },
  poolWater: {
    src: "/images/resort/2026-08/pool-water.jpg",
    localSrc: "/images/resort/2026-08/pool-water.jpg",
    position: "center",
    alt: {
      ru: "Мозаика на дне сквозь прозрачную воду, шезлонги на дальнем бортике",
      uz: "Tiniq suv orqali tubdagi mozaika, narigi chetda shezlonglar",
      en: "The floor mosaic through clear water, loungers on the far deck",
    },
  },
  poolLogoTall: {
    src: "/images/resort/2026-08/pool-logo-tall.jpg",
    localSrc: "/images/resort/2026-08/pool-logo-tall.jpg",
    position: "center",
    alt: {
      ru: "Мозаика CHIMGAN DARBAZA на дне бассейна",
      uz: "Basseyn tubidagi CHIMGAN DARBAZA mozaikasi",
      en: "The CHIMGAN DARBAZA mosaic on the floor of the pool",
    },
  },
  chaletLawn: {
    src: "/images/resort/2026-08/chalet-lawn.jpg",
    localSrc: "/images/resort/2026-08/chalet-lawn.jpg",
    position: "center",
    alt: {
      ru: "Шале и газон на фоне гор",
      uz: "Tog'lar fonida shale va maysazor",
      en: "A chalet and its lawn against the mountains",
    },
  },
  chaletTerrace: {
    src: "/images/resort/2026-08/chalet-terrace.jpg",
    localSrc: "/images/resort/2026-08/chalet-terrace.jpg",
    position: "center",
    alt: {
      ru: "Терраса шале в вечернем свете",
      uz: "Kechki yorug'likda shale terrasasi",
      en: "The chalet terrace in evening light",
    },
  },
  chaletRowTall: {
    src: "/images/resort/2026-08/chalet-row-tall.jpg",
    localSrc: "/images/resort/2026-08/chalet-row-tall.jpg",
    position: "center",
    alt: {
      ru: "Ряд шале вдоль дороги и горы вдали",
      uz: "Yo'l bo'ylab shalelar qatori va uzoqdagi tog'lar",
      en: "The chalet row along the drive, mountains beyond",
    },
  },
  chaletFront: {
    src: "/images/resort/2026-08/chalet-front.jpg",
    localSrc: "/images/resort/2026-08/chalet-front.jpg",
    position: "center",
    alt: {
      ru: "Шале с террасой во всю ширину фасада",
      uz: "Fasadning butun kengligida terrasali shale",
      en: "A chalet with a terrace the full width of its front",
    },
  },
  /**
   * The one licensed stock photograph on this site, and the reason is narrow.
   *
   * There is no usable picture of the kitchen: the two food frames in the June
   * shoot are a member of staff carrying a tray across a construction-era path,
   * and the restaurant building itself was photographed as a bare timber frame
   * with no walls. The card was falling back to the chalet's dining room, which
   * reads as somebody's living room with a television in it.
   *
   * It is a photograph of FOOD, deliberately, not of a room. A stock interior
   * under the heading "our kitchen" would be a picture of somebody else's
   * restaurant passed off as this one — the same substitution the CGI purge
   * just undid, only harder to spot. A plate of plov claims nothing about the
   * building; it says what the kitchen cooks.
   *
   * Source: Unsplash (photo MHt_fHi6a3M), Unsplash License — free for
   * commercial use, no attribution required. Replace it the day the operator
   * shoots the real dining room.
   */
  plovLyagan: {
    src: "/images/resort/stock/plov-lyagan.jpg",
    localSrc: "/images/resort/stock/plov-lyagan.jpg",
    position: "center",
    alt: {
      ru: "Плов на узбекском лягане с помидорами и зеленью",
      uz: "O'zbek lyaganida palov, pomidor va ko'kat bilan",
      en: "Plov on a traditional Uzbek lyagan with tomatoes and herbs",
    },
  },
  chaletPeaks: {
    src: "/images/resort/2026-08/chalet-peaks.jpg",
    localSrc: "/images/resort/2026-08/chalet-peaks.jpg",
    position: "center",
    alt: {
      ru: "Шале под скальным гребнем Чимгана",
      uz: "Chimgonning qoyali tizmasi ostidagi shalelar",
      en: "Chalets beneath the Chimgan rock face",
    },
  },

  /* ── Chalet interiors, operator drop 2026-08-04 ───────────────────────────
   * The first photographs of the inside of a finished chalet that are not from
   * the June set — where the rooms were still being fitted out. All five are
   * portrait 3:4 from a 29-megapixel original; see
   * scripts/import-chalet-interiors.js.
   *
   * They arrived at the right moment: the homepage archive had just been cut
   * to seven frames because every wide exterior was already working somewhere
   * further up the page (see the note on homeGallery). These are the first
   * additions to the usable pool since that arithmetic was written.
   * ────────────────────────────────────────────────────────────────────── */
  chaletHallBeams: {
    src: "/images/resort/chalet-2026-08/chalet-hall-beams.jpg",
    localSrc: "/images/resort/chalet-2026-08/chalet-hall-beams.jpg",
    position: "center",
    alt: {
      ru: "Кухня-зал шале: сводчатый потолок с балками, диван и обеденный стол",
      uz: "Shale oshxona-zali: balkali gumbazsimon shift, divan va ovqatlanish stoli",
      en: "The chalet kitchen-lounge: a beamed vaulted ceiling, sofa and dining table",
    },
  },
  chaletBedroomHall: {
    src: "/images/resort/chalet-2026-08/chalet-bedroom-hall.jpg",
    localSrc: "/images/resort/chalet-2026-08/chalet-bedroom-hall.jpg",
    position: "center",
    alt: {
      ru: "Коридор шале с гардеробом, ведущий в спальню с двуспальной кроватью",
      uz: "Shalening garderobli yo'lagi, ikki kishilik yotoqxonaga olib boradi",
      en: "The chalet hallway and wardrobe, opening onto the double bedroom",
    },
  },
  chaletBedroomTwinHall: {
    src: "/images/resort/chalet-2026-08/chalet-bedroom-twin-hall.jpg",
    localSrc: "/images/resort/chalet-2026-08/chalet-bedroom-twin-hall.jpg",
    position: "center",
    alt: {
      ru: "Вторая спальня шале с раздельными кроватями за стеной гардероба",
      uz: "Shalening alohida karavotli ikkinchi yotoqxonasi, garderob devori ortida",
      en: "The chalet's second bedroom with twin beds, past the wardrobe wall",
    },
  },
  chaletRobes: {
    src: "/images/resort/chalet-2026-08/chalet-robes.jpg",
    localSrc: "/images/resort/chalet-2026-08/chalet-robes.jpg",
    position: "center",
    alt: {
      ru: "Халаты и тапочки в гардеробе шале",
      uz: "Shale garderobidagi xalatlar va shippaklar",
      en: "Bathrobes and slippers in the chalet wardrobe",
    },
  },
  chaletLinenSafe: {
    src: "/images/resort/chalet-2026-08/chalet-linen-safe.jpg",
    localSrc: "/images/resort/chalet-2026-08/chalet-linen-safe.jpg",
    position: "center",
    alt: {
      ru: "Полотенца, вешалки и сейф в гардеробе шале",
      uz: "Shale garderobida sochiqlar, ilgichlar va seyf",
      en: "Towels, hangers and the in-room safe in the chalet wardrobe",
    },
  },

  /* ── A-frame glamping, operator drop 2026-08-04 (second batch) ────────────
   * aframeTerraceRail and aframeGableSky are the first photographs of an
   * A-frame from outside that carry NO construction: no tower crane in the
   * sky, no geotextile on the ground. Every earlier wide exterior did — which
   * is why the glamping room gallery had to open on an interior and the bento
   * mosaic argued the A-frame with a picture of its inside. Both compromises
   * are undone here.
   * ────────────────────────────────────────────────────────────────────── */
  aframeTerraceRail: {
    src: "/images/resort/glamping-2026-08/aframe-terrace-rail.jpg",
    localSrc: "/images/resort/glamping-2026-08/aframe-terrace-rail.jpg",
    position: "center",
    alt: {
      ru: "Терраса домика A-frame с деревянными перилами и панорамной дверью",
      uz: "A-frame uychaning yog'och panjarali va panoramali eshikli terrasasi",
      en: "The A-frame terrace, timber railing and full-height glass doors",
    },
  },
  aframeGableSky: {
    src: "/images/resort/glamping-2026-08/aframe-gable-sky.jpg",
    localSrc: "/images/resort/glamping-2026-08/aframe-gable-sky.jpg",
    position: "center",
    alt: {
      ru: "Треугольный силуэт домика A-frame на фоне неба",
      uz: "Osmon fonida A-frame uychaning uchburchak silueti",
      en: "The A-frame's triangular silhouette against open sky",
    },
  },
  aframeChairsWindow: {
    src: "/images/resort/glamping-2026-08/aframe-chairs-window.jpg",
    localSrc: "/images/resort/glamping-2026-08/aframe-chairs-window.jpg",
    position: "center",
    alt: {
      ru: "Два кресла у панорамного окна в домике A-frame",
      uz: "A-frame uychadagi panoramali deraza yonidagi ikkita kreslo",
      en: "Two armchairs at the panoramic window inside the A-frame",
    },
  },
  aframeBulbs: {
    src: "/images/resort/glamping-2026-08/aframe-bulbs.jpg",
    localSrc: "/images/resort/glamping-2026-08/aframe-bulbs.jpg",
    position: "center",
    alt: {
      ru: "Подвесные лампы под деревянным потолком домика A-frame",
      uz: "A-frame uychaning yog'och shifti ostidagi osma lampalar",
      en: "Pendant bulbs under the A-frame's timber ceiling",
    },
  },
  aframeRobes: {
    src: "/images/resort/glamping-2026-08/aframe-robes.jpg",
    localSrc: "/images/resort/glamping-2026-08/aframe-robes.jpg",
    position: "center",
    alt: {
      ru: "Халаты, полотенца и пледы в шкафу домика A-frame",
      uz: "A-frame uycha shkafida xalatlar, sochiqlar va plyadlar",
      en: "Robes, towels and blankets in the A-frame wardrobe",
    },
  },
  chimganMountains: {
    src: "/images/resort/chimgan.jpg",
    localSrc: "/images/resort/chimgan.jpg",
    position: "center",
    alt: {
      ru: "Горы Чимган рядом с курортом",
      uz: "Kurort yaqinidagi Chimyon tog'lari",
      en: "Chimgan mountains near the resort",
    },
  },
  cableCars: {
    src: "/images/resort/kanatnaya_doroga.jpg",
    localSrc: "/images/resort/kanatnaya_doroga.jpg",
    position: "center",
    alt: {
      ru: "Канатные дороги Чимгана",
      uz: "Chimyon kanat yo'llari",
      en: "Chimgan cable cars",
    },
  },
  mountainWalks: {
    src: "/images/resort/gorniy_progulki.jpg",
    localSrc: "/images/resort/gorniy_progulki.jpg",
    position: "center",
    alt: {
      ru: "Горные прогулки от территории курорта",
      uz: "Kurort hududidan tog' sayrlari",
      en: "Mountain walks from the resort",
    },
  },
  horseRiding: {
    src: "/images/resort/konniy_progulka.webp",
    localSrc: "/images/resort/konniy_progulka.webp",
    position: "center",
    alt: {
      ru: "Конные прогулки в горах",
      uz: "Tog'larda ot minish",
      en: "Horse riding in the mountains",
    },
  },
} satisfies Record<string, ImageAsset>;

/**
 * The full photo archive under the homepage gallery, as keys for <MediaArchive>.
 *
 * This replaces a `galleryImages` array of resolved assets that nothing had
 * imported for some time — the homepage gallery was the six-cell bento mosaic
 * and nothing else, so most of the photography on this site was reachable only
 * from a room page.
 *
 * Order alternates subject and shape deliberately: eleven pool frames in a row
 * read as one photo repeated.
 *
 * 2026-08-04 — this list is now the homepage's REMAINDER, not its superset.
 * It used to hold 31 keys and repeated all twelve frames of the photo strip
 * and six of the eight bento cells, so a guest scrolling the page met the same
 * photographs three times. The operator called it: "что в этой зоне, что в
 * этой зоне — разные фотографии, пусть чтобы дублей не было."
 *
 * So the rule for this file is now: a photo belongs to exactly ONE homepage
 * surface. The premium surfaces pick first — hero, photo strip, pool band,
 * bento mosaic, editorial frames, room and service cards, the five-frame day
 * strip — and whatever is left lands here.
 *
 * Which is why this list is short, and interiors at that. The homepage has 38
 * photo slots above this block, and the repo holds only so many frames that
 * are fit to show — the archive gets the difference. There is no arrangement
 * that fills a large archive AND keeps every frame unique; the shortfall is
 * photography, not layout.
 *
 * That is also why it grew from 7 to 12 on the same day it was written: the
 * operator sent five chalet interiors, one of which (chaletHallBeams) was good
 * enough to take the editorial block off chaletLounge, freeing that frame down
 * here as well. A shoot grows this block and nothing else has to move.
 *
 * The full split lives in `scripts/check-home-photos.js`, which fails if any
 * key ends up on two homepage surfaces.
 */
export const homeGallery = [
  "aframeTerraceRail",
  "chaletBedroomHall",
  "aframeChairsWindow",
  "galTopchanInside",
  "chaletRobes",
  "aframeBulbs",
  "chaletBedroomDouble",
  "aframeMinibar",
  "chaletLounge",
  "aframeRoom",
  "galKazanStone",
  "chaletBedroomTwinHall",
  "aframeRobes",
  "chaletBathroom",
  "chaletLinenSafe",
  "aframeBathroom",
  "cableCars",
] as const satisfies readonly (keyof typeof resortImages)[];

/*
 * Deliberately NOT in the list above, though the files exist and no homepage
 * surface has claimed them:
 *   galMountainView — a grey topchan tent on unlandscaped earth fills the left
 *                     third; it was pulled from the /services cards for that.
 *   galGreenHills   — an empty hillside with nothing of the resort in it.
 *   galKidsSwing    — a stranger on a swing looking at his phone.
 *   galFoodServing  — a hand carrying a plate over bare ground.
 *   galWaiterPlov   — a man carrying a lagman down a half-finished path, with
 *                     turned earth along the right-hand side.
 *   aframeExterior, aframeLawn, aframeLawnTall, aframeLawnWide — a tower crane
 *                     stands in the sky above the roofline, or the ground is
 *                     still geotextile and sand.
 * Each was removed from a surface once already for a stated reason, or carries
 * construction the operator has asked us to stop showing. Adding them back here
 * would quietly undo that, so they stay out. They remain registered because the
 * room-page galleries and /place still use some of them in context.
 */
