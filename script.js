// ПРАКТИЧНА РОБОТА №14: Клієнтська частина з використанням власного Express API

console.log('script.js підключено (ЛР14: Fetch із локального Node.js сервера)');

// URL локального Express API
const API_URL = '/api/games';

// Початкові власні дані каталогу настільних ігор (Fallback для IndexedDB)
const initialBoardGames = [
  {
    id: 'game-1',
    title: 'Каркасон',
    minPlayers: 2,
    maxPlayers: 5,
    players: '2–5 гравців',
    duration: '35–45 хв',
    genre: 'Стратегія',
    description: 'Класична стратегічна гра на викладання тайлів земель навколо середньовічного замку.',
    image: 'img/carcassonne.png',
    played: false,
    owned: true,
    isFeatured: true
  },
  {
    id: 'game-2',
    title: 'Кодові імена',
    minPlayers: 2,
    maxPlayers: 8,
    players: '2–8 гравців',
    duration: '15–20 хв',
    genre: 'Для вечірок',
    description: 'Командна гра у слова та асоціації, де капітани намагаються зв\'язатися з агентами.',
    image: 'img/codenames.jpg',
    played: true,
    owned: true,
    isFeatured: false
  },
  {
    id: 'game-3',
    title: 'Квиток на поїзд: Європа',
    minPlayers: 2,
    maxPlayers: 5,
    players: '2–5 гравців',
    duration: '30–60 хв',
    genre: 'Сімейні',
    description: 'Захоплива сімейна пригода: збирайте картки вагонів та будуйте маршрути між містами.',
    image: 'img/ticket-to-ride.jpg',
    played: false,
    owned: false,
    isFeatured: false
  },
  {
    id: 'game-4',
    title: 'Колонізатори (Catan)',
    minPlayers: 3,
    maxPlayers: 4,
    players: '3–4 гравців',
    duration: '60–90 хв',
    genre: 'Стратегія',
    description: 'Розвивайте поселення, добувайте ресурси та торгуйте на острові Катан.',
    image: 'img/catan.jpg',
    played: true,
    owned: true,
    isFeatured: false
  }
];

// Робота зі сховищем IndexedDB ("games", keyPath "id")

const LOCAL_STORAGE_KEY = 'boardgames_catalog_data';
const MIGRATION_FLAG_KEY = 'boardgames_migrated_to_idb';
const DB_NAME = 'BoardGamesDB';
const DB_VERSION = 1;
const STORE_NAME = 'games';

