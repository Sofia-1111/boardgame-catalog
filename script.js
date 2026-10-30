console.log('script.js підключено (ЛР14 & ЛР15: Інтеграція з REST API, IndexedDB та Захист від XSS)');

// Допоміжна утиліта захисту від XSS (ЛР15)
function escapeHtml(str) {
  if (!str) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(str).replace(/[&<>"']/g, (ch) => map[ch]);
}

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

// Робота з IndexedDB та LocalStorage

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

// Vue 3 Компонент картки гри (ВИПРАВЛЕНО: v-html утилізує заздалегідь екрановані дані)
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
            v-html="'🏷️ ' + genre"
          >
          </span>
        </div>
        
        <h3 v-html="title"></h3>
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
      currentView: 'all', // Вкладки: 'all', 'owned', 'add'
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
      let list = this.games;

      if (this.currentView === 'owned') {
        list = list.filter(game => game.owned);
      }

      if (this.selectedGenre !== 'all') {
        list = list.filter(game => game.genre === this.selectedGenre);
      }

      return list;
    }
  },
  methods: {
    async loadGamesFromDB() {
      this.loading = true;
      this.errorMessage = '';

      // REST API запит зі створенням фолбеку на IndexedDB (ЛР14)
      try {
        console.log('Спроба виконанння запиту fetch(/api/games)...');
        const res = await fetch('/api/games');
        if (res.ok) {
          const apiGames = await res.json();
          console.log('Дані успішно отримано з API /api/games:', apiGames);
          if (Array.isArray(apiGames) && apiGames.length > 0) {
            this.games = apiGames;
            for (const g of apiGames) {
              await addItem(g);
            }
            saveToLocalStorage(apiGames);
            return;
          }
        }
      } catch (apiErr) {
        console.warn('Сервер /api/games недоступний (або розгортання статичне). Беремо дані з IndexedDB:', apiErr);
      }

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

      // Екранування вхідних даних через escapeHtml (ЛР15)
      const safeTitle = escapeHtml(this.newTitle.trim());
      const safeGenre = escapeHtml(this.newGenre);

      const newGame = {
        id: `game-${Date.now()}`,
        title: safeTitle,
        minPlayers: Number(this.newMinPlayers),
        maxPlayers: Number(this.newMaxPlayers),
        players: `${this.newMinPlayers}–${this.newMaxPlayers} гравців`,
        duration: this.newDuration || '30–60 хв',
        genre: safeGenre,
        played: this.newPlayed,
        owned: true,
        isFeatured: false,
        image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="45%" font-family="sans-serif" font-size="48" text-anchor="middle" fill="%234a5568">🎲</text><text x="50%" y="65%" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="%232d3748">${encodeURIComponent(safeTitle.slice(0, 18))}</text></svg>`,
        description: `Нова добавлена гра у жанрі ${safeGenre}.`
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
        this.currentView = 'all'; 
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
      <!-- Навігаційні кнопки -->
      <header style="margin-bottom: 24px;">
        <nav style="display: flex; gap: 12px; margin-top: 16px;">
          <button 
            @click="currentView = 'all'" 
            class="submit-btn" 
            :style="{ background: currentView === 'all' ? '#3182ce' : '#cbd5e0', color: currentView === 'all' ? '#fff' : '#2d3748', width: 'auto' }"
          >
            📚 Усі ігри
          </button>
          <button 
            @click="currentView = 'owned'" 
            class="submit-btn" 
            :style="{ background: currentView === 'owned' ? '#3182ce' : '#cbd5e0', color: currentView === 'owned' ? '#fff' : '#2d3748', width: 'auto' }"
          >
            📦 Моя колекція
          </button>
          <button 
            @click="currentView = 'add'" 
            class="submit-btn" 
            :style="{ background: currentView === 'add' ? '#38a169' : '#cbd5e0', color: currentView === 'add' ? '#fff' : '#2d3748', width: 'auto' }"
          >
            ➕ Додати нову гру
          </button>
        </nav>
      </header>

      <!-- Форма додавання нової гри -->
      <section v-if="currentView === 'add'" style="background: #f7fafc; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0;">Додати нову гру в каталог</h3>
        <form @submit.prevent="handleAddGame">
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Назва гри:</label>
            <input type="text" v-model="newTitle" placeholder="Введіть назву гри..." style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e0;" required>
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <div style="flex: 1;">
              <label style="display: block; font-weight: 600; margin-bottom: 4px;">Мін. гравців:</label>
              <input type="number" v-model="newMinPlayers" min="1" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e0;">
            </div>
            <div style="flex: 1;">
              <label style="display: block; font-weight: 600; margin-bottom: 4px;">Макс. гравців:</label>
              <input type="number" v-model="newMaxPlayers" min="1" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e0;">
            </div>
            <div style="flex: 1;">
              <label style="display: block; font-weight: 600; margin-bottom: 4px;">Жанр:</label>
              <select v-model="newGenre" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e0;">
                <option value="Стратегія">Стратегія</option>
                <option value="Для вечірок">Для вечірок</option>
                <option value="Сімейні">Сімейні</option>
                <option value="Карткові">Карткові</option>
              </select>
            </div>
          </div>

          <div v-if="formError" style="color: #e53e3e; font-weight: 600; margin-bottom: 12px;">{{ formError }}</div>

          <button type="submit" class="submit-btn" style="width: 100%; padding: 10px; background: #38a169; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            Зберегти гру
          </button>
        </form>
      </section>

      <!-- Каталог ігор -->
      <section v-else id="games">
        <div class="section-header" style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px;">
          <h2>Каталог настільних ігор</h2>
          <button v-if="selectedGenre !== 'all'" @click="resetFilter" class="submit-btn" style="padding: 8px 16px; width: auto; background: #4a5568;">❌ Скинути фільтр</button>
        </div>

        <p id="games-count">
          Показано ігор: {{ filteredGames.length }} з {{ games.length }}
          <span v-if="selectedGenre !== 'all'"> (Фільтр за жанром: <strong>{{ selectedGenre }}</strong>)</span>
        </p>

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
