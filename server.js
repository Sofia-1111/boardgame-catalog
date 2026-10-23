const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

const games = [
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

// Роздача статичних файлів
app.use(express.static(__dirname));

// API Ендпоінти
app.get('/api/games', (req, res) => {
  res.json(games);
});

app.get('/api/games/:id', (req, res) => {
  const game = games.find(g => String(g.id) === String(req.params.id));
  if (!game) {
    return res.status(404).json({ error: 'Гру з таким ID не знайдено' });
  }
  res.json(game);
});

app.listen(PORT, () => {
  console.log(`🚀 Node.js Express сервер запущено на http://localhost:${PORT}`);
});
