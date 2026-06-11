const AUTH_KEY = 'incomeTracker.authenticated';
const DATA_KEY = 'incomeTracker.data';
const SETTINGS_KEY = 'incomeTracker.settings';

const defaultSettings = {
  theme: 'dark',
  accent: '#0ea5e9',
  currency: '$',
  animations: 'enabled',
  compact: false,
  monthlyGoal: 1500,
};

const defaultState = {
  transactions: [],
};

const categories = {
  salary: { label: 'Salary', color: '#38bdf8' },
  sales: { label: 'Sales', color: '#8b5cf6' },
  food: { label: 'Food', color: '#f97316' },
  transport: { label: 'Transport', color: '#22c55e' },
  bills: { label: 'Bills', color: '#f43f5e' },
  investment: { label: 'Investment', color: '#0ea5e9' },
};

let state = { ...defaultState };
let settings = { ...defaultSettings };

const toast = document.getElementById('toast');
const welcomeMessage = document.getElementById('welcomeMessage');
const balanceAmount = document.getElementById('balanceAmount');
const incomeAmount = document.getElementById('incomeAmount');
const expenseAmount = document.getElementById('expenseAmount');
const goalAmount = document.getElementById('goalAmount');
const transactionList = document.getElementById('transactionList');
const flowChart = document.getElementById('flowChart');
const trendLabel = document.getElementById('trendLabel');
const trendChange = document.getElementById('trendChange');
const bestCategory = document.getElementById('bestCategory');
const recommendation = document.getElementById('recommendation');

const transactionForm = document.getElementById('transactionForm');
const transactionTitle = document.getElementById('transactionTitle');
const transactionAmount = document.getElementById('transactionAmount');
const transactionType = document.getElementById('transactionType');
const transactionCategory = document.getElementById('transactionCategory');
const transactionRecurring = document.getElementById('transactionRecurring');
const quickIncome = document.getElementById('quickIncome');
const quickExpense = document.getElementById('quickExpense');
const exportCsvButton = document.getElementById('exportCsv');
const clearAllButton = document.getElementById('clearAll');
const logoutButton = document.getElementById('logoutButton');
const openSettings = document.getElementById('openSettings');
const closeSettings = document.getElementById('closeSettings');
const settingsPanel = document.getElementById('settingsPanel');
const saveSettings = document.getElementById('saveSettings');
const resetSettings = document.getElementById('resetSettings');
const currencyInput = document.getElementById('currencyInput');
const animationsInput = document.getElementById('animationsInput');
const compactInput = document.getElementById('compactInput');
const goalInput = document.getElementById('goalInput');

function authGuard() {
  if (sessionStorage.getItem(AUTH_KEY) !== 'true') {
    window.location.href = 'login.html';
  }
}

function getPersistedState() {
  try {
    return JSON.parse(localStorage.getItem(DATA_KEY)) || defaultState;
  } catch {
    return defaultState;
  }
}

function getPersistedSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function persistState() {
  localStorage.setItem(DATA_KEY, JSON.stringify(state));
}

function persistSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2400);
}

