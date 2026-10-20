// Підтвердження успішного завантаження та виконання зовнішнього скрипта
console.log('script.js підключено (ЛР11)');

// Початкові власні дані каталогу настільних ігор (з ЛР6)
const initialBoardGames = [
  {
    id: 'game-1',
    title: 'Каркасон',
    minPlayers: 2,
    maxPlayers: 5,
    genre: 'Стратегія',
    description: 'Класична стратегічна гра на викладання тайлів земель навколо середньовічного замку.',
    image: 'img/carcassonne.png',
    played: false
  },
  {
    id: 'game-2',
    title: 'Кодові імена',
    minPlayers: 2,
    maxPlayers: 8,
    genre: 'Для вечірок',
    description: 'Командна гра у слова та асоціації, де капітани намагаються зв\'язатися з агентами.',
    image: 'img/codenames.jpg',
    played: true
  },
  {
    id: 'game-3',
    title: 'Квиток на поїзд: Європа',
    minPlayers: 2,
    maxPlayers: 5,
    genre: 'Сімейні',
    description: 'Захоплива сімейна пригода: збирайте картки вагонів та будуйте маршрути між містами.',
    image: 'img/ticket-to-ride.jpg',
    played: false
  },
  {
    id: 'game-4',
    title: 'Колонізатори (Catan)',
    minPlayers: 3,
    maxPlayers: 4,
    genre: 'Стратегія',
    description: 'Розвивайте поселення, добувайте ресурси та торгуйте на острові Катан.',
    image: 'img/catan.jpg',
    played: true
  }
];

// ==========================================================================
// ПРАКТИЧНА РОБОТА №11: Локальні сховища даних (localStorage & IndexedDB)
// ==========================================================================

const LOCAL_STORAGE_KEY = 'boardgames_catalog_data';
const MIGRATION_FLAG_KEY = 'boardgames_migrated_to_idb';
const DB_NAME = 'BoardGamesDB';
const DB_VERSION = 1;
const STORE_NAME = 'games';

// Робота з localStorage
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

// Ініціалізація та відкриття IndexedDB
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
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log(`Object store '${STORE_NAME}' успішно створено у базі ${DB_NAME}`);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Додавання або повне перезаписування (put) елемента в IndexedDB
async function addItem(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item); // put додає новий або оновлює існуючий об'єкт
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Зауваження 1 викладача: Оновлення статусу «зіграно» через метод store.put()
async function updateItem(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(item); // Виклик put() для оновлення запису
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Зчитування всіх елементів з IndexedDB
async function getAllItems() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Видалення елемента з IndexedDB
async function deleteItem(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Одноразова міграція з localStorage в IndexedDB
async function migrateLocalStorageToIDB() {
  const isMigrated = localStorage.getItem(MIGRATION_FLAG_KEY);

  if (!isMigrated) {
    console.log('Початок одноразової міграції з localStorage в IndexedDB...');
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

// ==========================================================================
// Компонент GameCard та Vue 3 Застосунок
// ==========================================================================

const GameCard = {
  name: 'GameCard',
  props: ['id', 'title', 'minPlayers', 'maxPlayers', 'genre', 'description', 'image', 'played'],
  emits: ['filter', 'delete', 'toggle-played'],
  template: `
    <article class="game-card" :style="{ borderLeft: played ? '6px solid #38a169' : '6px solid #cbd5e0' }">
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

        <!-- Перемикання статусу «Зіграно» (виклики store.put()) -->
        <div style="margin-top: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <button 
            @click="$emit('toggle-played', id)" 
            style="padding: 6px 12px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;"
            :style="{ background: played ? '#c6f6d5' : '#edf2f7', color: played ? '#22543d' : '#4a5568' }"
          >
            {{ played ? '✅ Зіграно' : '⏳ У планах' }}
          </button>

          <button 
            @click="$emit('delete', id)" 
            style="padding: 6px 10px; background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;"
          >
            🗑️ Видалити
          </button>
        </div>
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

      newTitle: '',
      newMinPlayers: 2,
      newMaxPlayers: 4,
      newGenre: 'Стратегія',
      newPlayed: false,
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
    async loadGamesFromDB() {
      this.loading = true;
      this.errorMessage = '';

      try {
        await migrateLocalStorageToIDB();
        let items = await getAllItems();

        // Первинними даними є власні ігри каталогу
        if (items.length === 0) {
          console.log('IndexedDB порожня. Заповнення початковим власним каталогом ігор...');
          items = [...initialBoardGames];

          for (const game of items) {
            await addItem(game);
          }
          saveToLocalStorage(items);
        }

        this.games = items;
      } catch (error) {
        console.error('Помилка роботи з IndexedDB:', error);
        this.errorMessage = `Не вдалося отримати дані зі сховища: ${error.message || error}`;
      } finally {
        this.loading = false;
      }
    },

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
        played: this.newPlayed,
        image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="45%" font-family="sans-serif" font-size="48" text-anchor="middle" fill="%234a5568">🎲</text><text x="50%" y="65%" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="%232d3748">${encodeURIComponent(this.newTitle.slice(0, 18))}</text></svg>`,
        description: `Нова добавлена гра у жанрі ${this.newGenre}.`
      };

      try {
        await addItem(newGame);
        this.games.push(newGame);
        saveToLocalStorage(this.games);

        this.newTitle = '';
        this.newMinPlayers = 2;
        this.newMaxPlayers = 4;
        this.newGenre = 'Стратегія';
        this.newPlayed = false;
      } catch (err) {
        this.formError = 'Помилка збереження нової гри в базу IndexedDB.';
      }
    },

    // Зміна статусу "Зіграно" з викликом store.put()
    async handleTogglePlayed(id) {
      const game = this.games.find(g => g.id === id);
      if (!game) return;

      const updatedGame = { ...game, played: !game.played };

      try {
        await updateItem(updatedGame); // Оновлення об'єкта через put()
        game.played = updatedGame.played;
        saveToLocalStorage(this.games);
      } catch (err) {
        this.errorMessage = 'Помилка оновлення статусу в IndexedDB.';
      }
    },

    async handleDeleteGame(id) {
      try {
        await deleteItem(id);
        this.games = this.games.filter(g => g.id !== id);
        saveToLocalStorage(this.games);
      } catch (err) {
        alert('Помилка видалення запису з бази IndexedDB');
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

app.component('game-card', GameCard);
app.mount('#app');
