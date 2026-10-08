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


// ПРАКТИЧНА РОБОТА №8: Обробка подій та форми 

// Крок 2. Вибір форми та елемента для помилки в DOM
const addGameForm = document.querySelector('#add-game-form');
const formError = document.querySelector('#form-error');

if (addGameForm) {
  addGameForm.addEventListener('submit', event => {
    // Крок 3. Скасування стандартного перезавантаження сторінки
    event.preventDefault();

    // Скидання попередніх повідомлень про помилку
    if (formError) {
      formError.style.display = 'none';
      formError.textContent = '';
    }

    // Крок 4. Зчитування значень полів форми
    const titleInput = document.querySelector('#game-title');
    const minPlayersInput = document.querySelector('#game-min-players');
    const maxPlayersInput = document.querySelector('#game-max-players');
    const genreSelect = document.querySelector('#game-genre');

    const title = titleInput.value.trim();
    const minPlayers = Number(minPlayersInput.value);
    const maxPlayers = Number(maxPlayersInput.value);
    const genre = genreSelect.value;

    // Крок 8. Валідація: перевірка заповнення та minPlayers <= maxPlayers
    if (!title || !minPlayers || !maxPlayers || !genre) {
      if (formError) {
        formError.textContent = 'Будь ласка, заповніть усі обов’язкові поля!';
        formError.style.display = 'block';
      }
      return;
    }

    if (minPlayers > maxPlayers) {
      if (formError) {
        formError.textContent = 'Помилка валідації: мінімальна кількість гравців не може перевищувати максимальну!';
        formError.style.display = 'block';
      }
      return;
    }
    
    const placeholderSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%23f1f3f5"/><text x="50%" y="45%" font-family="sans-serif" font-size="48" text-anchor="middle" fill="%23adb5bd">🎲</text><text x="50%" y="65%" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="%23495057">${encodeURIComponent(title)}</text></svg>`;

    // Крок 5. Створення нового об'єкта гри та додавання його в масив (push)
    const newGame = {
      id: `game-${Date.now()}`,
      title: title,
      minPlayers: minPlayers,
      maxPlayers: maxPlayers,
      time: '30–60 хв',
      image: placeholderSvg, 
      alt: `Обкладинка настільної гри ${title}`,
      description: `Жанр: ${genre}. Нова захоплива гра для дружньої компанії.`
    };

    boardGames.push(newGame);

    // Крок 6. Перемалювання списку ігор та оновлення лічильника
    renderGames(boardGames);
    if (gamesCountElement) {
      gamesCountElement.textContent = `Усього ігор у каталозі: ${boardGames.length}`;
    }

    // Крок 7. Очищення форми після успішного додавання
    addGameForm.reset();
  });
}

// Крок 9 Друга подія — change на селектор кількості гравців
// Перефільтровує список через fitsPlayers і рендерить лише придатні ігри
const filterPlayersSelect = document.querySelector('#filter-players-select');

if (filterPlayersSelect) {
  filterPlayersSelect.addEventListener('change', event => {
    const selectedValue = event.target.value;

    if (selectedValue === 'all') {
      // Відображаємо всі доступні ігри
      renderGames(boardGames);
      if (gamesCountElement) {
        gamesCountElement.textContent = `Усього ігор у каталозі: ${boardGames.length}`;
      }
    } else {
      // Фільтруємо масив за допомогою стрілкової функції fitsPlayers
      const targetPlayersCount = Number(selectedValue);
      const suitableGames = boardGames.filter(game => fitsPlayers(game, targetPlayersCount));

      // Перемальовуємо каталог лише з відфільтрованими картками
      renderGames(suitableGames);

      if (gamesCountElement) {
        gamesCountElement.textContent = `Знайдено для ${targetPlayersCount} гравців: ${suitableGames.length}`;
      }
    }
  });
}