function saveToLocalStorage(items) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error(e);
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB не підтримується.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function addItem(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function updateItem(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getAllItems() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
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

async function migrateLocalStorageToIDB() {
  const isMigrated = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (!isMigrated) {
    const localData = loadFromLocalStorage();
    if (localData.length > 0) {
      for (const game of localData) {
        await addItem(game);
      }
    }
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  }
}

// Vue 3 Компонент картки гри
const GameCard = {
  name: 'GameCard',
  props: ['id', 'title', 'minPlayers', 'maxPlayers', 'players', 'duration', 'genre', 'description', 'image', 'played', 'owned', 'isFeatured'],
  emits: ['filter', 'delete', 'toggle-played', 'set-featured'],
  template: `
    <article 
      class="game-card cards-enter-active" 
      :class="{ 'game-card--featured': isFeatured }"
      :style="{ borderLeft: played ? '6px solid #38a169' : '6px solid #cbd5e0' }"
    >
      <img :src="image" :alt="'Обкладинка гри ' + title">
      <div class="card-body">
        <div class="badge-group">
          <span v-if="isFeatured" class="badge badge--featured">🔥 ГРА ДНЯ</span>
          <span class="badge badge--players">👥 {{ players || (minPlayers + '–' + maxPlayers + ' гравців') }}</span>
          <span class="badge badge--time">⏳ {{ duration || '30–60 хв' }}</span>
          <span 
            class="badge badge--time" 
            style="cursor: pointer; background: #e2e8f0; color: #2d3748; font-weight: 600;"
            title="Натисніть для фільтрації за цим жанром"
            @click="$emit('filter', genre)"
          >
            🏷️ {{ genre }}
          </span>
        </div>
        
        <h3>
          <a :href="'#/games/' + id" style="text-decoration: none; color: inherit;">{{ title }}</a>
        </h3>
        <p>{{ description }}</p>

        <div style="margin-top: 12px; display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-wrap: wrap;">
          <a :href="'#/games/' + id" style="padding: 6px 10px; background: #edf2f7; color: #2b6cb0; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 12px;">
            🔍 Деталі
          </a>

          <button 
            @click="$emit('toggle-played', id)" 
            style="padding: 6px 10px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;"
            :style="{ background: played ? '#c6f6d5' : '#edf2f7', color: played ? '#22543d' : '#4a5568' }"
          >
            {{ played ? '✅ Зіграно' : '⏳ У планах' }}
          </button>

          <button 
            @click="$emit('set-featured', id)" 
            style="padding: 6px 8px; background: #feebc8; color: #c05621; border: 1px solid #fbd38d; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;"
            title="Зробити грою дня"
          >
            ⭐
          </button>

          <button 
            @click="$emit('delete', id)" 
            style="padding: 6px 8px; background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;"
          >
            🗑️
          </button>
        </div>
      </div>
    </article>
  `
};

// Vue 3 Застосунок із підключенням Hash Router та Express API (ЛР14)
const { createApp } = Vue;

const app = createApp({
  data() {
    return {
      currentPath: window.location.hash.slice(1) || '/',
      routeParams: {},
      games: [],
      selectedGenre: 'all',
      loading: false,
      errorMessage: '',

      // Поля форми додавання
      newTitle: '',
      newMinPlayers: 2,
      newMaxPlayers: 4,
      newDuration: '30–60 хв',
      newGenre: 'Стратегія',
      newPlayed: false,
      formError: ''
    };
  },
  computed: {
    // 1. Маршрути «/» та «/owned»
    filteredGames() {
      let result = this.games;
      if (this.currentPath === '/owned') {
        result = result.filter(game => game.owned === true);
      }
      if (this.selectedGenre !== 'all') {
        result = result.filter(game => game.genre === this.selectedGenre);
      }
      return result;
    },
    // 2. Маршрут «/games/:id» — детальна картка гри
    currentGameDetail() {
      if (!this.routeParams.id) return null;
      return this.games.find(g => String(g.id) === String(this.routeParams.id));
    },
    // Перевірка неіснуючого маршруту 404
    isNotFound() {
      const validPaths = ['/', '/owned', '/add'];
      if (validPaths.includes(this.currentPath)) return false;
      if (this.currentPath.startsWith('/games/')) return !this.currentGameDetail;
      return true;
    }
  },
  methods: {
    matchRoute() {
      const path = window.location.hash.slice(1) || '/';
      this.currentPath = path;
      this.routeParams = {};

      if (path.startsWith('/games/')) {
        const id = path.split('/games/')[1];
        this.routeParams = { id };
      }
    },

    // ЛР14: Завантаження даних із власного Node.js Express API за патерном async/await + response.ok
    async fetchGamesFromApi() {
      this.loading = true;
      this.errorMessage = '';

      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Помилка HTTP-сервера зі статусом: ${response.status}`);
        }
        const data = await response.json();

        // Синхронізація даних з API у локальне сховище IndexedDB
        await migrateLocalStorageToIDB();
        for (const item of data) {
          await addItem(item);
        }
        
        this.games = await getAllItems();
      } catch (error) {
        console.warn('Не вдалося завантажити дані з Node.js API, використовуємо локальну IndexedDB:', error);
        try {
          this.games = await getAllItems();
          if (!this.games || this.games.length === 0) {
            this.games = [...initialBoardGames];
            for (const g of this.games) {
              await addItem(g);
            }
          }
        } catch (dbErr) {
          this.errorMessage = `Не вдалося отримати дані зі сховища: ${error.message || error}`;
        }
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
        players: `${this.newMinPlayers}–${this.newMaxPlayers} гравців`,
        duration: this.newDuration || '30–60 хв',
        genre: this.newGenre,
        played: this.newPlayed,
        owned: true,
        isFeatured: false,
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
        this.newDuration = '30–60 хв';
        this.newGenre = 'Стратегія';
        this.newPlayed = false;
        
        window.location.hash = '#/';
      } catch (err) {
        this.formError = 'Помилка збереження нової гри в базу IndexedDB.';
      }
    },

    async handleTogglePlayed(id) {
      const game = this.games.find(g => g.id === id);
      if (!game) return;

      const updatedGame = { ...game, played: !game.played };

      try {
        await updateItem(updatedGame);
        game.played = updatedGame.played;
        saveToLocalStorage(this.games);
      } catch (err) {
        this.errorMessage = 'Помилка оновлення статусу в IndexedDB.';
      }
    },

    async handleSetFeatured(id) {
      for (const game of this.games) {
        const updatedStatus = (game.id === id);
        if (game.isFeatured !== updatedStatus) {
          game.isFeatured = updatedStatus;
          await updateItem({ ...game });
        }
      }
      saveToLocalStorage(this.games);
    },

    async handleDeleteGame(id) {
      try {
        await deleteItem(id);
        this.games = this.games.filter(g => g.id !== id);
        saveToLocalStorage(this.games);
        if (this.currentPath.startsWith('/games/')) {
          window.location.hash = '#/';
        }
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
    this.fetchGamesFromApi();
    this.matchRoute();

    window.addEventListener('hashchange', () => {
      this.matchRoute();
    });
  },
  template: `
    <div>
      <!-- 1. Маршрут: Сторінка додавання гри (#/add) -->
      <section v-if="currentPath === '/add'" id="add" style="margin-bottom: 30px; padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <h2 style="margin-top: 0;">➕ Додати нову гру в IndexedDB</h2>
        <form @submit.prevent="handleAddGame" style="display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end;">
            <div>
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Назва гри:</label>
                <input type="text" v-model="newTitle" placeholder="Наприклад, Монополія" required style="padding: 8px; border: 1px solid #ccc; border-radius: 6px;">
            </div>
            <div>
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Мін. гравців:</label>
                <input type="number" v-model="newMinPlayers" min="1" max="10" required style="padding: 8px; border: 1px solid #ccc; border-radius: 6px; width: 70px;">
            </div>
            <div>
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Макс. гравців:</label>
                <input type="number" v-model="newMaxPlayers" min="1" max="20" required style="padding: 8px; border: 1px solid #ccc; border-radius: 6px; width: 70px;">
            </div>
            <div>
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Тривалість:</label>
                <input type="text" v-model="newDuration" placeholder="30–60 хв" style="padding: 8px; border: 1px solid #ccc; border-radius: 6px; width: 100px;">
            </div>
            <div>
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Жанр:</label>
                <select v-model="newGenre" style="padding: 8px; border: 1px solid #ccc; border-radius: 6px;">
                    <option value="Стратегія">Стратегія</option>
                    <option value="Для вечірок">Для вечірок</option>
                    <option value="Сімейні">Сімейні</option>
                    <option value="Пригоди">Пригоди</option>
                </select>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; padding-bottom: 8px;">
                <input type="checkbox" id="played-check" v-model="newPlayed">
                <label for="played-check" style="font-size: 12px; font-weight: 600; cursor: pointer;">Зіграно</label>
            </div>
            <button type="submit" class="submit-btn" style="padding: 8px 16px; width: auto; background: #2b6cb0; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Зберегти в базу
            </button>
        </form>
        <p v-if="formError" style="color: #e53e3e; font-size: 13px; margin-top: 8px; font-weight: 600;">{{ formError }}</p>
      </section>

      <!-- 2. Маршрут: Деталі гри (#/games/:id) -->
      <section v-else-if="currentPath.startsWith('/games/') && currentGameDetail" style="padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <a href="#/" style="display: inline-block; margin-bottom: 16px; color: #2b6cb0; font-weight: 600; text-decoration: none;">← Повернутися до каталогу</a>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <img :src="currentGameDetail.image" :alt="currentGameDetail.title" style="width: 250px; height: 250px; object-fit: cover; border-radius: 8px;">
          <div style="flex: 1; min-width: 250px;">
            <h2>{{ currentGameDetail.title }} <span v-if="currentGameDetail.isFeatured">🔥</span></h2>
            <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
              <span class="badge badge--players">👥 {{ currentGameDetail.players || (currentGameDetail.minPlayers + '–' + currentGameDetail.maxPlayers + ' гравців') }}</span>
              <span class="badge badge--time">⏳ {{ currentGameDetail.duration || '30–60 хв' }}</span>
              <span class="badge" style="background: #e2e8f0; color: #2d3748;">🏷️ {{ currentGameDetail.genre }}</span>
              <span class="badge" :style="{ background: currentGameDetail.owned ? '#c6f6d5' : '#fed7d7', color: currentGameDetail.owned ? '#22543d' : '#9b2c2c' }">
                {{ currentGameDetail.owned ? '📦 Є в колекції (Owned)' : '🛒 Немає в наявності' }}
              </span>
            </div>
            <p style="font-size: 15px; line-height: 1.6; color: #4a5568;">{{ currentGameDetail.description }}</p>
            <div style="margin-top: 20px;">
              <button 
                @click="handleTogglePlayed(currentGameDetail.id)"
                style="padding: 8px 16px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
                :style="{ background: currentGameDetail.played ? '#c6f6d5' : '#edf2f7', color: currentGameDetail.played ? '#22543d' : '#4a5568' }"
              >
                {{ currentGameDetail.played ? '✅ Зіграно' : '⏳ У планах' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Маршрут: Неіснуючий маршрут 404 -->
      <section v-else-if="isNotFound" style="text-align: center; padding: 40px; background: white; border-radius: 12px;">
        <h2 style="font-size: 36px; color: #e53e3e; margin-bottom: 8px;">404</h2>
        <p style="font-size: 18px; color: #4a5568;">Сторінку не знайдено!</p>
        <a href="#/" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #2b6cb0; color: white; border-radius: 6px; text-decoration: none; font-weight: 600;">На головну</a>
      </section>

      <!-- 4. Основні маршрути: Повний список (#/) та Колекція (#/owned) -->
      <section v-else id="games">
        <div class="section-header" style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; flex-wrap: wrap;">
            <h2>
              {{ currentPath === '/owned' ? '📦 Моя колекція (owned: true)' : 'Популярні ігри (Express REST API)' }}
            </h2>
            <div style="display: flex; gap: 8px;">
                <button v-if="selectedGenre !== 'all'" @click="resetFilter" class="submit-btn" style="padding: 8px 16px; width: auto; background: #4a5568; color: white; border: none; border-radius: 6px; cursor: pointer;">❌ Скинути фільтр</button>
            </div>
        </div>

        <p v-if="loading" style="color: #2b6cb0; font-weight: 600;">⏳ Отримання даних з Express API (localhost:3000)...</p>
        <p v-if="errorMessage" style="color: #c92a2a; font-weight: 600; padding: 10px; background: #ffe3e3; border-radius: 8px; margin-bottom: 12px;">{{ errorMessage }}</p>

        <p id="games-count">
            Показано ігор: {{ filteredGames.length }} з {{ games.length }}
            <span v-if="selectedGenre !== 'all'"> (Фільтр за жанром: <strong>{{ selectedGenre }}</strong>)</span>
        </p>

        <div id="games-list" class="cards">
            <game-card 
                v-for="game in filteredGames" 
                :key="game.id"
                :id="game.id"
                :title="game.title"
                :min-players="game.minPlayers"
                :max-players="game.maxPlayers"
                :players="game.players"
                :duration="game.duration"
                :genre="game.genre"
                :description="game.description"
                :image="game.image"
                :played="game.played"
                :owned="game.owned"
                :is-featured="game.isFeatured"
                @filter="filterByGenre"
                @delete="handleDeleteGame"
                @toggle-played="handleTogglePlayed"
                @set-featured="handleSetFeatured"
            ></game-card>
        </div>
      </section>
    </div>
  `
});

app.component('game-card', GameCard);
app.mount('#app');
