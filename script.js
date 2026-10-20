// Підтвердження успішного завантаження та виконання зовнішнього скрипта
console.log('script.js підключено (ЛР10)');

// Вихідні дані: масив об'єктів з усіма полями з розмітки 
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

// Стрілкова функція для перевірки діапазону гравців
const fitsPlayers = (game, n) => n >= game.minPlayers && n <= game.maxPlayers;

const API_URL = 'https://jsonplaceholder.typicode.com/todos?userId=1';

// Крок 4 & 6: Дочірній компонент GameCard 
// Props: title, minPlayers, maxPlayers, genre (+ додаткові поля)
// Подія: клік по жанру передає $emit('filter', genre) батьківському компоненту

const GameCard = {
  name: 'GameCard',
  props: ['id', 'title', 'minPlayers', 'maxPlayers', 'genre', 'description', 'image'],
  emits: ['filter'],
  template: `
    <article class="game-card">
      <img :src="image" :alt="'Обкладинка гри ' + title">
      <div class="card-body">
        <div class="badge-group">
          <span class="badge badge--players">👥 {{ minPlayers }}–{{ maxPlayers }} гравців</span>
          
          <!-- Крок 6: Інтерактивна подія варіанта. Клік по плашці жанру викликає подію filter -->
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

// Крок 3, 5, 8: Головний екземпляр Vue-застосунку

const { createApp } = Vue;

const app = createApp({
  data() {
    return {
      // ВЛАСНІ дані каталогу перенесені в реактивний стан
      games: [...boardGames],
      selectedGenre: 'all',
      loading: false,
      errorMessage: '',

      // Поля форми з ЛР8 у Vue-стані (v-model)
      newTitle: '',
      newMinPlayers: 2,
      newMaxPlayers: 4,
      newGenre: 'Стратегія',
      formError: ''
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
    // Доповнення реактивного стану додатковими даними з API
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

        const genres = ['Стратегія', 'Для вечірок', 'Сімейні', 'Пригоди'];

        // Мапінг API-даних у формат нашого об'єкта
        const apiGames = rawData.slice(0, 4).map((item, index) => ({
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

        // Об'єднуємо ВЛАСНІ ігри з тими, що отримали з API
        this.games = [...boardGames, ...apiGames];

      } catch (error) {
        console.error('Помилка завантаження даних:', error);
        this.errorMessage = 'Не вдалося завантажити додаткові дані з сервера.';
      } finally {
        this.loading = false;
      }
    },

    //Обробка форми додавання нових ігор у Vue
    handleAddGame() {
      this.formError = '';

      if (!this.newTitle.trim()) {
        this.formError = 'Будь ласка, заповніть назву гри!';
        return;
      }

      if (Number(this.newMinPlayers) > Number(this.newMaxPlayers)) {
        this.formError = 'Мінімальна кількість гравців не може перевищувати максимальну!';
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

      // Додаємо нову гру в реактивний масив
      this.games.push(newGame);

      // Очищаємо поля форми
      this.newTitle = '';
      this.newMinPlayers = 2;
      this.newMaxPlayers = 4;
      this.newGenre = 'Стратегія';
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
    // Автоматично завантажуємо дані при старті Vue
    this.loadGamesFromAPI();
  }
});

// Глобальна реєстрація компонента та монтування
app.component('game-card', GameCard);
app.mount('#app');
