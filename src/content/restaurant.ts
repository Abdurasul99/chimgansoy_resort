import type { Locale } from "@/i18n/config";
import type { OrderMode, OrderStatus, TableStatus } from "@/lib/restaurant/model";

/**
 * Тексты раздела ресторана — все три языка в одном месте.
 *
 * Типизированный Record<Locale, …>: забытый перевод не соберётся. Названия,
 * описания блюд, часы и баннер открытия — не здесь, их оператор меняет в
 * админке; здесь только интерфейс.
 *
 * Правило, которое держат все тексты: сайт принимает ЗАЯВКУ, а не
 * гарантированный заказ (ТЗ, п. 9). Состав, время и стоимость подтверждает
 * ресторан — ни одна строка не обещает «готово через 30 минут».
 */

type ModeCopy = { title: string; short: string; hint: string };

export type RestaurantCopy = {
  navLabel: string;
  eyebrow: string;
  actions: {
    menu: { title: string; text: string };
    tables: { title: string; text: string };
    delivery: { title: string; text: string };
    room: { title: string; text: string };
  };
  hours: string;
  hoursUnknown: string;
  openNow: string;
  closedNow: string;
  byPhone: string;
  phone: string;
  howTitle: string;
  howSteps: { title: string; text: string }[];
  closedBanner: string;
  hiddenPreview: string;
  previewExit: string;
  teaserEyebrow: string;
  teaserTitle: string;
  teaserCta: string;
  teaserEmpty: string;
  marquee: string[];
  fireTitle: string;
  fireText: string;
  roomNoteTitle: string;
  roomNote: string;
  menu: {
    eyebrow: string;
    title: string;
    lead: string;
    search: string;
    all: string;
    empty: string;
    emptyFiltered: string;
    nothingFound: string;
    unavailable: string;
    preorder: string;
    preorderHint: string;
    add: string;
    inCart: string;
    close: string;
    channels: string;
    notHere: string;
    count: (n: number) => string;
    checkout: string;
    viewCart: string;
  };
  modes: Record<OrderMode, ModeCopy>;
  channelNames: { hall: string; takeaway: string; delivery: string; room: string };
  checkout: {
    eyebrow: string;
    title: string;
    lead: string;
    cart: string;
    empty: string;
    emptyText: string;
    toMenu: string;
    remove: string;
    how: string;
    modeClosed: string;
    contacts: string;
    name: string;
    namePh: string;
    fullName: string;
    phone: string;
    locality: string;
    localityPh: string;
    address: string;
    addressPh: string;
    unitType: string;
    unitNo: string;
    unitNoPh: string;
    guests: string;
    when: string;
    asap: string;
    scheduled: string;
    date: string;
    time: string;
    noSlots: string;
    comment: string;
    commentPh: string;
    dishes: string;
    fee: Record<"delivery" | "room", string>;
    feePending: string;
    free: string;
    total: string;
    totalPending: string;
    consent: { before: string; link: string; after: string };
    notice: string;
    breakfastNote: string;
    submit: string;
    sending: string;
    failed: string;
    problemsTitle: string;
    removeAll: string;
    testNote: string;
  };
  tables: {
    eyebrow: string;
    title: string;
    lead: string;
    date: string;
    time: string;
    adults: string;
    kids: string;
    comment: string;
    commentPh: string;
    submit: string;
    sending: string;
    note: string;
    closed: string;
    failed: string;
  };
  status: {
    order: string;
    table: string;
    placed: string;
    mode: string;
    when: string;
    confirmedAt: string;
    items: string;
    total: string;
    feePending: string;
    guests: string;
    contact: string;
    refresh: string;
    again: string;
    reason: string;
    order_labels: Record<OrderStatus, { title: string; text: string }>;
    table_labels: Record<TableStatus, { title: string; text: string }>;
    steps: string[];
    tableSteps: string[];
    test: string;
    keepLink: string;
    again_note: string;
  };
  errors: {
    name: string;
    phone: string;
    phoneInvalid: string;
    cart: string;
    closed: string;
    modeClosed: string;
    locality: string;
    address: string;
    unit: string;
    guests: string;
    consent: string;
    tooMany: string;
    failed: string;
    time: Record<"required" | "invalid" | "past" | "too_far" | "closed" | "hours" | "lead", string>;
    problem: Record<"missing" | "unavailable" | "preorder_only" | "channel" | "no_price", string>;
    tablesClosed: string;
    adults: string;
    priceChanged: string;
  };
};

