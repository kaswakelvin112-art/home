const API = 'https://api.frankfurter.app';
const RATE_CACHE = new Map();

const CURRENCIES = {
  'AUD': 'Australian Dollar',
  'BRL': 'Brazilian Real',
  'CAD': 'Canadian Dollar',
  'CHF': 'Swiss Franc',
  'CNY': 'Chinese Renminbi',
  'CZK': 'Czech Koruna',
  'DKK': 'Danish Krone',
  'EUR': 'Euro',
  'GBP': 'British Pound',
  'HKD': 'Hong Kong Dollar',
  'HUF': 'Hungarian Forint',
  'IDR': 'Indonesian Rupiah',
  'ILS': 'Israeli New Shekel',
  'INR': 'Indian Rupee',
  'ISK': 'Icelandic Krona',
  'JPY': 'Japanese Yen',
  'KRW': 'South Korean Won',
  'MXN': 'Mexican Peso',
  'MYR': 'Malaysian Ringgit',
  'NOK': 'Norwegian Krone',
  'NZD': 'New Zealand Dollar',
  'PHP': 'Philippine Peso',
  'PLN': 'Polish Zloty',
  'RON': 'Romanian Leu',
  'SEK': 'Swedish Krona',
  'SGD': 'Singapore Dollar',
  'THB': 'Thai Baht',
  'TRY': 'Turkish Lira',
  'USD': 'US Dollar',
  'ZAR': 'South African Rand'
};

const POPULAR = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR', 'SGD', 'KRW', 'MXN', 'ZAR'];

const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('fromCurrency');
const toSelect = document.getElementById('toCurrency');
const swapBtn = document.getElementById('swapBtn');
const convertBtn = document.getElementById('convertBtn');
const errorEl = document.getElementById('error');
const resultPanel = document.getElementById('resultPanel');
const resultLabel = document.getElementById('resultLabel');
const resultValue = document.getElementById('resultValue');
const resultMeta = document.getElementById('resultMeta');
const ratesGrid = document.getElementById('ratesGrid');
const ratesTitle = document.getElementById('ratesTitle');
const ratesDate = document.getElementById('ratesDate');

function populateSelects() {
  Object.entries(CURRENCIES).forEach(([code, name]) => {
    fromSelect.add(new Option(code + ' · ' + name, code));
    toSelect.add(new Option(code + ' · ' + name, code));
  });
  fromSelect.value = 'USD';
  toSelect.value = 'EUR';
}

function formatAmount(n) {
  if (!isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatRate(r) {
  if (r == null || !isFinite(r)) return '—';
  return r.toLocaleString('en-US', { maximumFractionDigits: r < 1 ? 6 : 4 });
}

async function fetchRates(base) {
  if (RATE_CACHE.has(base)) return RATE_CACHE.get(base);
  const res = await fetch(API + '/latest?from=' + encodeURIComponent(base));
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (!data.rates) throw new Error('No rate data returned');
  RATE_CACHE.set(base, data);
  return data;
}

function renderResult(amount, from, to, rate, date) {
  resultLabel.textContent = formatAmount(amount) + ' ' + from + ' =';
  resultValue.innerHTML = formatAmount(amount * rate) + ' <span>' + to + '</span>';
  resultMeta.textContent = '1 ' + from + ' = ' + formatRate(rate) + ' ' + to + ' · updated ' + date;
  resultPanel.hidden = false;
}

function renderRates(data, base) {
  ratesTitle.textContent = 'Rates vs ' + base;
  ratesDate.textContent = 'Reference rates · ' + data.date;
  ratesGrid.innerHTML = POPULAR
    .filter(code => code !== base)
    .map(code => {
      const value = data.rates[code];
      return '<div class="rate-card">' +
        '<div class="rate-code">' + code + '</div>' +
        '<div class="rate-name">' + (CURRENCIES[code] || code) + '</div>' +
        '<div class="rate-value">' + formatRate(value) + '</div>' +
      '</div>';
    })
    .join('');
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}

function setBusy(busy) {
  convertBtn.disabled = busy;
  convertBtn.textContent = busy ? 'Converting…' : 'Convert';
}

async function convert(showEmptyError) {
  errorEl.style.display = 'none';
  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount < 0) {
    resultPanel.hidden = true;
    if (showEmptyError) showError('Enter an amount greater than or equal to zero.');
    return;
  }
  const from = fromSelect.value;
  const to = toSelect.value;

  setBusy(true);
  try {
    const data = await fetchRates(from);
    if (from === to) {
      renderResult(amount, from, to, 1, data.date);
    } else if (data.rates[to] == null) {
      showError('No rate available for ' + to + '.');
    } else {
      renderResult(amount, from, to, data.rates[to], data.date);
    }
    renderRates(data, from);
  } catch (err) {
    resultPanel.hidden = true;
    showError('Could not reach the rate service. Check your connection and try again.');
  } finally {
    setBusy(false);
  }
}

function swap() {
  const tmp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = tmp;
  convert(false);
}

let debounceTimer;
amountInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => convert(false), 300);
});
fromSelect.addEventListener('change', () => convert(false));
toSelect.addEventListener('change', () => convert(false));
convertBtn.addEventListener('click', () => convert(true));
swapBtn.addEventListener('click', swap);
amountInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') convert(true);
});

populateSelects();
amountInput.value = '100';
convert(false);
