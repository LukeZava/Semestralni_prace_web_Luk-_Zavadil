let totalIncome = 0;
let totalExpense = 0;
let balance = 0;
let chart; // Instance grafu
const apiKey = '32cf80ae59b012e9d9d163272d41434d'; // API klíč 
let exchangeRates = {}; // Uloženy kurzy pro měny
let history = []; // Historie příjmů a výdajů

// Načítání měnových kurzů z API
document.addEventListener('DOMContentLoaded', function () {
  // Načítání kurzu pro USD → CZK
  fetch(`https://open.er-api.com/v6/latest/USD?apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      if (data && data.rates) {
        exchangeRates['USD'] = data.rates['CZK']; // Kurz USD → CZK
        console.log('Kurz pro USD → CZK načten:', exchangeRates['USD']);
      } else {
        console.error('Chyba při načítání kurzu pro USD:', data);
      }
    })
    .catch(error => console.error('Chyba při načítání API pro USD:', error));

  // Načítání kurzu pro EUR → CZK
  fetch(`https://open.er-api.com/v6/latest/EUR?apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      if (data && data.rates) {
        exchangeRates['EUR'] = data.rates['CZK']; // Kurz EUR → CZK
        console.log('Kurz pro EUR → CZK načten:', exchangeRates['EUR']);
      } else {
        console.error('Chyba při načítání kurzu pro EUR:', data);
      }
    })
    .catch(error => console.error('Chyba při načítání API pro EUR:', error));

  // Načítání uložených dat
  const savedIncome = localStorage.getItem('totalIncome');
  const savedExpense = localStorage.getItem('totalExpense');
  const savedBalance = localStorage.getItem('balance');
  const savedHistory = localStorage.getItem('history');

  if (savedIncome && savedExpense && savedBalance) {
    totalIncome = parseFloat(savedIncome);
    totalExpense = parseFloat(savedExpense);
    balance = parseFloat(savedBalance);
    updateStats();
  }

  if (savedHistory) {
    history = JSON.parse(savedHistory);
    renderHistory();
  }

  createChart();
});

// Převod měny na CZK
function convertCurrency(amount, fromCurrency) {
  if (fromCurrency === 'CZK') {
    // Pokud je měna CZK, neprovádíme žádnou konverzi
    return amount;
  }

  if (!exchangeRates[fromCurrency]) {
    console.error('Kurzy nejsou dostupné pro tuto měnu');
    return 0;
  }

  // Pro EUR a USD konverze na CZK
  if (fromCurrency === 'EUR') {
    // Používáme přímo kurz EUR → CZK
    return amount * exchangeRates['EUR'];
  } else if (fromCurrency === 'USD') {
    // Používáme přímo kurz USD → CZK
    return amount * exchangeRates['USD'];
  }

  console.error('Nepodporovaná měna pro konverzi na CZK');
  return 0;
}

// Přidání do historie
function addToHistory(type, amount, currency) {
  const timestamp = new Date().toLocaleString();
  const entry = `${type}: ${amount.toFixed(2)} ${currency} (${timestamp})`;
  history.push(entry);

  localStorage.setItem('history', JSON.stringify(history));
  renderHistory();
}

// Zobrazení historie
function renderHistory() {
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';

  // Obrátíme pořadí historie, aby nejnovější byly na začátku
  history.slice().reverse().forEach(entry => {
    const listItem = document.createElement('li');
    listItem.textContent = entry;
    historyList.appendChild(listItem);
  });
}

// Přidání příjmu/výdaje
document.getElementById('add-button').addEventListener('click', function () {
  const income = parseFloat(document.getElementById('income').value) || 0;
  const expense = parseFloat(document.getElementById('expense').value) || 0;
  const incomeCurrency = document.getElementById('income-currency').value;
  const expenseCurrency = document.getElementById('expense-currency').value;

  if (income > 0) {
    addToHistory('Příjem', income, incomeCurrency);
    const incomeInCZK = convertCurrency(income, incomeCurrency);
    totalIncome += incomeInCZK;
    balance += incomeInCZK;
  }

  if (expense > 0) {
    addToHistory('Výdaj', expense, expenseCurrency);
    const expenseInCZK = convertCurrency(expense, expenseCurrency);
    totalExpense += expenseInCZK;
    balance -= expenseInCZK;
  }

  updateStats();
  updateChart();

  localStorage.setItem('totalIncome', totalIncome);
  localStorage.setItem('totalExpense', totalExpense);
  localStorage.setItem('balance', balance);

  document.getElementById('income').value = '';
  document.getElementById('expense').value = '';
});

// Aktualizace statistiky
function updateStats() {
  document.getElementById('balance').textContent = `Zůstatek: ${balance.toFixed(2)} Kč`;
  document.getElementById('total-income').textContent = `Celkový příjem: ${totalIncome.toFixed(2)} Kč`;
  document.getElementById('total-expense').textContent = `Celkový výdaj: ${totalExpense.toFixed(2)} Kč`;
}

// Vytvoření grafu
function createChart() {
  const ctx = document.getElementById('finance-chart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Příjmy', 'Výdaje'],
      datasets: [{
        label: 'Finance',
        data: [totalIncome, totalExpense],
        backgroundColor: ['#4CAF50', '#F44336'],
      }]
    }
  });
}

// Aktualizace grafu
function updateChart() {
  chart.data.datasets[0].data = [totalIncome, totalExpense];
  chart.update();
}

