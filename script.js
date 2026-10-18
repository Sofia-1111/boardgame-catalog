// Підтвердження успішного завантаження та виконання зовнішнього скрипта
console.log('script.js підключено');

// Вихідні дані: масив об'єктів з усіма полями з розмітки (ЛР6)
const boardGames = [
  {
    id: 'strategy',
    title: 'Каркасон',
    minPlayers: 2,
    maxPlayers: 5,
    genre: 'Стратегія',
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
    genre: 'Для вечірок',
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
    genre: 'Сімейні',
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
    genre: 'Стратегія',
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

// Консольний пошук та фільтрація (ЛР6)
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


// ==========================================================================
// ПРАКТИЧНА РОБОТА №10: Клієнтське програмування з фреймворком Vue 3
//
// Крок 1 (Обґрунтування):
// Обрано фреймворк Vue 3 (підключений через CDN), оскільки він забезпечує 
// зручну декларативну реактивність, лаконічний синтаксис шаблонів (v-for, v-on) 
// та просту систему передачі даних через props й події ($emit) без необхідності 
// налаштування складного середовища збірки (Node.js/Vite).
// ==========================================================================

const API_URL = 'https://jsonplaceholder.typicode.com/todos?userId=1';

// --------------------------------------------------------------------------
// Крок 4 & 6: Дочірній компонент GameCard 
// Props: title, minPlayers, maxPlayers, genre (+ додаткові поля)
// Подія: клік по жанру передає $emit('filter', genre) батьківському компоненту
// --------------------------------------------------------------------------
const GameCard = {
  name: 'GameCard',
  props: ['title', 'minPlayers', 'maxPlayers', 'genre', 'description', 'image'],
  emits: ['filter'],
  template: `
    <article class="game-card">
      <img :src="image" :alt="'Обкладинка гри ' + title">
      <div class="card-body">
        <div class="badge-group">
          <span class="badge badge--players">👥 {{ minPlayers }}–{{ maxPlayers }} гравців</span>
          
          <!-- Крок 6: Інтерактивна подія варианту. Клік по плашці жанру викликає подію filter -->
          <span 
            class="badge badge--time" 
            style="cursor: pointer; background: #e2e8f0; color: #2d3748; font-weight: 600;"
            title="Натисніть для фільтрації за цим жанром"
            @click="$emit('filter', genre)"
          >
            🏷️ {{ genre }}
          </span>
        </div>
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
      </div>
    </article>
  `
};

// --------------------------------------------------------------------------
// Крок 3, 5, 8: Головний екземпляр Vue-застосунку
// --------------------------------------------------------------------------
const { createApp } = Vue;

const app = createApp({
  data() {
    return {
      // Крок 3: Перенесення даних у реактивний стан
      games: [],
      selectedGenre: 'all',
      loading: false,
      errorMessage: ''
    };
  },
  computed: {
    // Похідне значення: автоматично фільтрує масив ігор залежно від обраного жанру
    filteredGames() {
      if (this.selectedGenre === 'all') {
        return this.games;
      }
      return this.games.filter(game => game.genre === this.selectedGenre);
    }
  },
  methods: {
    // Отримання даних з API (інтеграція з ЛР9 в реактивний стан)
    async loadGamesFromAPI() {
      this.loading = true;
      this.errorMessage = '';

      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Сервер відповів кодом помилки: ${response.status}`);
        }

        const rawData = await response.json();
        console.log('Отримані дані з API (Vue):', rawData);

        // Список жанрів для перевірки реактивної фільтрації Варіанта №4
        const genres = ['Стратегія', 'Для вечірок', 'Сімейні', 'Пригоди'];

        // Мапінг масиву даних з API у масив реактивного стану
        this.games = rawData.map((item, index) => ({
          id: `api-${item.id}`,
          title: item.title,
          minPlayers: 2,
          maxPlayers: 6,
          genre: genres[index % genres.length],
          image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%23f1f3f5"/><text x="50%" y="45%" font-family="sans-serif" font-size="48" text-anchor="middle" fill="%23adb5bd">🎲</text><text x="50%" y="65%" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="%23495057">${encodeURIComponent(item.title.slice(0, 18))}</text></svg>`,
          description: item.completed 
            ? 'Статус: ✅ Вже зіграно спільнотою' 
            : 'Статус: 📌 У планах на майбутні партії'
        }));

      } catch (error) {
        console.error('Помилка завантаження даних:', error);
        this.errorMessage = 'Не вдалося завантажити дані з сервера. Перевірте з’єднання з інтернетом.';
      } finally {
        this.loading = false;
      }
    },

    // Крок 6: Метод-обробник події, що отримує жанр з компонента GameCard і оновлює стан
    filterByGenre(genre) {
      this.selectedGenre = genre;
    },

    // Скидання фільтрації
    resetFilter() {
      this.selectedGenre = 'all';
    }
  },
  mounted() {
    // Автоматично завантажуємо дані з API при старті Vue
    this.loadGamesFromAPI();
  }
});

