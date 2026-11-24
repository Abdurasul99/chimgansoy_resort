/**
 * Меню «Сазанчика» из «Sazanchik_Chimgan_A3_Print.pdf» (24.11.2026, прислано
 * владельцем для страницы /restaurant).
 *
 * Цены — из ТЕКСТОВОГО слоя PDF. Под текстом в файле лежит картинка со
 * старым меню (Цезарь с креветками 90 000 вместо 100 000 и т. д.) — по
 * картинке не сверять. Порядок разделов — как на листах: первая страница
 * слева направо, затем вторая.
 *
 * Блюдо: [ru, uz, en, цена, порция?, фото?]. Барак с двумя ценами — две
 * позиции с порцией «0,5 порции» / «1 порция» (так же было в меню от 10.11),
 * страница сводит их в одну строку.
 *
 * Фото — кадры из роликов Instagram ресторана (@sazanchik.chimgandarbaza),
 * лежат в public/images/restaurant/dish/.
 */

const PHOTO = (name) => `/images/restaurant/dish/${name}.jpg`;
const half = (ru, uz, en, p05, p1) => [
  [ru, uz, en, p05, "0,5 порции"],
  [ru, uz, en, p1, "1 порция"],
];

export const MENU = [
  {
    title: ["Салаты", "Salatlar", "Salads"],
    dishes: [
      ["Цезарь с креветками", "Krevetkali Sezar", "Caesar with prawns", 100_000],
      ["Цезарь с курицей", "Tovuqli Sezar", "Chicken Caesar", 85_000],
      ["Тёплый салат с курицей", "Tovuqli iliq salat", "Warm chicken salad", 85_000],
      ["Руккола с телятиной", "Buzoq go'shtli rukkola", "Rocket with veal", 100_000],
      ["Греческий", "Grekcha salat", "Greek salad", 80_000, "", PHOTO("greek-salad")],
      ["Ачик-чучук", "Achchiq-chuchuk", "Achik-chuchuk (tomato and onion)", 45_000],
      ["Оливье", "Olivye", "Olivier salad", 75_000],
      ["Овощная нарезка", "Sabzavot to'g'ramasi", "Fresh vegetable platter", 70_000],
      ["Баклажаны с моцареллой и ореховым соусом", "Mosarella va yong'oq sousli baqlajon", "Aubergine with mozzarella and walnut sauce", 95_000],
      ["Королевский со свёклой", "Lavlagili «Qirollik» salati", "Royal salad with beetroot", 50_000],
      ["Руккола с моцареллой", "Mosarellali rukkola", "Rocket with mozzarella", 80_000],
      ["Чирокчи", "Chiroqchi", "Chirokchi", 45_000],
    ],
  },
  {
    title: ["Холодные закуски", "Sovuq gazaklar", "Cold starters"],
    dishes: [
      ["Мясное ассорти", "Go'shtli assorti", "Meat platter", 350_000],
      ["Сырное плато", "Pishloq assortisi", "Cheese board", 300_000],
      ["Рыбное ассорти", "Baliqli assorti", "Fish platter", 400_000],
      ["Сельдь по-русски", "Ruscha seld", "Russian-style herring", 70_000],
      ["Маринованное ассорти", "Marinadlangan assorti", "Pickled vegetable platter", 70_000],
      ["Помидоры в особом маринаде", "Maxsus marinaddagi pomidorlar", "Tomatoes in a house marinade", 50_000],
      ["Имжан", "Imjan", "Imjan", 40_000],
      ["Сузьма", "Suzma", "Suzma (strained yoghurt)", 20_000],
      ["Холодец", "Xolodets", "Meat aspic", 80_000],
      ["Думбача", "Dumbacha", "Dumbacha", 85_000, "100 г"],
      ["Скумбрия", "Skumbriya", "Mackerel", 110_000, "200 г"],
    ],
  },
  {
    title: ["Горячие закуски", "Issiq gazaklar", "Hot starters"],
    dishes: [
      ["Долма", "Do'lma", "Dolma", 75_000],
      ["Хрустящие сырные палочки", "Qarsildoq pishloq tayoqchalari", "Crispy cheese sticks", 55_000],
      ["Куриные стрипсы", "Tovuq stripslari", "Chicken strips", 45_000],
      ["Язык по-хорезмски", "Xorazmcha til", "Khorezm-style tongue", 140_000],
      ["Ушак-барак жареный", "Qovurilgan ushak barak", "Fried ushak barak", 40_000],
      ["Хасып по-хорезмски", "Xorazmcha hasip", "Khorezm-style khasip", 140_000],
      ["Корин туяк по-хорезмски", "Xorazmcha qorin-tuyoq", "Khorezm-style korin tuyak", 140_000],
    ],
  },
  {
    title: ["Супы", "Sho'rvalar", "Soups"],
    dishes: [
      ["Чечевичный суп", "Yasmiq sho'rva", "Lentil soup", 45_000],
      ["Ушак-барак", "Ushak barak", "Ushak barak", 40_000],
      ["Ун оши", "Un oshi", "Un oshi (noodle soup)", 40_000],
      ["Мастава", "Mastava", "Mastava (rice soup)", 50_000],
      ["Лагман", "Lag'mon", "Lagman", 50_000, "", PHOTO("lagman")],
      ["Куриный суп с лапшой", "Tovuqli lapsha sho'rva", "Chicken noodle soup", 35_000],
      ["Борщ", "Borsh", "Borscht", 45_000],
    ],
  },
  {
    title: ["Пицца", "Pitsa", "Pizza"],
    dishes: [
      ["Комбо", "Kombo", "Combo", 140_000],
      ["Пепперони", "Pepperoni", "Pepperoni", 130_000],
      ["Четыре сыра", "To'rt pishloq", "Four cheeses", 110_000],
      ["Маргарита", "Margarita", "Margherita", 100_000],
    ],
  },
  {
    title: ["Чебуреки", "Chebureklar", "Chebureks"],
    dishes: [
      ["С мясом", "Go'shtli", "Meat", 30_000],
      ["С брынзой и зеленью", "Brinza va ko'katli", "Brynza cheese and herbs", 25_000],
      ["С картофелем", "Kartoshkali", "Potato", 25_000],
      ["С сыром и зеленью", "Pishloq va ko'katli", "Cheese and herbs", 25_000],
      ["С сыром", "Pishloqli", "Cheese", 25_000],
      ["С тыквой", "Qovoqli", "Pumpkin", 25_000],
    ],
  },
  {
    title: ["Ишлама", "Ishlama", "Ishlama"],
    dishes: [
      ["С говядиной и овощами", "Mol go'shti va sabzavotli", "Beef and vegetables", 40_000],
      ["С брынзой и зеленью", "Brinza va ko'katli", "Brynza cheese and herbs", 36_000],
      ["С курицей и сыром", "Tovuq va pishloqli", "Chicken and cheese", 38_000],
    ],
  },
  {
    title: ["Блюда из теста", "Xamirli taomlar", "Dough dishes"],
    dishes: [
      ...half("Тухум-барак", "Tuxum barak", "Tukhum barak (egg dumplings)", 35_000, 55_000),
      ...half("Кутир-барак", "Qutir barak", "Kutir barak", 35_000, 55_000),
      ...half("Кады-барак", "Qadi barak", "Kady barak (pumpkin dumplings)", 35_000, 55_000),
      ...half("Кук-барак", "Ko'k barak", "Kuk barak (herb dumplings)", 35_000, 50_000),
      ["Шивит оши", "Shivit oshi", "Shivit oshi (dill noodles)", 70_000, "", PHOTO("shivit-oshi")],
      ["Манты с тыквой", "Qovoqli manti", "Pumpkin manti", 50_000],
      ["Манты с мясом", "Go'shtli manti", "Meat manti", 65_000],
      ["Манты ханские", "Xon manti", "Khan manti", 65_000],
      ["Ханум с мясом", "Go'shtli xonim", "Khanum with meat", 55_000],
      ["Ханум с тыквой", "Qovoqli xonim", "Khanum with pumpkin", 45_000],
      ["Ханский микс", "Xon miksi", "Khan's mix", 400_000],
    ],
  },
  {
    title: ["Вторые блюда", "Asosiy taomlar", "Main courses"],
    dishes: [
      ["Шур-кабоб", "Sho'r kabob", "Shur kabob", 160_000],
      ["Думгаза по-хорезмски", "Xorazmcha dumg'aza", "Khorezm-style dumgaza", 160_000],
      ["Домашняя курица на сливочном масле", "Sariyog'da uy tovug'i", "Free-range chicken in butter", 200_000],
      ["Котлета по-киевски", "Kiyevcha kotlet", "Chicken Kiev", 80_000],
      ["Бефстроганов", "Befstroganov", "Beef Stroganoff", 100_000],
      ["Казан-кабоб", "Qozon kabob", "Kazan kabob", 145_000],
    ],
  },
  {
    title: ["Рыба", "Baliq", "Fish"],
    dishes: [
      ["Сазан от шеф-повара на мангале", "Oshpazdan manqalda sazan", "Chef's carp from the grill", 230_000],
      ["Сазан без хвоста и головы", "Boshi va dumisiz sazan", "Carp, head and tail removed", 200_000],
      ["Сазан целиком", "Butun sazan", "Whole carp", 190_000],
      ["Шейка сазана", "Sazanning bo'yin qismi", "Carp neck cut", 370_000],
      ["Форель целиком", "Butun forel", "Whole trout", 350_000],
      ["Лосось", "Losos", "Salmon", 400_000],
      ["Судак", "Sudak", "Zander", 420_000],
      ["Сом", "Laqqa baliq", "Catfish", 400_000],
      ["Осётр", "Bakra baliq", "Sturgeon", 500_000],
    ],
  },
  {
    title: ["Кавказские шашлыки", "Kavkazcha shashliklar", "Caucasian grill"],
    dishes: [
      ["Корейка баранья", "Qo'y qovurg'asi", "Rack of lamb", 170_000, "300 г"],
      ["Говядина кусковая", "Mol go'shti bo'laklari", "Beef chunks", 170_000, "300 г"],
      ["Люля-кебаб говяжий", "Mol go'shtidan lyulya-kabob", "Beef lula kebab", 80_000, "250 г", PHOTO("lula-kebab")],
      ["Куриные крылышки", "Tovuq qanotlari", "Chicken wings", 60_000],
      ["Куриные бёдра", "Tovuq sonlari", "Chicken thighs", 60_000],
      ["Грибы BBQ", "BBQ qo'ziqorin", "BBQ mushrooms", 50_000],
      ["Помидоры BBQ", "BBQ pomidor", "BBQ tomatoes", 40_000],
      ["Овощной микс", "Sabzavot miksi", "Grilled vegetable mix", 50_000],
      ["Картофель BBQ", "BBQ kartoshka", "BBQ potatoes", 20_000],
    ],
  },
  {
    title: ["Шашлык", "Shashlik", "Shashlik"],
    dishes: [
      ["Говяжий кусковой", "Mol go'shti bo'laklari", "Beef chunks", 45_000, "100 г"],
      ["Молотый говяжий", "Qiyma mol go'shti", "Minced beef", 40_000, "100 г"],
      ["Бараний кусковой", "Qo'y go'shti bo'laklari", "Lamb chunks", 45_000, "100 г"],
      ["Куриные бёдра", "Tovuq sonlari", "Chicken thighs", 35_000, "100 г"],
      ["Молотый рулет", "Qiyma rulet", "Minced meat roll", 45_000, "100 г"],
      ["Гимжима по-хорезмски", "Xorazmcha gijjima", "Khorezm-style gijjima", 40_000, "2 шт."],
    ],
  },
  {
    title: ["Колбаски", "Kolbasachalar", "Sausages"],
    dishes: [
      ["Говяжьи", "Mol go'shtidan", "Beef", 120_000],
      ["Куриные", "Tovuqdan", "Chicken", 100_000],
      ["Бараньи", "Qo'y go'shtidan", "Lamb", 100_000],
      ["Куриные с сыром", "Pishloqli tovuq", "Chicken with cheese", 100_000],
      ["Ассорти из колбасок", "Kolbasachalar assortisi", "Sausage platter", 250_000],
    ],
  },
  {
    title: ["Десерты", "Desertlar", "Desserts"],
    dishes: [
      ["Вафли с фруктами", "Mevali vafli", "Waffles with fruit", 110_000],
      ["Фрукты большие", "Katta meva assortisi", "Fruit platter, large", 500_000],
      ["Фрукты маленькие", "Kichik meva assortisi", "Fruit platter, small", 300_000],
    ],
  },
  {
    title: ["Гарниры", "Garnirlar", "Sides"],
    dishes: [
      ["Рис", "Guruch", "Rice", 20_000],
      ["Рис с овощами", "Sabzavotli guruch", "Rice with vegetables", 25_000],
      ["Картофель с розмарином", "Rozmarinli kartoshka", "Rosemary potatoes", 30_000],
      ["Картофель фри", "Kartoshka fri", "French fries", 25_000],
      ["Брокколи", "Brokkoli", "Broccoli", 25_000],
      ["Гречка с грибами", "Qo'ziqorinli grechka", "Buckwheat with mushrooms", 20_000],
      ["Пюре", "Kartoshka pyuresi", "Mashed potatoes", 20_000],
    ],
  },
  {
    title: ["Фастфуд", "Fastfud", "Fast food"],
    dishes: [
      ["Хот-дог «Королевский»", "«Qirollik» hot-dogi", "Royal hot dog", 45_000],
      ["Хот-дог", "Hot-dog", "Hot dog", 40_000],
      ["Гамбургер", "Gamburger", "Hamburger", 50_000],
      ["Чизбургер", "Chizburger", "Cheeseburger", 60_000],
      ["Лаваш куриный", "Tovuqli lavash", "Chicken lavash wrap", 45_000],
      ["Цезарь хот-дог", "Sezar hot-dog", "Caesar hot dog", 40_000],
      ["Бургер с томлёной говядиной", "Dimlangan mol go'shtli burger", "Slow-cooked beef burger", 65_000],
    ],
  },
  {
    title: ["Хлеб", "Non", "Bread"],
    dishes: [
      ["Хлебное ассорти", "Non assortisi", "Bread basket", 50_000],
      ["Хорезмская лепёшка", "Xorazm noni", "Khorezm flatbread", 30_000],
      ["Слоёная лепёшка", "Qatlama non", "Layered flatbread", 30_000],
      ["Тонкая лепёшка", "Yupqa non", "Thin flatbread", 30_000],
      ["Лепёшка с томатами", "Pomidorli non", "Flatbread with tomatoes", 30_000],
      ["Лепёшка с мясом", "Go'shtli non", "Flatbread with meat", 30_000],
      ["Чёрный хлеб", "Qora non", "Rye bread", 30_000],
      ["Серый хлеб", "Kulrang non", "Wheat-rye bread", 15_000],
    ],
  },
  {
    // Целиком «под заказ»: страница пишет это один раз над разделом.
    title: ["Блюда на заказ", "Buyurtma bo'yicha taomlar", "Made to order"],
    preorder: true,
    dishes: [
      ["Праздничный плов", "Bayram oshi", "Festive plov", 500_000, "1 кг"],
      ["Казан-кабоб", "Qozon kabob", "Kazan kabob", 700_000, "1 кг"],
      ["Вагури", "Vaguri", "Vaguri", 800_000, "1 кг"],
      ["Димлама", "Dimlama", "Dimlama (braised meat and vegetables)", 500_000, "1 кг"],
      ["Кайнатма шурпа", "Qaynatma sho'rva", "Kaynatma shurpa", 450_000, "6 персон"],
      ["Карма по-хорезмски", "Xorazmcha karma", "Khorezm-style karma", 500_000],
    ],
  },
  {
    title: ["Услуги", "Xizmatlar", "Services"],
    dishes: [
      ["Повар", "Oshpaz", "Chef", 250_000, "за час"],
      ["Официант", "Ofitsiant", "Waiter", 200_000, "за час"],
      ["Уборка после застолья", "Ziyofatdan keyin tozalash", "Cleaning up after a feast", 150_000, "за час"],
      ["Аренда посуды и скатертей", "Idish-tovoq va dasturxon ijarasi", "Tableware and tablecloth hire", 200_000, "на 4 персоны"],
    ],
  },
];

export const DISH_COUNT = MENU.reduce((n, c) => n + c.dishes.length, 0);
