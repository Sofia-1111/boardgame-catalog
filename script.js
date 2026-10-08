// Підтвердження успішного завантаження та виконання зовнішнього скрипта
console.log('script.js підключено');

// Вихідні дані: масив об'єктів з усіма полями з розмітки
const boardGames = [
  {
    id: 'strategy',
    title: 'Каркасон',
    minPlayers: 2,
    maxPlayers: 5,
    time: '35–45 хв',
    image: 'img/carcassonne.png',
    alt: 'Коробка настільної гри Каркасон',
    description: 'Класична стратегічна гра на викладання тайлів земель навколо середньовічного замку.'
  },
  {
    id: 'party',
    title: 'Кодові імена',
    minPlayers: 2,
    maxPlayers: 8,
    time: '15–20 хв',
    image: 'img/codenames.jpg',
    alt: 'Коробка настільної гри Кодові імена',
    description: 'Командна гра у слова та асоціації, де капітани намагаються зв\'язатися з агентами.'
  },
  {
    id: 'family',
    title: 'Квиток на поїзд: Європа',
    minPlayers: 2,
    maxPlayers: 5,
    time: '30–60 хв',
    image: 'img/ticket-to-ride.jpg',
    alt: 'Коробка настільної гри Квиток на поїзд: Європа',
    description: 'Захоплива сімейна пригода: збирайте картки вагонів та будуйте маршрути між містами.'
  },
  {
    id: 'catan',
    title: 'Колонізатори (Catan)',
    minPlayers: 3,
    maxPlayers: 4,
    time: '60–90 хв',
    image: 'img/catan.jpg',
    alt: 'Коробка настільної гри Колонізатори',
    description: 'Розвивайте поселення, добувайте ресурси та торгуйте на острові Катан.'
  }
];

// Виведення загальної кількості ігор у консоль
console.log(`Загальна кількість ігор у масиві: ${boardGames.length}`);

// Стрілкова функція варіанта №4 для перевірки діапазону гравців
const fitsPlayers = (game, n) => n >= game.minPlayers && n <= game.maxPlayers;

// Консольний пошук та фільтрація

function filterGamesByPlayers(gamesList, targetPlayers) {
  console.log(`\n Пошук ігор для компанії: ${targetPlayers} гравців `);

  let suitableCount = 0;

  for (const game of gamesList) {
    if (fitsPlayers(game, targetPlayers)) {
      console.log(` Підходить: "${game.title}" (діапазон: ${game.minPlayers}–${game.maxPlayers} гравців)`);
      suitableCount++;
    } else {
      console.log(` Не підходить: "${game.title}"`);
    }
  }

  const summaryText = suitableCount > 0
    ? `Знайдено ${suitableCount} відповідних ігор.`
    : 'Жодна гра не підходить для такої кількості гравців.';

  console.log(`Підсумок: ${summaryText}`);
}

filterGamesByPlayers(boardGames, 4);
filterGamesByPlayers(boardGames, 7);
filterGamesByPlayers(boardGames, 1);

// Крок 3. Вибір цільового контейнера списку та підсумкового елемента
const listContainer = document.querySelector('#games-list');
const gamesCountElement = document.querySelector('#games-count');

// Крок 2. Очищення початкового вмісту контейнера перед створенням нових карток
if (listContainer) {
  listContainer.innerHTML = '';
}

// Крок 4. Функція динамічного рендерингу списку карток
function renderGames(games) {
  listContainer.innerHTML = '';

  // Крок 5. Створення повноцінної картки для кожної гри
  games.forEach(game => {
    // Кореневий елемент article з класом та id
    const card = document.createElement('article');
    card.id = game.id;
    card.classList.add('game-card');

    // Крок 6. Додавання data-атрибута та умовного класу fits (для 4 гравців)
    card.dataset.players = `${game.minPlayers}-${game.maxPlayers}`;
    if (fitsPlayers(game, 4)) {
      card.classList.add('fits');
    }

    // 2. Зображення обкладинки
    const img = document.createElement('img');
    img.src = game.image;
    img.alt = game.alt;

    // 3. Контейнер card-body
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    // 4. Група беджів
    const badgeGroup = document.createElement('div');
    badgeGroup.classList.add('badge-group');

    const badgePlayers = document.createElement('span');
    badgePlayers.classList.add('badge', 'badge--players');
    badgePlayers.textContent = `👥 ${game.minPlayers}–${game.maxPlayers} гравців`;

    const badgeTime = document.createElement('span');
    badgeTime.classList.add('badge', 'badge--time');
    badgeTime.textContent = `⏳ ${game.time}`;

    badgeGroup.append(badgePlayers, badgeTime);

    // 5. Заголовок гри
    const title = document.createElement('h3');
    title.textContent = game.title;

    // 6. Опис гри
    const desc = document.createElement('p');
    desc.textContent = game.description;

    // Збираємо тіло картки
    cardBody.append(badgeGroup, title, desc);

    // Збираємо картку разом із картинкою
    card.append(img, cardBody);

    // Крок 7. Додаємо картку в контейнер на сторінці
    listContainer.append(card);
  });
}

// Крок 8. Виклик функції рендерингу при завантаженні
if (listContainer) {
  renderGames(boardGames);
}

// Крок 9. Оновлення підсумкового елемента (лічильника)
if (gamesCountElement) {
  gamesCountElement.textContent = `Усього ігор у каталозі: ${boardGames.length}`;
}
