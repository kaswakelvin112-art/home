const API = 'https://open.er-api.com/v6/latest';
const RATE_CACHE = new Map();

const CURRENCIES = {
  'AOA': 'Angolan Kwanza',
  'AUD': 'Australian Dollar',
  'BIF': 'Burundian Franc',
  'BRL': 'Brazilian Real',
  'BWP': 'Botswana Pula',
  'CAD': 'Canadian Dollar',
  'CDF': 'Congolese Franc',
  'CHF': 'Swiss Franc',
  'CNY': 'Chinese Renminbi',
  'CVE': 'Cape Verdean Escudo',
  'CZK': 'Czech Koruna',
  'DJF': 'Djiboutian Franc',
  'DKK': 'Danish Krone',
  'DZD': 'Algerian Dinar',
  'EGP': 'Egyptian Pound',
  'ERN': 'Eritrean Nakfa',
  'ETB': 'Ethiopian Birr',
  'EUR': 'Euro',
  'GBP': 'British Pound',
  'GHS': 'Ghanaian Cedi',
  'GMD': 'Gambian Dalasi',
  'GNF': 'Guinean Franc',
  'HKD': 'Hong Kong Dollar',
  'HUF': 'Hungarian Forint',
  'IDR': 'Indonesian Rupiah',
  'ILS': 'Israeli New Shekel',
  'INR': 'Indian Rupee',
  'ISK': 'Icelandic Krona',
  'JPY': 'Japanese Yen',
  'KES': 'Kenyan Shilling',
  'KRW': 'South Korean Won',
  'LRD': 'Liberian Dollar',
  'LSL': 'Lesotho Loti',
  'LYD': 'Libyan Dinar',
  'MAD': 'Moroccan Dirham',
  'MGA': 'Malagasy Ariary',
  'MRU': 'Mauritanian Ouguiya',
  'MUR': 'Mauritian Rupee',
  'MWK': 'Malawian Kwacha',
  'MXN': 'Mexican Peso',
  'MYR': 'Malaysian Ringgit',
  'MZN': 'Mozambican Metical',
  'NAD': 'Namibian Dollar',
  'NGN': 'Nigerian Naira',
  'NOK': 'Norwegian Krone',
  'NZD': 'New Zealand Dollar',
  'PHP': 'Philippine Peso',
  'PLN': 'Polish Zloty',
  'RON': 'Romanian Leu',
  'RWF': 'Rwandan Franc',
  'SCR': 'Seychellois Rupee',
  'SDG': 'Sudanese Pound',
  'SEK': 'Swedish Krona',
  'SGD': 'Singapore Dollar',
  'SLL': 'Sierra Leonean Leone',
  'SOS': 'Somali Shilling',
  'SSP': 'South Sudanese Pound',
  'STN': 'Sao Tomean Dobra',
  'SZL': 'Swazi Lilangeni',
  'THB': 'Thai Baht',
  'TND': 'Tunisian Dinar',
  'TRY': 'Turkish Lira',
  'TZS': 'Tanzanian Shilling',
  'UGX': 'Ugandan Shilling',
  'USD': 'US Dollar',
  'XAF': 'Central African CFA Franc',
  'XOF': 'West African CFA Franc',
  'ZAR': 'South African Rand',
  'ZMW': 'Zambian Kwacha',
  'ZWL': 'Zimbabwean Dollar'
};

const POPULAR = ['EUR', 'GBP', 'JPY', 'CNY', 'USD', 'ZAR', 'UGX', 'KES', 'TZS', 'NGN', 'GHS', 'EGP'];

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
  Object.keys(CURRENCIES).sort().forEach(code => {
    fromSelect.add(new Option(code + ' · ' + CURRENCIES[code], code));
    toSelect.add(new Option(code + ' · ' + CURRENCIES[code], code));
  });
  fromSelect.value = 'USD';
  toSelect.value = 'UGX';
}

function formatAmount(n) {
  if (!isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatRate(r) {
  if (r == null || !isFinite(r)) return '—';
  return r.toLocaleString('en-US', { maximumFractionDigits: r < 1 ? 6 : 2 });
}

function formatDate(s) {
  if (!s) return '';
  const parts = String(s).split(' ');
  return parts.slice(0, 4).join(' ');
}

async function fetchRates(base) {
  if (RATE_CACHE.has(base)) return RATE_CACHE.get(base);
  const res = await fetch(API + '/' + encodeURIComponent(base));
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (data.result !== 'success' || !data.rates) throw new Error('No rate data returned');
  RATE_CACHE.set(base, data);
  return data;
}

function renderResult(amount, from, to, rate, date) {
  resultLabel.textContent = formatAmount(amount) + ' ' + from + ' =';
  resultValue.innerHTML = formatAmount(amount * rate) + ' <span>' + to + '</span>';
  resultMeta.textContent = '1 ' + from + ' = ' + formatRate(rate) + ' ' + to + ' · updated ' + formatDate(date);
  resultPanel.hidden = false;
}

function renderRates(data, base) {
  ratesTitle.textContent = 'Rates vs ' + base;
  ratesDate.textContent = 'Reference rates · updated ' + formatDate(data.time_last_update_utc);
  ratesGrid.innerHTML = POPULAR
    .filter(code => code !== base && data.rates[code] != null)
    .map(code => {
      return '<div class="rate-card">' +
        '<div class="rate-code">' + code + '</div>' +
        '<div class="rate-name">' + (CURRENCIES[code] || code) + '</div>' +
        '<div class="rate-value">' + formatRate(data.rates[code]) + '</div>' +
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
      renderResult(amount, from, to, 1, data.time_last_update_utc);
    } else if (data.rates[to] == null) {
      showError('No rate available for ' + to + '.');
    } else {
      renderResult(amount, from, to, data.rates[to], data.time_last_update_utc);
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