// Глобальна реєстрація компонента та монтування
app.component('game-card', GameCard);
app.mount('#app');


// ==========================================================================
// Крок 7: Прибрати ручний DOM-код
//
// Нижче наведено функції ручного DOM-рендеру та обробники подій з ЛР7–ЛР9. 
// За вимогами Кроку 7 їх закоментовано, оскільки ручний рендеринг через 
// createElement / innerHTML / querySelector для цієї ділянки повністю замінено 
// реактивним компонентним підходом Vue 3.
// ==========================================================================

/*
// Крок 3. Вибір цільового контейнера списку та підсумкового елемента (ЛР7)
const listContainer = document.querySelector('#games-list');
const gamesCountElement = document.querySelector('#games-count');

// Крок 4. Функція динамічного рендерингу списку карток (ЛР7)
function renderGames(games) {
  if (!listContainer) return;
  listContainer.innerHTML = '';

  games.forEach(game => {
    const card = document.createElement('article');
    card.id = game.id;
    card.classList.add('game-card');
    card.dataset.players = `${game.minPlayers}-${game.maxPlayers}`;
    if (fitsPlayers(game, 4)) {
      card.classList.add('fits');
    }

    const img = document.createElement('img');
    img.src = game.image;
    img.alt = game.alt;

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const badgeGroup = document.createElement('div');
    badgeGroup.classList.add('badge-group');

    const badgePlayers = document.createElement('span');
    badgePlayers.classList.add('badge', 'badge--players');
    badgePlayers.textContent = `👥 ${game.minPlayers}–${game.maxPlayers} гравців`;

    const badgeTime = document.createElement('span');
    badgeTime.classList.add('badge', 'badge--time');
    badgeTime.textContent = `⏳ ${game.time}`;

    badgeGroup.append(badgePlayers, badgeTime);

    const title = document.createElement('h3');
    title.textContent = game.title;

    const desc = document.createElement('p');
    desc.textContent = game.description;

    cardBody.append(badgeGroup, title, desc);
    card.append(img, cardBody);

    listContainer.append(card);
  });
}

// ПРАКТИЧНА РОБОТА №8: Обробка подій та форми
const addGameForm = document.querySelector('#add-game-form');
const formError = document.querySelector('#form-error');

if (addGameForm) {
  addGameForm.addEventListener('submit', event => {
    event.preventDefault();

    if (formError) {
      formError.style.display = 'none';
      formError.textContent = '';
    }

    const titleInput = document.querySelector('#game-title');
    const minPlayersInput = document.querySelector('#game-min-players');
    const maxPlayersInput = document.querySelector('#game-max-players');
    const genreSelect = document.querySelector('#game-genre');

    const title = titleInput.value.trim();
    const minPlayers = Number(minPlayersInput.value);
    const maxPlayers = Number(maxPlayersInput.value);
    const genre = genreSelect.value;

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

    const newGame = {
      id: `game-${Date.now()}`,
      title: title,
      minPlayers: minPlayers,
      maxPlayers: maxPlayers,
      genre: genre,
      time: '30–60 хв',
      image: placeholderSvg, 
      alt: `Обкладинка настільної гри ${title}`,
      description: `Жанр: ${genre}. Нова захоплива гра для дружньої компанії.`
    };

    boardGames.push(newGame);
    renderGames(boardGames);
    addGameForm.reset();
  });
}
*/
