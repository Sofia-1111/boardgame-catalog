console.log('script.js підключено (ЛР12: Анімація з transition-group та Pulse)');

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
    isFeatured: true // Прапорець "Гра дня"
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
    owned: true,
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

// Робота з IndexedDB

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
      class="game-card" 
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
        
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>

        <div style="margin-top: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
          <button 
            @click="$emit('toggle-played', id)" 
            style="padding: 6px 12px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;"
            :style="{ background: played ? '#c6f6d5' : '#edf2f7', color: played ? '#22543d' : '#4a5568' }"
          >
            {{ played ? '✅ Зіграно' : '⏳ У планах' }}
          </button>

          <button 
            @click="$emit('set-featured', id)" 
            style="padding: 6px 10px; background: #feebc8; color: #c05621; border: 1px solid #fbd38d; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;"
            title="Зробити грою дня"
          >
            ⭐ Гра дня
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
      newDuration: '30–60 хв',
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

        if (items.length === 0) {
          items = [...initialBoardGames];
          for (const game of items) {
            await addItem(game);
          }
          saveToLocalStorage(items);
        }

        this.games = items;
      } catch (error) {
        console.error('Помилка IndexedDB:', error);
        this.errorMessage = `Не вдалося отримати дані: ${error.message || error}`;
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
  },
  template: `
    <div>
      <section id="games">
        <div class="section-header" style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px;">
          <h2>Каталог настільних ігор</h2>
          <button v-if="selectedGenre !== 'all'" @click="resetFilter" class="submit-btn" style="padding: 8px 16px; width: auto; background: #4a5568;">❌ Скинути фільтр</button>
        </div>

        <p id="games-count">
          Показано ігор: {{ filteredGames.length }} з {{ games.length }}
          <span v-if="selectedGenre !== 'all'"> (Фільтр за жанром: <strong>{{ selectedGenre }}</strong>)</span>
        </p>

        <!-- Головне виправлення ЛР12: використовуємо transition-group -->
        <transition-group 
          name="cards" 
          tag="div" 
          id="games-list" 
          class="cards"
        >
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
        </transition-group>
      </section>
    </div>
  `
});

app.component('game-card', GameCard);
app.mount('#app');
