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
 * read as one photo repeated. The August shoot leads because it is the newest
 * and the only footage of the finished pool.
 */
export const homeGallery = [
  "poolPanorama",
  "chaletPeaks",
  "poolLogoTall",
  "chaletLawn",
  "poolCabanasValley",
  "chaletRowTall",
  "poolStepsTall",
  "chaletTerrace",
  "poolWideChalets",
  "chaletFront",
  "poolCurveTall",
  "poolCabanasSky",
  "poolLoungers",
  "poolDeckChalets",
  "poolWater",
  "poolCabanas",
  "galTerritoryPanorama",
  "galTopchanPeaks",
  "galTopchanRow",
  "aframeLawnTall",
  "aframeTerraceView",
  "aframeRoom",
  "aframeLawnWide",
  "chaletLounge",
  "chaletDining",
  "galTopchanInside",
  "galTopchanSwing",
  "galMangalFire",
  "galKazanStone",
  "galWaiterPlov",
  "galPathway",
] as const satisfies readonly (keyof typeof resortImages)[];

/*
 * Deliberately NOT in the list above, though the files exist:
 *   galMountainView — a grey topchan tent on unlandscaped earth fills the left
 *                     third; it was pulled from the /services cards for that.
 *   galGreenHills   — an empty hillside with nothing of the resort in it.
 *   galKidsSwing    — a stranger on a swing looking at his phone.
 *   galFoodServing  — a hand carrying a plate over bare ground.
 * Each was removed from a surface once already for a stated reason. Adding them
 * back here would quietly undo that, so they stay out.
 */
