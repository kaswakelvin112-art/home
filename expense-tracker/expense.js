
  const CATEGORY_COLORS = {
    'Food': '#FF5D73',
    'Transport': '#FFC857',
    'Airtime & Data': '#5EEAD4',
    'School': '#7F9CF5',
    'Rent': '#F0997B',
    'Entertainment': '#ED93B1',
    'Other': '#B3ACDB'
  };

  let expenses = [
    { id: 1, desc: 'Boda to campus', amount: 6000, category: 'Transport' },
    { id: 2, desc: 'Rolex', amount: 3500, category: 'Food' },
    { id: 3, desc: 'MTN data bundle', amount: 15000, category: 'Airtime & Data' }
  ];
  let nextId = 4;

  const form = document.getElementById('expenseForm');
  const errorEl = document.getElementById('formError');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('desc').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;

    if (!desc || !amount || amount <= 0) {
      errorEl.style.display = 'block';
      return;
    }
    errorEl.style.display = 'none';

    expenses.unshift({ id: nextId++, desc, amount, category });
    form.reset();
    render();
  });

  function formatUGX(n) {
    return 'UGX ' + Math.round(n).toLocaleString('en-UG');
  }

  function deleteExpense(id) {
    expenses = expenses.filter(x => x.id !== id);
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
  render();