function formatCurrency(amount) {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${settings.currency}${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function applySettings() {
  document.body.dataset.theme = settings.theme;
  document.documentElement.style.setProperty('--accent', settings.accent);
  document.documentElement.style.setProperty('--accent-soft', `${settings.accent}22`);
  document.body.style.transition = settings.animations === 'enabled' ? 'background 300ms ease' : 'none';
  document.body.classList.toggle('compact-mode', settings.compact);
  currencyInput.value = settings.currency;
  animationsInput.value = settings.animations;
  compactInput.value = settings.compact.toString();
  goalInput.value = settings.monthlyGoal;
}

function updateSummary() {
  const income = state.transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = state.transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;
  balanceAmount.textContent = formatCurrency(balance);
  incomeAmount.textContent = formatCurrency(income);
  expenseAmount.textContent = formatCurrency(expense);
  goalAmount.textContent = formatCurrency(settings.monthlyGoal);

  const progress = settings.monthlyGoal > 0 ? Math.min(100, Math.round((balance / settings.monthlyGoal) * 100)) : 0;
  const trend = balance >= 0 ? 'Upward' : 'Needs attention';
  trendLabel.textContent = trend;
  trendChange.textContent = `${balance >= 0 ? '+' : ''}${progress}%`;
  trendChange.className = `tag ${balance >= 0 ? 'positive' : 'negative'}`;

  const categoryTotals = state.transactions.reduce((carry, transaction) => {
    carry[transaction.category] = (carry[transaction.category] || 0) + transaction.amount * (transaction.type === 'income' ? 1 : -1);
    return carry;
  }, {});

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  bestCategory.textContent = topCategory ? categories[topCategory[0]].label : 'No transactions';
  recommendation.textContent = balance >= settings.monthlyGoal
    ? 'You are on track. Try adding a savings target next.'
    : 'Consider making a budget plan and reducing expenses.';
}

function buildChart() {
  const ctx = flowChart.getContext('2d');
  const days = 7;
  const recent = state.transactions.slice(-days).map((transaction, index) => ({ label: `T${index + 1}`, value: transaction.type === 'income' ? transaction.amount : -transaction.amount }));
  const max = Math.max(...recent.map((item) => Math.abs(item.value)), 1);
  ctx.clearRect(0, 0, flowChart.width, flowChart.height);

  const barWidth = flowChart.width / Math.max(5, recent.length + 1);
  recent.forEach((item, index) => {
    const x = index * barWidth + barWidth * 0.5;
    const height = (Math.abs(item.value) / max) * (flowChart.height * 0.55);
    const y = flowChart.height / 2 - (item.value > 0 ? height : -height);
    ctx.fillStyle = item.value >= 0 ? '#22c55e' : '#f97316';
    ctx.fillRect(x, y, barWidth * 0.55, height);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText(item.label, x, flowChart.height - 10);
  });

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, flowChart.height / 2);
  ctx.lineTo(flowChart.width, flowChart.height / 2);
  ctx.stroke();
}

function renderTransactions() {
  transactionList.innerHTML = '';
  state.transactions.slice().reverse().forEach((transaction) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.title}</td>
      <td><span>${transaction.type}</span></td>
      <td><span>${categories[transaction.category]?.label || transaction.category}</span></td>
      <td>${new Date(transaction.date).toLocaleDateString()}</td>
      <td>${formatCurrency(transaction.type === 'expense' ? -transaction.amount : transaction.amount)}</td>
      <td><button data-id="${transaction.id}" class="delete-btn">Delete</button></td>
    `;
    transactionList.appendChild(row);
  });

  document.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      state.transactions = state.transactions.filter((item) => item.id !== id);
      persistState();
      refreshDashboard();
      showToast('Transaction removed');
    });
  });
}

function createTransaction(payload) {
  const entry = {
    id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: payload.title,
    amount: Number(payload.amount),
    type: payload.type,
    category: payload.category,
    recurring: payload.recurring,
    date: new Date().toISOString(),
  };
  state.transactions.push(entry);
  persistState();
  refreshDashboard();
}

function handleFormSubmit(event) {
  event.preventDefault();
  const title = transactionTitle.value.trim();
  const amount = parseFloat(transactionAmount.value);
  if (!title || !amount || Number.isNaN(amount)) {
    showToast('Enter a valid title and amount.');
    return;
  }

  createTransaction({
    title,
    amount,
    type: transactionType.value,
    category: transactionCategory.value,
    recurring: transactionRecurring.value,
  });

  transactionTitle.value = '';
  transactionAmount.value = '';
  transactionType.value = 'income';
  transactionCategory.value = 'salary';
  transactionRecurring.value = 'none';
  showToast('Transaction added successfully');
}

function refreshDashboard() {
  updateSummary();
  renderTransactions();
  buildChart();
}

function exportCsv() {
  const rows = [
    ['Title', 'Type', 'Category', 'Amount', 'Recurring', 'Date'],
    ...state.transactions.map((transaction) => [
      transaction.title,
      transaction.type,
      categories[transaction.category]?.label || transaction.category,
      transaction.amount,
      transaction.recurring,
      new Date(transaction.date).toISOString(),
    ]),
  ];
  const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', 'income-tracker-data.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function applySettingForm() {
  settings = {
    ...settings,
    currency: currencyInput.value.trim() || defaultSettings.currency,
    animations: animationsInput.value,
    compact: compactInput.value === 'true',
    monthlyGoal: Number(goalInput.value) || defaultSettings.monthlyGoal,
  };
  persistSettings();
  applySettings();
  refreshDashboard();
  showToast('Settings updated');
}

function resetToDefaults() {
  settings = { ...defaultSettings };
  persistSettings();
  applySettings();
  refreshDashboard();
  showToast('Settings restored to defaults');
}

function bindSettingsButtons() {
  document.querySelectorAll('[data-theme]').forEach((button) => {
    button.addEventListener('click', () => {
      settings.theme = button.dataset.theme;
      persistSettings();
      applySettings();
      showToast(`Theme changed to ${button.dataset.theme}`);
    });
  });

  document.querySelectorAll('[data-accent]').forEach((button) => {
    button.addEventListener('click', () => {
      settings.accent = button.dataset.accent;
      persistSettings();
      applySettings();
      showToast('Accent updated');
    });
  });
}

function init() {
  authGuard();
  state = getPersistedState();
  settings = getPersistedSettings();
  applySettings();
  refreshDashboard();

  transactionForm.addEventListener('submit', handleFormSubmit);
  quickIncome.addEventListener('click', () => {
    createTransaction({ title: 'Quick Income', amount: 350, type: 'income', category: 'sales', recurring: 'none' });
    showToast('Quick income added');
  });
  quickExpense.addEventListener('click', () => {
    createTransaction({ title: 'Quick Expense', amount: 42.5, type: 'expense', category: 'food', recurring: 'none' });
    showToast('Quick expense added');
  });
  exportCsvButton.addEventListener('click', exportCsv);
  clearAllButton.addEventListener('click', () => {
    if (confirm('Clear all saved transactions and start fresh?')) {
      state.transactions = [];
      persistState();
      refreshDashboard();
      showToast('All transactions cleared');
    }
  });
  logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
  });
  openSettings.addEventListener('click', () => settingsPanel.classList.remove('hidden'));
  closeSettings.addEventListener('click', () => settingsPanel.classList.add('hidden'));
  saveSettings.addEventListener('click', applySettingForm);
  resetSettings.addEventListener('click', resetToDefaults);
  bindSettingsButtons();
}

window.addEventListener('DOMContentLoaded', init);
