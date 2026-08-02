
  const API_BASE = 'https://www.themealdb.com/api/json/v1/1';
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  let weekPlan = {};
  DAYS.forEach(d => weekPlan[d] = []);

  const resultsGrid = document.getElementById('resultsGrid');
  const categoryChips = document.getElementById('categoryChips');
  const searchInput = document.getElementById('searchInput');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalContent = document.getElementById('modalContent');

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }

  function renderResults(meals) {
    if (!meals || !meals.length) {
      resultsGrid.innerHTML = '<p class="empty-state">No recipes found — try another search.</p>';
      return;
    }
    resultsGrid.innerHTML = meals.map(m => `
      <div class="meal-card" onclick="openMeal('${m.idMeal}')">
        <img src="${m.strMealThumb}/preview" alt="${m.strMeal}" loading="lazy">
        <div class="meal-card-body">
          <div class="meal-card-name">${m.strMeal}</div>
          <div class="meal-card-cat">${m.strCategory || m.strArea || ''}</div>
        </div>
      </div>
    `).join('');
  }

  async function searchMeals(query) {
    resultsGrid.innerHTML = '<p class="loading">Searching…</p>';
    try {
      const data = await fetchJSON(`${API_BASE}/search.php?s=${encodeURIComponent(query)}`);
      renderResults(data.meals);
    } catch (err) {
      resultsGrid.innerHTML = '<p class="empty-state">Something went wrong fetching recipes. Try again.</p>';
    }
  }

  async function loadRandom() {
    resultsGrid.innerHTML = '<p class="loading">Rolling the dice…</p>';
    try {
      const requests = Array.from({ length: 6 }, () => fetchJSON(`${API_BASE}/random.php`));
      const results = await Promise.all(requests);
      renderResults(results.map(r => r.meals[0]));
    } catch (err) {
      resultsGrid.innerHTML = '<p class="empty-state">Something went wrong fetching recipes. Try again.</p>';
    }
  }

  async function filterByCategory(category) {
    resultsGrid.innerHTML = '<p class="loading">Loading…</p>';
    try {
      const data = await fetchJSON(`${API_BASE}/filter.php?c=${encodeURIComponent(category)}`);
      renderResults((data.meals || []).slice(0, 18));
    } catch (err) {
      resultsGrid.innerHTML = '<p class="empty-state">Something went wrong fetching recipes. Try again.</p>';
    }
  }

  async function loadCategories() {
    try {
      const data = await fetchJSON(`${API_BASE}/categories.php`);
      const cats = (data.categories || []).slice(0, 10);
      categoryChips.innerHTML = cats.map(c =>
        `<button class="chip" data-cat="${c.strCategory}">${c.strCategory}</button>`
      ).join('');
      categoryChips.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
          categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          filterByCategory(chip.dataset.cat);
        });
      });
    } catch (err) {
      categoryChips.innerHTML = '';
    }
  }

  async function openMeal(id) {
    modalContent.innerHTML = '<p class="loading">Loading recipe…</p>';
    modalOverlay.classList.add('open');
    try {
      const data = await fetchJSON(`${API_BASE}/lookup.php?i=${id}`);
      const meal = data.meals[0];
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ing && ing.trim()) {
          ingredients.push(`<li><strong>${ing}</strong> — ${measure || ''}</li>`);
        }
      }
      const dayOptions = DAYS.map(d => `<option value="${d}">${d}</option>`).join('');

      modalContent.innerHTML = `
        <div class="modal-top">
          <h2>${meal.strMeal}</h2>
          <button class="modal-close" onclick="closeMeal()">×</button>
        </div>
        <div class="modal-tags">
          <span class="modal-tag">${meal.strCategory || ''}</span>
          <span class="modal-tag">${meal.strArea || ''}</span>
        </div>
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <h3>Ingredients</h3>
        <ul class="ingredient-list">${ingredients.join('')}</ul>
        <h3>Instructions</h3>
        <p class="instructions">${meal.strInstructions}</p>
        <div class="add-plan-row">
          <select id="dayPicker">${dayOptions}</select>
          <button onclick="addToPlan('${meal.idMeal}', '${meal.strMeal.replace(/'/g, "\\'")}')" style="background:var(--coral);color:#2A0A0F;border:none;padding:10px 18px;border-radius:10px;font-weight:600;font-size:13.5px;cursor:pointer;">Add to plan</button>
        </div>
      `;
    } catch (err) {
      modalContent.innerHTML = '<p class="empty-state">Could not load this recipe. Try again.</p>';
    }
  }

  function closeMeal() {
    modalOverlay.classList.remove('open');
  }
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeMeal();
  });

  function addToPlan(id, name) {
    const day = document.getElementById('dayPicker').value;
    weekPlan[day].push({ id, name });
    renderWeekPlan();
    closeMeal();
  }

  function removeFromPlan(day, index) {
    weekPlan[day].splice(index, 1);
    renderWeekPlan();
  }

  function renderWeekPlan() {
    const el = document.getElementById('weekPlan');
    el.innerHTML = DAYS.map(day => `
      <div class="plan-day">
        <span class="plan-day-label">${day.toUpperCase()}</span>
        ${weekPlan[day].length
          ? weekPlan[day].map((m, i) => `
              <div class="plan-meal">
                <span>${m.name}</span>
                <button onclick="removeFromPlan('${day}', ${i})" aria-label="Remove">×</button>
              </div>
            `).join('')
          : '<div class="plan-empty">Nothing planned yet</div>'}
      </div>
    `).join('');
  }

  document.getElementById('searchBtn').addEventListener('click', () => {
    const q = searchInput.value.trim();
    if (q) searchMeals(q);
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (q) searchMeals(q);
    }
  });
  document.getElementById('surpriseBtn').addEventListener('click', loadRandom);

  renderWeekPlan();
  loadCategories();
  loadRandom();
