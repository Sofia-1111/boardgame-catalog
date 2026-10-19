// Підтвердження успішного завантаження та виконання зовнішнього скрипта
console.log('script.js підключено ');

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


// ПРАКТИЧНА РОБОТА №11: Локальні сховища даних (localStorage & IndexedDB)


const LOCAL_STORAGE_KEY = 'boardgames_catalog_data';
const MIGRATION_FLAG_KEY = 'boardgames_migrated_to_idb';
const DB_NAME = 'BoardGamesDB';
const DB_VERSION = 1;
const STORE_NAME = 'games';


// Крок 2: Збереження та зчитування з localStorage (try/catch + JSON)

function saveToLocalStorage(items) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Помилка запису в localStorage:', error);
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Пошкоджені дані в localStorage, повертаємо порожній масив:', error);
    return [];
  }
}


// Крок 5 & 6: Спроектувати схему IndexedDB та реалізувати openDB()

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB не підтримується у вашому браузері або приватному режимі.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Крок 5: створення Object Store 'games' з primary key 'id'
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log(`Object store '${STORE_NAME}' успішно створено у базі ${DB_NAME}`);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Крок 7: CRUD-функції для IndexedDB (addItem, getAllItems, deleteItem)

async function addItem(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item); // put додає або оновлює
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllItems() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteItem(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Крок 8: Одноразова міграція з localStorage в IndexedDB

async function migrateLocalStorageToIDB() {
  const isMigrated = localStorage.getItem(MIGRATION_FLAG_KEY);

  if (!isMigrated) {
    console.log('Початок перевірки та одноразової міграції з localStorage в IndexedDB...');
    const localData = loadFromLocalStorage();

    if (localData.length > 0) {
      for (const game of localData) {
        await addItem(game);
      }
      console.log(`Мігровано ${localData.length} елементів у IndexedDB.`);
    }

    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  }
}

// Крок 4, 9, 11: Дочірній компонент GameCard та Vue 3 застосунок

const GameCard = {
  name: 'GameCard',
  props: ['id', 'title', 'minPlayers', 'maxPlayers', 'genre', 'description', 'image'],
  emits: ['filter', 'delete'],
  template: `
    <article class="game-card">
      <img :src="image" :alt="'Обкладинка гри ' + title">
      <div class="card-body">
        <div class="badge-group">
          <span class="badge badge--players">👥 {{ minPlayers }}–{{ maxPlayers }} гравців</span>
          
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

        <!-- Крок 3: Кнопка видалення запису з IndexedDB -->
        <button 
          @click="$emit('delete', id)" 
          style="margin-top: 10px; padding: 6px 12px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;"
        >
          🗑️ Видалити
        </button>
      </div>
    </article>
  `
};

const { createApp } = Vue;

const app = createApp({
  data() {
    return {
      games: [],
      selectedGenre: 'all',
      loading: false,
      errorMessage: '',

      // Поля форми додавання нової гри (Крок 3)
      newTitle: '',
      newMinPlayers: 2,
      newMaxPlayers: 4,
      newGenre: 'Стратегія',
      formError: ''
    };
  },
  computed: {
    filteredGames() {
      if (this.selectedGenre === 'all') {
        return this.games;
      }
      return this.games.filter(game => game.genre === this.selectedGenre);
    }
  },
  methods: {
    // Крок 9: Переведення рендеру на дані з IndexedDB
    async loadGamesFromDB() {
      this.loading = true;
      this.errorMessage = '';

      try {
        // Крок 8: Автоматична міграція даних з localStorage при першому відкритті
        await migrateLocalStorageToIDB();

        // Крок 9: Завантаження списку з IndexedDB
        let items = await getAllItems();

        // Якщо база даних порожня — заповнимо початковим масивом або API
        if (items.length === 0) {
          console.log('IndexedDB порожня. Первинне завантаження з API...');
          const response = await fetch('https://jsonplaceholder.typicode.com/todos?userId=1');
          const rawData = await response.json();
          const genres = ['Стратегія', 'Для вечірок', 'Сімейні', 'Пригоди'];

          items = rawData.slice(0, 8).map((item, index) => ({
            id: `game-${item.id}`,
            title: item.title,
            minPlayers: 2,
            maxPlayers: 6,
            genre: genres[index % genres.length],
            image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%23f1f3f5"/><text x="50%" y="45%" font-family="sans-serif" font-size="48" text-anchor="middle" fill="%23adb5bd">🎲</text><text x="50%" y="65%" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="%23495057">${encodeURIComponent(item.title.slice(0, 18))}</text></svg>`,
            description: item.completed ? 'Статус: ✅ Вже зіграно спільнотою' : 'Статус: 📌 У планах на майбутні партії'
          }));

          // Додаємо в IndexedDB та синхронізуємо з localStorage
          for (const game of items) {
            await addItem(game);
          }
          saveToLocalStorage(items);
        }

        this.games = items;

      } catch (error) {
        // Крок 11: Обробка помилки відкриття сховища
        console.error('Помилка роботи з IndexedDB:', error);
        this.errorMessage = `Не вдалося отримати дані зі сховища: ${error.message || error}`;
      } finally {
        this.loading = false;
      }
    },

    // Крок 3: Додавання нової гри в IndexedDB через форму
    async handleAddGame() {
      this.formError = '';

      if (!this.newTitle.trim()) {
        this.formError = 'Будь ласка, вкажіть назву гри!';
        return;
      }

      if (Number(this.newMinPlayers) > Number(this.newMaxPlayers)) {
        this.formError = 'Мін. кількість гравців не може перевищувати макс.!';
        return;
      }

      const newGame = {
        id: `game-${Date.now()}`,
        title: this.newTitle.trim(),
        minPlayers: Number(this.newMinPlayers),
        maxPlayers: Number(this.newMaxPlayers),
        genre: this.newGenre,
        image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="45%" font-family="sans-serif" font-size="48" text-anchor="middle" fill="%234a5568">🎲</text><text x="50%" y="65%" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="%232d3748">${encodeURIComponent(this.newTitle.slice(0, 18))}</text></svg>`,
        description: `Нова добавлена гра у жанрі ${this.newGenre}.`
      };

      try {
        await addItem(newGame);
        this.games.push(newGame);
        saveToLocalStorage(this.games);

        // Очищення полів форми
        this.newTitle = '';
        this.newMinPlayers = 2;
        this.newMaxPlayers = 4;
        this.newGenre = 'Стратегія';
      } catch (err) {
        this.formError = 'Помилка збереження нової гри в базу IndexedDB.';
      }
    },

    // Кроки 3 & 7: Видалення гри з IndexedDB
    async handleDeleteGame(id) {
      try {
        await deleteItem(id);
        this.games = this.games.filter(g => g.id !== id);
        saveToLocalStorage(this.games);
      } catch (err) {
        alert('Помилка видалення запису з базі IndexedDB');
      }
    },

    filterByGenre(genre) {
      this.selectedGenre = genre;
    },

    resetFilter() {
      this.selectedGenre = 'all';
    }
  },
  mounted() {
    this.loadGamesFromDB();
  }
});

// Глобальна реєстрація компонента та монтування
app.component('game-card', GameCard);
app.mount('#app');


// Крок 7 (попередніх робіт): Закоментований старий ручний DOM-код


/*
const listContainer = document.querySelector('#games-list');
const gamesCountElement = document.querySelector('#games-count');

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
*/
