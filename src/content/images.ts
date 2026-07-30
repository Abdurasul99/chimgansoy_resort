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
  /* Wide banner cut of the lawn frame. Points at the hero file on purpose —
     same 1800px asset, already cached by the homepage, and it displays at
     ≤1440px so the browser downscales rather than stretching it. */
  aframeLawnBanner: {
    src: "/images/resort/hero/hero-lawn.jpg",
    localSrc: "/images/resort/hero/hero-lawn.jpg",
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
  hero: {
    src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2400&q=85",
    localSrc: "/images/resort/01-aerial-masterplan-day.jpg",
    position: "center",
    alt: {
      ru: "Вид сверху на территорию CHIMGAN DARBAZA",
      uz: "CHIMGAN DARBAZA hududining yuqoridan ko'rinishi",
      en: "Aerial view of CHIMGAN DARBAZA territory",
    },
  },
  territoryAerial: {
    src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=85",
    localSrc: "/images/resort/02-aerial-full-territory.jpg",
    position: "center",
    alt: {
      ru: "Общая панорама курортной территории",
      uz: "Kurort hududining umumiy panoramasi",
      en: "Wide panorama of the resort grounds",
    },
  },
  restaurantBuilding: {
    src: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/03-reception-restaurant-day.jpg",
    position: "center",
    alt: {
      ru: "Ресторан и reception на территории курорта",
      uz: "Kurort hududidagi restoran va reception",
      en: "Restaurant and reception on the resort territory",
    },
  },
  tapchanAerial: {
    src: "https://images.unsplash.com/photo-1529290130-4ca3753253ae?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/04-tapchan-zone-aerial.jpg",
    position: "center",
    alt: {
      ru: "Топчан-зона и зоны отдыха на природе",
      uz: "Topchan hududi va tabiatdagi dam olish zonalari",
      en: "Tapchan and open-air lounge zones",
    },
  },
  sportParking: {
    src: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/05-sport-parking-aerial.jpg",
    position: "center",
    alt: {
      ru: "Спортивные площадки и парковка курорта",
      uz: "Kurort sport maydonlari va parkingi",
      en: "Resort sport courts and parking",
    },
  },
  poolEvening: {
    src: "https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=2200&q=85",
    localSrc: "/images/resort/06-pool-evening-lifestyle.jpg",
    position: "center",
    alt: {
      ru: "Вечерний бассейн с видом на горы",
      uz: "Tog' manzarali kechki basseyn",
      en: "Evening pool with mountain views",
    },
  },
  glamping: {
    src: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/07-aframe-glamping-evening.jpg",
    position: "center",
    alt: {
      ru: "A-frame глэмпинг вечером",
      uz: "Kechki A-frame glemping",
      en: "A-frame glamping in the evening",
    },
  },
  cottage: {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/08-cottage-evening-mountains.jpg",
    position: "center",
    alt: {
      ru: "Коттеджи вечером на фоне гор",
      uz: "Tog' fonidagi kechki kottejlar",
      en: "Evening cottages against the mountains",
    },
  },
  nightHero: {
    src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2400&q=85",
    localSrc: "/images/resort/09-aerial-night-masterplan.jpg",
    position: "center",
    alt: {
      ru: "Вечерний вид сверху на курорт",
      uz: "Kurortning kechki yuqoridan ko'rinishi",
      en: "Evening aerial view of the resort",
    },
  },
  entranceNight: {
    src: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/10-entrance-night-surpa.jpg",
    position: "center",
    alt: {
      ru: "Вечерний въезд в курорт",
      uz: "Kurortga kechki kirish qismi",
      en: "Evening entrance to the resort",
    },
  },
  parkingDay: {
    src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/11-ev-parking-day.jpg",
    position: "center",
    alt: {
      ru: "Парковка и въездная зона днем",
      uz: "Kunduzgi parking va kirish zonasi",
      en: "Daytime parking and entrance area",
    },
  },
  entranceDay: {
    src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/12-entrance-day-surpa.jpg",
    position: "center",
    alt: {
      ru: "Дневной въезд и фасад комплекса",
      uz: "Majmuaning kunduzgi kirish qismi va fasadi",
      en: "Daytime entrance and facade of the complex",
    },
  },
  receptionDay: {
    src: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/13-reception-day.jpg",
    position: "center",
    alt: {
      ru: "Здание reception и ландшафт курорта",
      uz: "Reception binosi va kurort landshafti",
      en: "Reception building and resort landscaping",
    },
  },
  glampingDay: {
    src: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/14-aframe-glamping-day.jpg",
    position: "center",
    alt: {
      ru: "A-frame глэмпинг днем",
      uz: "Kunduzgi A-frame glemping",
      en: "A-frame glamping during the day",
    },
  },
  pool: {
    src: "https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/pool.jpg",
    position: "center",
    alt: {
      ru: "Бассейн-лагуна с баром у воды и шезлонгами",
      uz: "Suv ichidagi bar va shezlonglar bilan laguna-basseyn",
      en: "Lagoon pool with a swim-up bar and loungers",
    },
  },
  poolAerial: {
    src: "https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/15-pool-aerial.jpg",
    position: "center",
    alt: {
      ru: "Бассейн с высоты — вид на территорию курорта",
      uz: "Basseyn — yuqoridan, kurort hududi ko'rinishi",
      en: "Pool from above — resort territory view",
    },
  },
  poolLifestyle: {
    src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/16-pool-day-lifestyle.jpg",
    position: "center",
    alt: {
      ru: "Дневной отдых у бассейна",
      uz: "Basseyn yonidagi kunduzgi dam olish",
      en: "Daytime rest by the pool",
    },
  },
  workoutPadel: {
    src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/17-workout-padel-zone.jpg",
    position: "center",
    alt: {
      ru: "Workout и padel-зона",
      uz: "Workout va padel hududi",
      en: "Workout and padel zone",
    },
  },
  cottageDay: {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/18-cottage-day-mountains.jpg",
    position: "center",
    alt: {
      ru: "Коттеджи днем с видом на горы",
      uz: "Tog' manzarali kunduzgi kottejlar",
      en: "Daytime cottages with mountain views",
    },
  },
  tapchan: {
    src: "https://images.unsplash.com/photo-1529290130-4ca3753253ae?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/04-tapchan-zone-aerial.jpg",
    position: "center",
    alt: {
      ru: "Зона отдыха с топчанами",
      uz: "Topchanli dam olish hududi",
      en: "Relaxing tapchan lounge area",
    },
  },
  picnic: {
    src: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/04-tapchan-zone-aerial.jpg",
    position: "center",
    alt: {
      ru: "Пикник-зона на открытой территории",
      uz: "Ochiq hududdagi piknik zonasi",
      en: "Open-air picnic zone",
    },
  },
  restaurant: {
    src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/03-reception-restaurant-day.jpg",
    position: "center",
    alt: {
      ru: "Ресторан курорта",
      uz: "Kurort restorani",
      en: "Resort restaurant",
    },
  },
  activity: {
    src: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/02-aerial-full-territory.jpg",
    position: "center",
    alt: {
      ru: "Маршруты и активности вокруг курорта",
      uz: "Kurort atrofidagi marshrutlar va faoliyatlar",
      en: "Routes and activities around the resort",
    },
  },
  tubing: {
    src: "https://images.unsplash.com/photo-1489674267075-cee793167910?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/09-aerial-night-masterplan.jpg",
    position: "center",
    alt: {
      ru: "Тюбинг-трасса и зимняя активность",
      uz: "Tubing trassasi va qishki faoliyat",
      en: "Tubing track and winter activity",
    },
  },
  sport: {
    src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/17-workout-padel-zone.jpg",
    position: "center",
    alt: {
      ru: "Спортивная зона на свежем воздухе",
      uz: "Ochiq havodagi sport hududi",
      en: "Outdoor workout zone",
    },
  },
  padel: {
    src: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/05-sport-parking-aerial.jpg",
    position: "center",
    alt: {
      ru: "Padel-корты",
      uz: "Padel kortlari",
      en: "Padel courts",
    },
  },
  kids: {
    src: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/02-aerial-full-territory.jpg",
    position: "center",
    alt: {
      ru: "Семейная зона для детей",
      uz: "Bolalar uchun oilaviy hudud",
      en: "Family zone for children",
    },
  },
  football: {
    src: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/05-sport-parking-aerial.jpg",
    position: "center",
    alt: {
      ru: "Мини-футбольное поле",
      uz: "Mini futbol maydoni",
      en: "Mini football field",
    },
  },
  grill: {
    src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1800&q=85",
    localSrc: "/images/resort/04-tapchan-zone-aerial.jpg",
    position: "center",
    alt: {
      ru: "Зона гриля и казана",
      uz: "Gril va qozon hududi",
      en: "Grill and kazan cooking zone",
    },
  },
  nature: {
    src: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2200&q=85",
    localSrc: "/images/resort/02-aerial-full-territory.jpg",
    position: "center",
    alt: {
      ru: "Зеленая территория курорта",
      uz: "Kurortning yashil hududi",
      en: "Green resort territory",
    },
  },
  mountains: {
    src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2200&q=85",
    localSrc: "/images/resort/18-cottage-day-mountains.jpg",
    position: "center",
    alt: {
      ru: "Горный пейзаж Ташкентской области",
      uz: "Toshkent viloyatining tog' manzarasi",
      en: "Mountain landscape of Tashkent region",
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

// Real June-2026 photography only. The render set (01–18 + pool.jpg) is
// reserved for the clearly-labelled "master plan" section, never the main gallery.
export const galleryImages = [
  resortImages.galTerritoryPanorama,
  resortImages.galTopchanPeaks,
  resortImages.galTopchanRow,
  resortImages.galMangalFire,
  resortImages.galWaiterPlov,
  resortImages.aframeLawnTall,
  resortImages.galMountainView,
  resortImages.galTopchanSwing,
  resortImages.galKazanStone,
  resortImages.galFoodServing,
  resortImages.galGreenHills,
  resortImages.galPathway,
  resortImages.galKidsSwing,
];
