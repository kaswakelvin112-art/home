
  const CATEGORY_COLORS = {
    'Food': '#FF5D73',
    'Transport': '#FFC857',
    'Airtime & Data': '#5EEAD4',
    'School': '#7F9CF5',
    'Rent': '#F0997B',
    'Entertainment': '#ED93B1',
    'Other': '#B3ACDB'
  };

  const SEED = [
    { id: 1, desc: 'Boda to campus', amount: 6000, category: 'Transport' },
    { id: 2, desc: 'Rolex', amount: 3500, category: 'Food' },
    { id: 3, desc: 'MTN data bundle', amount: 15000, category: 'Airtime & Data' }
  ];

  let expenses = [];
  let nextId = 1;
  let db = null;

  const form = document.getElementById('expenseForm');
  const errorEl = document.getElementById('formError');

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('expense-tracker', 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains('expenses')) {
          req.result.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function dbAll() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('expenses', 'readonly');
      const req = tx.objectStore('expenses').getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function dbAdd(expense) {
    if (!db) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('expenses', 'readwrite');
      tx.objectStore('expenses').put(expense);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function dbDelete(id) {
    if (!db) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('expenses', 'readwrite');
      tx.objectStore('expenses').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const desc = document.getElementById('desc').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;

    if (!desc || !amount || amount <= 0) {
      errorEl.style.display = 'block';
      return;
    }
    errorEl.style.display = 'none';

    const expense = { id: nextId++, desc, amount, category };
    expenses.unshift(expense);
    await dbAdd(expense);
    form.reset();
    render();
  });

  function formatUGX(n) {
    return 'UGX ' + Math.round(n).toLocaleString('en-UG');
  }

  async function deleteExpense(id) {
    expenses = expenses.filter(x => x.id !== id);
    await dbDelete(id);
    render();
  }

  function render() {
    const total = expenses.reduce((sum, x) => sum + x.amount, 0);
    document.getElementById('totalSpent').textContent = formatUGX(total);
    document.getElementById('totalCount').textContent = expenses.length;

    const byCategory = {};
    expenses.forEach(x => { byCategory[x.category] = (byCategory[x.category] || 0) + x.amount; });
    const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    document.getElementById('topCategory').textContent = sortedCats.length ? sortedCats[0][0] : '—';

    const breakdownEl = document.getElementById('breakdown');
    if (!sortedCats.length) {
      breakdownEl.innerHTML = '<p class="empty-state">No expenses yet — add one above to see the breakdown.</p>';
    } else {
      breakdownEl.innerHTML = sortedCats.map(([cat, amt]) => {
        const pct = total ? Math.round((amt / total) * 100) : 0;
        const color = CATEGORY_COLORS[cat] || '#B3ACDB';
        return `<div class="breakdown-row">
          <span class="breakdown-label">${cat}</span>
          <div class="breakdown-track"><div class="breakdown-fill" style="width:${pct}%;background:${color};"></div></div>
          <span class="breakdown-pct">${pct}%</span>
        </div>`;
      }).join('');
    }

    const txList = document.getElementById('txList');
    if (!expenses.length) {
      txList.innerHTML = '<li class="empty-state">No transactions yet.</li>';
    } else {
      txList.innerHTML = expenses.map(x => {
        const color = CATEGORY_COLORS[x.category] || '#B3ACDB';
        return `<li class="tx-row">
          <span class="tx-dot" style="background:${color};"></span>
          <span>
            <div class="tx-desc">${x.desc}</div>
            <div class="tx-cat">${x.category}</div>
          </span>
          <span class="tx-amount">${formatUGX(x.amount)}</span>
          <button class="tx-del" onclick="deleteExpense(${x.id})" aria-label="Delete">×</button>
        </li>`;
      }).join('');
    }
  }

  async function init() {
    try {
      db = await openDB();
      const rows = await dbAll();
      if (rows.length) {
        expenses = rows.sort((a, b) => b.id - a.id);
        nextId = Math.max(...rows.map(x => x.id)) + 1;
      } else {
        expenses = [...SEED];
        nextId = SEED.length + 1;
        await Promise.all(SEED.map(x => dbAdd(x)));
      }
    } catch (err) {
      db = null;
      expenses = [...SEED];
      nextId = SEED.length + 1;
    }
    render();
  }

  init();
