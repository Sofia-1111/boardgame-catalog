// Підтвердження успішного завантаження та виконання зовнішнього скрипта
console.log('script.js підключено');

// Крок 4. Оголошення вихідних даних 
// Масив об'єктів ігор із діапазоном кількості гравців
const boardGames = [
  { title: 'Каркасон', minPlayers: 2, maxPlayers: 5 },
  { title: 'Кодові імена', minPlayers: 2, maxPlayers: 8 },
  { title: 'Квиток на поїзд: Європа', minPlayers: 2, maxPlayers: 5 },
  { title: 'Колонізатори (Catan)', minPlayers: 3, maxPlayers: 4 }
];

// Виведення загальної кількості ігор за допомогою властивості .length
console.log(`Загальна кількість ігор у масиві: ${boardGames.length}`);

// Крок 7. Оголошення стрілкової функції 
// Перевіряє, чи задана кількість гравців (n) потрапляє в діапазон гри

const fitsPlayers = (game, n) => n >= game.minPlayers && n <= game.maxPlayers;

// Крок 5 та Крок 6. Функція фільтрації з циклом for...of та умовами
// Функція filterGamesByPlayers: ітерує масив циклом for...of, класифікує ігри через if/else та формує підсумок

function filterGamesByPlayers(gamesList, targetPlayers) {
  console.log(`\n Пошук ігор для компанії: ${targetPlayers} гравців `);

  let suitableCount = 0; // Лічильник знайдених варіантів

  // Крок 5: цикл for...of для перебору елементів масиву
  for (const game of gamesList) {
    // Крок 6: умовна класифікація гри за результатом виконання стрілкової функції
    if (fitsPlayers(game, targetPlayers)) {
      console.log(` Підходить: "${game.title}" (діапазон: ${game.minPlayers}–${game.maxPlayers} гравців)`);
      suitableCount++;
    } else {
      console.log(` Не підходить: "${game.title}"`);
    }
  }

   // Формування підсумкового повідомлення через тернарний оператор залежно від кількості знайдених ігор
  const summaryText = suitableCount > 0
    ? `Знайдено ${suitableCount} відповідних ігор.`
    : 'Жодна гра не підходить для такої кількості гравців.';

  console.log(`Підсумок: ${summaryText}`);
}

// Тестові виклики для перевірки роботи фільтра з різною кількістю учасників
filterGamesByPlayers(boardGames, 4); // підходять усі 4
filterGamesByPlayers(boardGames, 7); // підходить тільки 1 ("Кодові імена")
filterGamesByPlayers(boardGames, 1); // не підходить жодна