export const restaurantCopy: Record<Locale, RestaurantCopy> = {
  ru: {
    navLabel: "Ресторан",
    eyebrow: "Ресторан в горах · 1700 м",
    actions: {
      menu: { title: "Посмотреть меню", text: "Блюда, порции и цены — выберите и соберите заказ" },
      tables: { title: "Забронировать стол", text: "Дата, время и сколько вас — администратор подтвердит" },
      delivery: { title: "Заказать доставку", text: "Привезём по согласованному адресу — зону подтвердит менеджер" },
      room: { title: "Заказать в номер", text: "Подача в A-frame и Chalet для гостей комплекса" },
    },
    hours: "Часы работы",
    hoursUnknown: "Часы работы уточняйте у администратора",
    openNow: "Открыто сейчас",
    closedNow: "Сейчас закрыто",
    byPhone: "по телефону",
    phone: "Телефон ресторана",
    howTitle: "Как это работает",
    howSteps: [
      { title: "Выберите блюда", text: "Меню с ценами и порциями — прямо на сайте" },
      { title: "Отправьте заявку", text: "Самовывоз, доставка, в номер или к визиту" },
      { title: "Ресторан подтвердит", text: "Менеджер уточнит состав, время и оплату" },
    ],
    closedBanner: "Приём заказов на сайте откроется совсем скоро. Меню уже можно посмотреть.",
    hiddenPreview: "Предпросмотр: раздел скрыт от гостей. Заказы отсюда помечаются как тестовые.",
    previewExit: "Выйти из предпросмотра",
    teaserEyebrow: "Меню",
    teaserTitle: "Что сегодня на кухне",
    teaserCta: "Открыть всё меню",
    teaserEmpty: "Меню скоро появится здесь — кухня уже готовит список.",
    marquee: ["Огонь", "Казан", "Мангал", "Горный воздух", "Долгий ужин", "Чай с видом", "1700 м"],
    fireTitle: "Живой огонь и горный воздух",
    fireText: "Мангал, казан и неспешный ужин с видом на Чимган. Закажите к столу, заберите с собой или попросите принести к домику.",
    roomNoteTitle: "Для гостей комплекса",
    roomNote: "Заказ в номер — это платные блюда из меню ресторана. Завтрак, включённый в проживание, и питание по тарифу «Всё включено» заказываются у администратора и сюда не входят.",
    menu: {
      eyebrow: "Меню ресторана",
      title: "Меню",
      lead: "Выберите блюда и способ получения. Сумма — предварительная: состав и стоимость подтвердит ресторан.",
      search: "Найти блюдо",
      all: "Все блюда",
      empty: "Меню скоро появится — кухня уже готовит список блюд.",
      emptyFiltered: "Под этот способ получения блюд нет — выберите другой.",
      nothingFound: "Ничего не нашлось — попробуйте другое слово.",
      unavailable: "Временно нет",
      preorder: "По предзаказу",
      preorderHint: "Только предзаказом к визиту",
      add: "В корзину",
      inCart: "в корзине",
      close: "Закрыть",
      channels: "Можно заказать",
      notHere: "Не подаётся этим способом",
      count: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "позиция" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "позиции" : "позиций"}`,
      checkout: "Оформить",
      viewCart: "Корзина",
    },
    modes: {
      takeaway: { title: "Самовывоз", short: "С собой", hint: "Заберёте сами — время готовности подтвердит сотрудник" },
      delivery: { title: "Доставка", short: "Доставка", hint: "Привезём по адресу — зону и стоимость подтвердит менеджер" },
      room: { title: "В номер", short: "В номер", hint: "Для гостей A-frame и Chalet — проживание сверит сотрудник" },
      preorder: { title: "К визиту", short: "К визиту", hint: "Блюда будут готовы к вашему приходу в ресторан" },
    },
    channelNames: { hall: "В зале", takeaway: "С собой", delivery: "Доставка", room: "В номер" },
    checkout: {
      eyebrow: "Оформление",
      title: "Ваш заказ",
      lead: "Проверьте блюда, выберите способ получения и оставьте контакты — ресторан свяжется для подтверждения.",
      cart: "Корзина",
      empty: "Корзина пуста",
      emptyText: "Добавьте блюда из меню — и возвращайтесь сюда.",
      toMenu: "Перейти в меню",
      remove: "Убрать",
      how: "Как получить",
      modeClosed: "сейчас не принимается",
      contacts: "Контакты",
      name: "Ваше имя",
      namePh: "Как к вам обращаться",
      fullName: "Имя и фамилия",
      phone: "Телефон",
      locality: "Населённый пункт или ориентир",
      localityPh: "Например: Чимган, санаторий «…»",
      address: "Адрес",
      addressPh: "Улица, дом, подъезд — чтобы курьер нашёл",
      unitType: "Домик",
      unitNo: "Номер домика",
      unitNoPh: "Например: 7",
      guests: "Сколько гостей",
      when: "Когда",
      asap: "Как можно скорее",
      scheduled: "Ко времени",
      date: "Дата",
      time: "Время",
      noSlots: "На эту дату свободного времени нет — выберите другую",
      comment: "Комментарий",
      commentPh: "Без лука, приборы на троих, позвонить за 10 минут…",
      dishes: "Блюда",
      fee: { delivery: "Доставка", room: "Подача в номер" },
      feePending: "уточнит менеджер",
      free: "бесплатно",
      total: "Предварительно",
      totalPending: "+ сбор, который подтвердит менеджер",
      consent: {
        before: "Я даю согласие на обработку персональных данных в соответствии с ",
        link: "Политикой конфиденциальности",
        after: ".",
      },
      notice: "Это заявка, а не оплата. Ресторан подтвердит наличие, состав, время и стоимость по телефону. Пока нет подтверждения — заказ не принят.",
      breakfastNote: "Завтрак, включённый в проживание, и питание по тарифу «Всё включено» сюда не входят — их заказывают у администратора.",
      submit: "Отправить заказ",
      sending: "Отправляем…",
      failed: "Не удалось отправить. Проверьте связь и нажмите ещё раз — повтор не создаст второй заказ.",
      problemsTitle: "Эти блюда нельзя заказать выбранным способом:",
      removeAll: "Убрать их из корзины",
      testNote: "Предпросмотр: заказ будет помечен как тестовый.",
    },
    tables: {
      eyebrow: "Бронь стола",
      title: "Забронировать стол",
      lead: "Выберите дату, время и число гостей. Администратор проверит свободные столы и перезвонит.",
      date: "Дата",
      time: "Время",
      adults: "Взрослые",
      kids: "Дети",
      comment: "Комментарий",
      commentPh: "Повод, пожелания по месту, детский стул…",
      submit: "Отправить заявку",
      sending: "Отправляем…",
      note: "Заявка получена — это ещё не бронь. Стол закреплён только после подтверждения администратором.",
      closed: "Бронь столов на сайте откроется вместе с рестораном. Пока — по телефону.",
      failed: "Не удалось отправить. Проверьте связь и нажмите ещё раз — повтор не создаст вторую заявку.",
    },
    status: {
      order: "Заказ",
      table: "Бронь стола",
      placed: "Оформлен",
      mode: "Способ",
      when: "Желаемое время",
      confirmedAt: "Подтверждённое время",
      items: "Состав",
      total: "Итого",
      feePending: "+ сбор, который подтвердит менеджер",
      guests: "Гостей",
      contact: "Вопросы по заказу",
      refresh: "Страница обновляется сама",
      again: "Заказать ещё",
      reason: "Причина",
      order_labels: {
        new: { title: "Заявка получена", text: "Ресторан ещё не принял заказ — менеджер скоро перезвонит и подтвердит состав, время и стоимость." },
        confirmed: { title: "Заказ подтверждён", text: "Ресторан принял заказ. Если что-то изменится — вам позвонят." },
        cooking: { title: "Готовится", text: "Кухня уже работает над вашим заказом." },
        ready: { title: "Готов", text: "Заказ готов — его выдают или уже везут к вам." },
        done: { title: "Выполнен", text: "Приятного аппетита! Будем рады видеть вас снова." },
        cancelled: { title: "Заказ отменён", text: "Если это ошибка — позвоните в ресторан." },
      },
      table_labels: {
        new: { title: "Заявка получена", text: "Бронь ещё не действует — администратор проверит свободные столы и перезвонит." },
        confirmed: { title: "Стол забронирован", text: "Администратор подтвердил бронь. Ждём вас!" },
        declined: { title: "Не удалось подтвердить", text: "На это время свободного стола нет. Позвоните — подберём другое время." },
        cancelled: { title: "Бронь отменена", text: "Если это ошибка — позвоните в ресторан." },
        done: { title: "Визит состоялся", text: "Спасибо, что были у нас!" },
      },
      steps: ["Получен", "Подтверждён", "Готовится", "Готов", "Выполнен"],
      tableSteps: ["Получена", "Подтверждена", "Визит"],
      test: "Тестовый заказ — ресторан его не готовит",
      keepLink: "Сохраните эту страницу — по ней видно, что с заказом.",
      again_note: "Эта заявка уже была получена раньше. Если вы что-то поменяли после первой отправки — скажите менеджеру, когда он позвонит.",
    },
    errors: {
      name: "Укажите имя",
      phone: "Укажите номер телефона",
      phoneInvalid: "Проверьте номер телефона — например, +998 90 123 45 67",
      cart: "Корзина пуста — добавьте блюда из меню",
      closed: "Ресторан пока не принимает заказы на сайте",
      modeClosed: "Этот способ получения сейчас не принимается — выберите другой",
      locality: "Укажите населённый пункт или ориентир",
      address: "Укажите адрес доставки",
      unit: "Укажите домик и его номер",
      guests: "Укажите, сколько будет гостей",
      consent: "Подтвердите согласие на обработку персональных данных",
      tooMany: "Слишком много заявок подряд. Подождите несколько минут или позвоните нам.",
      failed: "Не удалось сохранить заказ. Позвоните нам:",
      time: {
        required: "Выберите дату и время",
        invalid: "Проверьте дату и время",
        past: "Это время уже прошло или слишком близко — выберите позже",
        too_far: "Так далеко вперёд заказ не принимается — выберите дату ближе",
        closed: "Сейчас кухня не работает — выберите время",
        hours: "Это время вне часов работы ресторана",
        lead: "Предзаказ принимается заранее — выберите время позже",
      },
      problem: {
        missing: "больше нет в меню",
        unavailable: "временно нет",
        preorder_only: "только по предзаказу к визиту",
        channel: "не подаётся этим способом",
        no_price: "цена уточняется",
      },
      tablesClosed: "Бронь столов на сайте пока не принимается — позвоните нам",
      adults: "Укажите число гостей — от 1 до 40",
      priceChanged: "Пока вы оформляли, ресторан обновил цены. Проверьте новую сумму и отправьте ещё раз.",
    },
  },

  uz: {
    navLabel: "Restoran",
    eyebrow: "Tog'dagi restoran · 1700 m",
    actions: {
      menu: { title: "Menyuni ko'rish", text: "Taomlar, porsiyalar va narxlar — tanlang va buyurtma yig'ing" },
      tables: { title: "Stol band qilish", text: "Sana, vaqt va necha kishi — administrator tasdiqlaydi" },
      delivery: { title: "Yetkazib berish", text: "Kelishilgan manzilga olib boramiz — hududni menejer tasdiqlaydi" },
      room: { title: "Uychaga buyurtma", text: "Majmua mehmonlari uchun A-frame va Chalet'ga xizmat" },
    },
    hours: "Ish vaqti",
    hoursUnknown: "Ish vaqtini administratordan aniqlang",
    openNow: "Hozir ochiq",
    closedNow: "Hozir yopiq",
    byPhone: "telefon orqali",
    phone: "Restoran telefoni",
    howTitle: "Qanday ishlaydi",
    howSteps: [
      { title: "Taomlarni tanlang", text: "Narx va porsiyalar bilan menyu — to'g'ridan-to'g'ri saytda" },
      { title: "Ariza yuboring", text: "Olib ketish, yetkazib berish, uychaga yoki tashrifga" },
      { title: "Restoran tasdiqlaydi", text: "Menejer tarkib, vaqt va to'lovni aniqlaydi" },
    ],
    closedBanner: "Saytda buyurtma qabul qilish tez orada ochiladi. Menyuni hozirdan ko'rish mumkin.",
    hiddenPreview: "Oldindan ko'rish: bo'lim mehmonlardan yashirin. Bu yerdan buyurtmalar test sifatida belgilanadi.",
    previewExit: "Oldindan ko'rishdan chiqish",
    teaserEyebrow: "Menyu",
    teaserTitle: "Bugun oshxonada nima bor",
    teaserCta: "Butun menyuni ochish",
    teaserEmpty: "Menyu tez orada shu yerda paydo bo'ladi — oshxona ro'yxatni tayyorlamoqda.",
    marquee: ["Olov", "Qozon", "Mangal", "Tog' havosi", "Shoshilmas kechki ovqat", "Manzarali choy", "1700 m"],
    fireTitle: "Jonli olov va tog' havosi",
    fireText: "Mangal, qozon va Chimgon manzarasi bilan shoshilmasdan kechki ovqat. Stolga buyurtma bering, olib keting yoki uychangizga keltirishni so'rang.",
    roomNoteTitle: "Majmua mehmonlari uchun",
    roomNote: "Uychaga buyurtma — restoran menyusidagi pullik taomlar. Yashashga kiritilgan nonushta va «Hammasi kiritilgan» tarifidagi ovqatlar administrator orqali buyurtma qilinadi va bu yerga kirmaydi.",
    menu: {
      eyebrow: "Restoran menyusi",
      title: "Menyu",
      lead: "Taomlarni va olish usulini tanlang. Summa taxminiy: tarkib va narxni restoran tasdiqlaydi.",
      search: "Taom qidirish",
      all: "Barcha taomlar",
      empty: "Menyu tez orada paydo bo'ladi — oshxona taomlar ro'yxatini tayyorlamoqda.",
      emptyFiltered: "Bu olish usuli uchun taom yo'q — boshqasini tanlang.",
      nothingFound: "Hech narsa topilmadi — boshqa so'z bilan qidiring.",
      unavailable: "Vaqtincha yo'q",
      preorder: "Oldindan buyurtma",
      preorderHint: "Faqat tashrifga oldindan buyurtma",
      add: "Savatga",
      inCart: "savatda",
      close: "Yopish",
      channels: "Buyurtma qilish mumkin",
      notHere: "Bu usulda berilmaydi",
      count: (n) => `${n} ta taom`,
      checkout: "Buyurtma",
      viewCart: "Savat",
    },
    modes: {
      takeaway: { title: "Olib ketish", short: "Olib ketish", hint: "O'zingiz olib ketasiz — tayyor bo'lish vaqtini xodim tasdiqlaydi" },
      delivery: { title: "Yetkazib berish", short: "Yetkazish", hint: "Manzilga olib boramiz — hudud va narxni menejer tasdiqlaydi" },
      room: { title: "Uychaga", short: "Uychaga", hint: "A-frame va Chalet mehmonlari uchun — yashashni xodim tekshiradi" },
      preorder: { title: "Tashrifga", short: "Tashrifga", hint: "Taomlar restoranga kelishingizga tayyor bo'ladi" },
    },
    channelNames: { hall: "Zalda", takeaway: "Olib ketish", delivery: "Yetkazish", room: "Uychaga" },
    checkout: {
      eyebrow: "Rasmiylashtirish",
      title: "Buyurtmangiz",
      lead: "Taomlarni tekshiring, olish usulini tanlang va aloqa ma'lumotlarini qoldiring — restoran tasdiqlash uchun bog'lanadi.",
      cart: "Savat",
      empty: "Savat bo'sh",
      emptyText: "Menyudan taom qo'shing — va shu yerga qayting.",
      toMenu: "Menyuga o'tish",
      remove: "Olib tashlash",
      how: "Qanday olasiz",
      modeClosed: "hozir qabul qilinmaydi",
      contacts: "Aloqa",
      name: "Ismingiz",
      namePh: "Sizga qanday murojaat qilaylik",
      fullName: "Ism va familiya",
      phone: "Telefon",
      locality: "Aholi punkti yoki mo'ljal",
      localityPh: "Masalan: Chimgon, «…» sanatoriysi",
      address: "Manzil",
      addressPh: "Ko'cha, uy, podyezd — kuryer topishi uchun",
      unitType: "Uycha",
      unitNo: "Uycha raqami",
      unitNoPh: "Masalan: 7",
      guests: "Necha mehmon",
      when: "Qachon",
      asap: "Iloji boricha tezroq",
      scheduled: "Vaqtga",
      date: "Sana",
      time: "Vaqt",
      noSlots: "Bu sanada bo'sh vaqt yo'q — boshqasini tanlang",
      comment: "Izoh",
      commentPh: "Piyozsiz, uch kishilik anjom, 10 daqiqa oldin qo'ng'iroq qiling…",
      dishes: "Taomlar",
      fee: { delivery: "Yetkazib berish", room: "Uychaga xizmat" },
      feePending: "menejer aniqlaydi",
      free: "bepul",
      total: "Taxminan",
      totalPending: "+ menejer tasdiqlaydigan to'lov",
      consent: { before: "Shaxsiy ma’lumotlarimni ", link: "Maxfiylik siyosati", after: "ga muvofiq qayta ishlashga roziman." },
      notice: "Bu ariza, to'lov emas. Restoran mavjudlik, tarkib, vaqt va narxni telefon orqali tasdiqlaydi. Tasdiq bo'lmaguncha buyurtma qabul qilinmagan.",
      breakfastNote: "Yashashga kiritilgan nonushta va «Hammasi kiritilgan» tarifidagi ovqatlar bu yerga kirmaydi — ular administrator orqali buyurtma qilinadi.",
      submit: "Buyurtmani yuborish",
      sending: "Yuborilmoqda…",
      failed: "Yuborib bo'lmadi. Aloqani tekshiring va yana bosing — takroriy yuborish ikkinchi buyurtma yaratmaydi.",
      problemsTitle: "Bu taomlarni tanlangan usulda buyurtma qilib bo'lmaydi:",
      removeAll: "Ularni savatdan olib tashlash",
      testNote: "Oldindan ko'rish: buyurtma test sifatida belgilanadi.",
    },
    tables: {
      eyebrow: "Stol bandi",
      title: "Stol band qilish",
      lead: "Sana, vaqt va mehmonlar sonini tanlang. Administrator bo'sh stollarni tekshirib, qo'ng'iroq qiladi.",
      date: "Sana",
      time: "Vaqt",
      adults: "Kattalar",
      kids: "Bolalar",
      comment: "Izoh",
      commentPh: "Bayram, joy bo'yicha istaklar, bolalar stuli…",
      submit: "Arizani yuborish",
      sending: "Yuborilmoqda…",
      note: "Ariza qabul qilindi — bu hali band emas. Stol faqat administrator tasdiqlagandan keyin biriktiriladi.",
      closed: "Saytda stol band qilish restoran bilan birga ochiladi. Hozircha — telefon orqali.",
      failed: "Yuborib bo'lmadi. Aloqani tekshiring va yana bosing — takroriy yuborish ikkinchi ariza yaratmaydi.",
    },
    status: {
      order: "Buyurtma",
      table: "Stol bandi",
      placed: "Rasmiylashtirilgan",
      mode: "Usul",
      when: "Istalgan vaqt",
      confirmedAt: "Tasdiqlangan vaqt",
      items: "Tarkib",
      total: "Jami",
      feePending: "+ menejer tasdiqlaydigan to'lov",
      guests: "Mehmonlar",
      contact: "Buyurtma bo'yicha savollar",
      refresh: "Sahifa o'zi yangilanadi",
      again: "Yana buyurtma berish",
      reason: "Sabab",
      order_labels: {
        new: { title: "Ariza qabul qilindi", text: "Restoran hali buyurtmani qabul qilmagan — menejer tez orada qo'ng'iroq qilib, tarkib, vaqt va narxni tasdiqlaydi." },
        confirmed: { title: "Buyurtma tasdiqlandi", text: "Restoran buyurtmani qabul qildi. Biror narsa o'zgarsa — sizga qo'ng'iroq qilishadi." },
        cooking: { title: "Tayyorlanmoqda", text: "Oshxona buyurtmangiz ustida ishlamoqda." },
        ready: { title: "Tayyor", text: "Buyurtma tayyor — uni berishmoqda yoki sizga olib kelishmoqda." },
        done: { title: "Bajarildi", text: "Yoqimli ishtaha! Sizni yana kutamiz." },
        cancelled: { title: "Buyurtma bekor qilindi", text: "Agar bu xato bo'lsa — restoranga qo'ng'iroq qiling." },
      },
      table_labels: {
        new: { title: "Ariza qabul qilindi", text: "Band hali amal qilmaydi — administrator bo'sh stollarni tekshirib, qo'ng'iroq qiladi." },
        confirmed: { title: "Stol band qilindi", text: "Administrator bandni tasdiqladi. Sizni kutamiz!" },
        declined: { title: "Tasdiqlab bo'lmadi", text: "Bu vaqtga bo'sh stol yo'q. Qo'ng'iroq qiling — boshqa vaqt topamiz." },
        cancelled: { title: "Band bekor qilindi", text: "Agar bu xato bo'lsa — restoranga qo'ng'iroq qiling." },
        done: { title: "Tashrif bo'ldi", text: "Bizda bo'lganingiz uchun rahmat!" },
      },
      steps: ["Qabul qilindi", "Tasdiqlandi", "Tayyorlanmoqda", "Tayyor", "Bajarildi"],
      tableSteps: ["Qabul qilindi", "Tasdiqlandi", "Tashrif"],
      test: "Test buyurtma — restoran uni tayyorlamaydi",
      keepLink: "Bu sahifani saqlang — unda buyurtma holati ko'rinadi.",
      again_note: "Bu ariza avvalroq qabul qilingan. Birinchi yuborishdan keyin biror narsani o'zgartirgan bo'lsangiz — menejer qo'ng'iroq qilganda ayting.",
    },
    errors: {
      name: "Ismingizni kiriting",
      phone: "Telefon raqamingizni kiriting",
      phoneInvalid: "Telefon raqamini tekshiring — masalan, +998 90 123 45 67",
      cart: "Savat bo'sh — menyudan taom qo'shing",
      closed: "Restoran hozircha saytda buyurtma qabul qilmaydi",
      modeClosed: "Bu olish usuli hozir qabul qilinmaydi — boshqasini tanlang",
      locality: "Aholi punkti yoki mo'ljalni kiriting",
      address: "Yetkazib berish manzilini kiriting",
      unit: "Uycha va uning raqamini kiriting",
      guests: "Necha mehmon bo'lishini kiriting",
      consent: "Shaxsiy ma’lumotlarni qayta ishlashga roziligingizni tasdiqlang",
      tooMany: "Ketma-ket juda ko'p ariza. Bir necha daqiqa kuting yoki bizga qo'ng'iroq qiling.",
      failed: "Buyurtmani saqlab bo'lmadi. Bizga qo'ng'iroq qiling:",
      time: {
        required: "Sana va vaqtni tanlang",
        invalid: "Sana va vaqtni tekshiring",
        past: "Bu vaqt o'tib ketgan yoki juda yaqin — kechroq vaqtni tanlang",
        too_far: "Buncha oldindan buyurtma qabul qilinmaydi — yaqinroq sanani tanlang",
        closed: "Hozir oshxona ishlamayapti — vaqtni tanlang",
        hours: "Bu vaqt restoran ish vaqtidan tashqarida",
        lead: "Oldindan buyurtma oldinroq qabul qilinadi — kechroq vaqtni tanlang",
      },
      problem: {
        missing: "endi menyuda yo'q",
        unavailable: "vaqtincha yo'q",
        preorder_only: "faqat tashrifga oldindan buyurtma",
        channel: "bu usulda berilmaydi",
        no_price: "narxi aniqlanmoqda",
      },
      tablesClosed: "Saytda stol band qilish hozircha qabul qilinmaydi — bizga qo'ng'iroq qiling",
      adults: "Mehmonlar sonini kiriting — 1 dan 40 gacha",
      priceChanged: "Rasmiylashtirish paytida restoran narxlarni yangiladi. Yangi summani tekshirib, yana yuboring.",
    },
  },

  en: {
    navLabel: "Restaurant",
    eyebrow: "A restaurant in the mountains · 1700 m",
    actions: {
      menu: { title: "See the menu", text: "Dishes, portions and prices — pick and build your order" },
      tables: { title: "Book a table", text: "Date, time and party size — the administrator confirms" },
      delivery: { title: "Order delivery", text: "Brought to an agreed address — the manager confirms the area" },
      room: { title: "Order to your cabin", text: "Served to A-frame and Chalet guests on the grounds" },
    },
    hours: "Opening hours",
    hoursUnknown: "Please check the hours with the administrator",
    openNow: "Open now",
    closedNow: "Closed now",
    byPhone: "by phone",
    phone: "Restaurant phone",
    howTitle: "How it works",
    howSteps: [
      { title: "Choose your dishes", text: "The menu with prices and portions, right here" },
      { title: "Send the request", text: "Pick-up, delivery, to your cabin or for your visit" },
      { title: "The restaurant confirms", text: "The manager confirms the order, time and payment" },
    ],
    closedBanner: "Online ordering opens very soon. You can already browse the menu.",
    hiddenPreview: "Preview: this section is hidden from guests. Orders placed here are marked as tests.",
    previewExit: "Leave preview",
    teaserEyebrow: "Menu",
    teaserTitle: "What's in the kitchen today",
    teaserCta: "Open the full menu",
    teaserEmpty: "The menu will appear here soon — the kitchen is putting it together.",
    marquee: ["Fire", "Kazan", "Mangal", "Mountain air", "Slow dinners", "Tea with a view", "1700 m"],
    fireTitle: "Open fire and mountain air",
    fireText: "Mangal, kazan and an unhurried dinner facing Chimgan. Order to your table, take it with you or have it brought to your cabin.",
    roomNoteTitle: "For guests staying with us",
    roomNote: "Cabin orders are paid dishes from the restaurant menu. Breakfast included with your stay and meals on the All-Inclusive rate are arranged with the administrator and are not ordered here.",
    menu: {
      eyebrow: "Restaurant menu",
      title: "Menu",
      lead: "Pick your dishes and how you'd like to get them. The total is an estimate: the restaurant confirms the order and the price.",
      search: "Find a dish",
      all: "All dishes",
      empty: "The menu is coming soon — the kitchen is putting the list together.",
      emptyFiltered: "No dishes for this option — try another one.",
      nothingFound: "Nothing found — try another word.",
      unavailable: "Not available today",
      preorder: "Pre-order",
      preorderHint: "Pre-order for your visit only",
      add: "Add",
      inCart: "in cart",
      close: "Close",
      channels: "Available for",
      notHere: "Not served this way",
      count: (n) => `${n} ${n === 1 ? "item" : "items"}`,
      checkout: "Checkout",
      viewCart: "Cart",
    },
    modes: {
      takeaway: { title: "Pick-up", short: "Pick-up", hint: "Collect it yourself — staff confirm when it's ready" },
      delivery: { title: "Delivery", short: "Delivery", hint: "Brought to your address — the manager confirms the area and fee" },
      room: { title: "To your cabin", short: "Cabin", hint: "For A-frame and Chalet guests — staff check the booking" },
      preorder: { title: "For your visit", short: "Visit", hint: "Your dishes will be ready when you arrive" },
    },
    channelNames: { hall: "Dine-in", takeaway: "Pick-up", delivery: "Delivery", room: "Cabin" },
    checkout: {
      eyebrow: "Checkout",
      title: "Your order",
      lead: "Check your dishes, choose how to get them and leave your contacts — the restaurant will call to confirm.",
      cart: "Cart",
      empty: "Your cart is empty",
      emptyText: "Add dishes from the menu and come back here.",
      toMenu: "Go to the menu",
      remove: "Remove",
      how: "How to get it",
      modeClosed: "not taken right now",
      contacts: "Contacts",
      name: "Your name",
      namePh: "What should we call you",
      fullName: "First and last name",
      phone: "Phone",
      locality: "Town or landmark",
      localityPh: "e.g. Chimgan, “…” sanatorium",
      address: "Address",
      addressPh: "Street, building, entrance — so the courier finds you",
      unitType: "Cabin",
      unitNo: "Cabin number",
      unitNoPh: "e.g. 7",
      guests: "Party size",
      when: "When",
      asap: "As soon as possible",
      scheduled: "At a set time",
      date: "Date",
      time: "Time",
      noSlots: "No times left on this date — pick another",
      comment: "Comment",
      commentPh: "No onion, cutlery for three, call 10 minutes ahead…",
      dishes: "Dishes",
      fee: { delivery: "Delivery", room: "Cabin service" },
      feePending: "confirmed by the manager",
      free: "free",
      total: "Estimated",
      totalPending: "+ a fee the manager will confirm",
      consent: { before: "I consent to the processing of my personal data under the ", link: "Privacy Policy", after: "." },
      notice: "This is a request, not a payment. The restaurant confirms availability, the order, the time and the price by phone. Until then, the order is not accepted.",
      breakfastNote: "Breakfast included with your stay and All-Inclusive meals are not ordered here — ask the administrator.",
      submit: "Send order",
      sending: "Sending…",
      failed: "Couldn't send it. Check your connection and tap again — a retry will not create a second order.",
      problemsTitle: "These dishes can't be ordered this way:",
      removeAll: "Remove them from the cart",
      testNote: "Preview: this order will be marked as a test.",
    },
    tables: {
      eyebrow: "Table booking",
      title: "Book a table",
      lead: "Pick a date, a time and the number of guests. The administrator will check free tables and call you back.",
      date: "Date",
      time: "Time",
      adults: "Adults",
      kids: "Children",
      comment: "Comment",
      commentPh: "Occasion, seating wishes, a high chair…",
      submit: "Send request",
      sending: "Sending…",
      note: "Request received — this is not a booking yet. The table is held only once the administrator confirms.",
      closed: "Online table booking opens together with the restaurant. For now — by phone.",
      failed: "Couldn't send it. Check your connection and tap again — a retry will not create a second request.",
    },
    status: {
      order: "Order",
      table: "Table booking",
      placed: "Placed",
      mode: "Option",
      when: "Requested time",
      confirmedAt: "Confirmed time",
      items: "Order",
      total: "Total",
      feePending: "+ a fee the manager will confirm",
      guests: "Guests",
      contact: "Questions about your order",
      refresh: "This page updates by itself",
      again: "Order again",
      reason: "Reason",
      order_labels: {
        new: { title: "Request received", text: "The restaurant hasn't accepted it yet — the manager will call shortly to confirm the order, time and price." },
        confirmed: { title: "Order confirmed", text: "The restaurant has accepted your order. If anything changes, they will call you." },
        cooking: { title: "Being prepared", text: "The kitchen is working on your order." },
        ready: { title: "Ready", text: "Your order is ready — being handed over or on its way to you." },
        done: { title: "Completed", text: "Enjoy your meal! We hope to see you again." },
        cancelled: { title: "Order cancelled", text: "If this is a mistake, please call the restaurant." },
      },
      table_labels: {
        new: { title: "Request received", text: "The booking isn't held yet — the administrator will check free tables and call you." },
        confirmed: { title: "Table booked", text: "The administrator confirmed your booking. See you soon!" },
        declined: { title: "Couldn't confirm", text: "There's no free table at that time. Call us and we'll find another slot." },
        cancelled: { title: "Booking cancelled", text: "If this is a mistake, please call the restaurant." },
        done: { title: "Visit completed", text: "Thank you for coming!" },
      },
      steps: ["Received", "Confirmed", "Preparing", "Ready", "Completed"],
      tableSteps: ["Received", "Confirmed", "Visit"],
      test: "Test order — the restaurant will not prepare it",
      keepLink: "Keep this page — it shows what's happening with your order.",
      again_note: "This request had already been received. If you changed anything after the first send, tell the manager when they call.",
    },
    errors: {
      name: "Please enter your name",
      phone: "Please enter your phone number",
      phoneInvalid: "Please check the phone number — e.g. +998 90 123 45 67",
      cart: "Your cart is empty — add dishes from the menu",
      closed: "The restaurant isn't taking online orders yet",
      modeClosed: "This option isn't available right now — choose another",
      locality: "Please enter a town or landmark",
      address: "Please enter the delivery address",
      unit: "Please choose your cabin and its number",
      guests: "Please enter the party size",
      consent: "Please consent to the processing of your personal data",
      tooMany: "Too many requests in a row. Please wait a few minutes or call us.",
      failed: "We couldn't save your order. Please call us:",
      time: {
        required: "Please pick a date and time",
        invalid: "Please check the date and time",
        past: "That time has passed or is too soon — pick a later one",
        too_far: "Orders aren't taken that far ahead — pick a closer date",
        closed: "The kitchen is closed right now — please pick a time",
        hours: "That time is outside the restaurant's hours",
        lead: "Pre-orders need more notice — pick a later time",
      },
      problem: {
        missing: "is no longer on the menu",
        unavailable: "is not available today",
        preorder_only: "is pre-order for a visit only",
        channel: "isn't served this way",
        no_price: "has no price yet",
      },
      tablesClosed: "Online table booking isn't open yet — please call us",
      adults: "Please enter the number of guests — 1 to 40",
      priceChanged: "The restaurant updated its prices while you were ordering. Check the new total and send again.",
    },
  },
};

export function restaurantText(locale: Locale): RestaurantCopy {
  return restaurantCopy[locale] ?? restaurantCopy.ru;
}
