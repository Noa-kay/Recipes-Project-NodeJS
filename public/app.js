const TOKEN_KEY = 'recipes_jwt';
const EMAIL_KEY = 'recipes_email';
const USER_ID_KEY = 'recipes_user_id';
const USER_ROLE_KEY = 'recipes_user_role';

let editingRecipeId = null;
let recipeListPage = 1;

function apiBase() {
  if (window.location.protocol === 'file:') {
    return 'http://127.0.0.1:3000';
  }
  return '';
}

function apiUrl(path) {
  const base = apiBase();
  if (path.startsWith('http')) return path;
  return `${base}${path}`;
}

/** מסלול יחסי (/uploads/...) או מלא לתצוגה ב־img src */
function recipeImageUrl(stored) {
  if (stored == null || stored === '') return '';
  const u = String(stored).trim();
  if (/^https?:\/\//i.test(u)) return u;
  return apiUrl(u.startsWith('/') ? u : `/${u}`);
}

async function apiUploadRecipeImage(file) {
  const form = new FormData();
  form.append('image', file);
  const headers = {};
  if (token()) headers.Authorization = `Bearer ${token()}`;
  let res;
  try {
    res = await fetch(apiUrl('/recipes/upload-image'), { method: 'POST', headers, body: form });
  } catch {
    throw new Error('לא ניתן להעלות תמונה. בדקי חיבור לשרת.');
  }
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || res.statusText || 'שגיאת העלאה';
    throw new Error(msg);
  }
  if (!data?.url) throw new Error('השרת לא החזיר כתובת לתמונה');
  return data.url;
}

function token() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

function setUserEmail(email) {
  if (email) localStorage.setItem(EMAIL_KEY, email);
  else localStorage.removeItem(EMAIL_KEY);
}

function setUserSession(user) {
  const rawId = user?.id ?? user?._id;
  if (rawId != null && rawId !== '') localStorage.setItem(USER_ID_KEY, String(rawId));
  else localStorage.removeItem(USER_ID_KEY);
  if (user?.role) localStorage.setItem(USER_ROLE_KEY, user.role);
  else localStorage.removeItem(USER_ROLE_KEY);
}

function clearUserSession() {
  setToken(null);
  setUserEmail(null);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
}

async function api(path, { method = 'GET', body, sendAuthIfAvailable = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (sendAuthIfAvailable && token()) {
    headers.Authorization = `Bearer ${token()}`;
  }
  let res;
  try {
    res = await fetch(apiUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error('לא ניתן להתחבר לשרת. נסי לרענן את הדף או לבדוק את החיבור.');
  }
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    if (res.status === 401 && token() && !path.startsWith('/auth')) {
      clearUserSession();
      updateSessionUI();
    }
    const msg = data?.error?.message || data?.message || res.statusText || 'שגיאה';
    throw new Error(msg);
  }
  return data;
}

function showAlert(elId, text, type) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!text) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = text;
  el.className = `alert ${type === 'ok' ? 'ok' : 'err'}`;
  el.classList.remove('hidden');
}

function clearRegPassError() {
  const el = document.getElementById('regPassError');
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

function displayRegisterPasswordError(msg) {
  const m = String(msg || '');
  if (/must contain at least one letter and one number/i.test(m)) {
    return 'הסיסמה חייבת לכלול לפחות אות אחת (אנגלית) ומספר אחד.';
  }
  if (/length must be at least 8/i.test(m)) {
    return 'הסיסמה חייבת להכיל לפחות 8 תווים.';
  }
  if (/password/i.test(m) && /required/i.test(m)) {
    return 'נא למלא סיסמה.';
  }
  return m;
}

function splitRegisterErrors(message) {
  const raw = String(message || '');
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const passParts = parts.filter((p) => /password/i.test(p));
  const otherParts = parts.filter((p) => !/password/i.test(p));
  return {
    password: passParts.length ? passParts.join('. ') : '',
    other: otherParts.length ? otherParts.join('. ') : '',
    fallback: parts.length ? '' : raw,
  };
}

function updateRegPassMeter() {
  const input = document.getElementById('regPass');
  const fill = document.getElementById('regPassMeterFill');
  if (!input || !fill) return;
  const v = input.value;
  let n = 0;
  if (v.length >= 8) n += 1;
  if (/[A-Za-z]/.test(v)) n += 1;
  if (/\d/.test(v)) n += 1;
  fill.style.width = `${(n / 3) * 100}%`;
  fill.className = `password-meter__fill password-meter__fill--${n}`;
}

function updateSessionUI() {
  const emailEl = document.getElementById('userEmail');
  const page = document.body?.dataset?.page;
  if (page === 'add-recipe') {
    if (!token()) {
      window.location.replace('/');
      return;
    }
    if (emailEl) emailEl.textContent = localStorage.getItem(EMAIL_KEY) || '';
    return;
  }
  const gate = document.getElementById('gateView');
  const app = document.getElementById('appView');
  if (!gate || !app) return;
  if (token()) {
    gate.classList.add('hidden');
    app.classList.remove('hidden');
    if (emailEl) emailEl.textContent = localStorage.getItem(EMAIL_KEY) || '';
  } else {
    gate.classList.remove('hidden');
    app.classList.add('hidden');
    if (emailEl) emailEl.textContent = '';
    setGateTab('login');
    showAlert('authAlert', '', '');
  }
}

function recipeId(r) {
  if (!r) return '';
  const id = r._id ?? r.id;
  return id != null ? String(id) : '';
}

/** מזהה MongoDB כמחרוזת hex — תומך באובייקט populate, במחרוזת, וב־$oid מ־JSON */
function mongoIdString(val) {
  if (val == null || val === '') return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val).trim();
  if (typeof val === 'object') {
    if (typeof val.toHexString === 'function') return val.toHexString();
    if (val.$oid) return String(val.$oid).trim();
    if (val._id != null) return mongoIdString(val._id);
    if (val.id != null) return mongoIdString(val.id);
  }
  return String(val).trim();
}

function currentUserIdStored() {
  return (localStorage.getItem(USER_ID_KEY) || '').trim();
}

function normalizeIdCompare(a, b) {
  const x = mongoIdString(a);
  const y = mongoIdString(b);
  if (!x || !y) return false;
  if (x.length === 24 && y.length === 24 && /^[a-f0-9]{24}$/i.test(x) && /^[a-f0-9]{24}$/i.test(y)) {
    return x.toLowerCase() === y.toLowerCase();
  }
  return x === y;
}

function canEditRecipe(r) {
  if (!token()) return false;
  const role = (localStorage.getItem(USER_ROLE_KEY) || '').trim();
  if (role === 'admin') return true;
  return normalizeIdCompare(currentUserIdStored(), r?.addedBy);
}

function setGateTab(mode) {
  const loginTab = document.getElementById('tabLogin');
  const regTab = document.getElementById('tabRegister');
  const loginPanel = document.getElementById('loginPanel');
  const regPanel = document.getElementById('registerPanel');
  if (!loginTab || !regTab || !loginPanel || !regPanel) return;
  const isLogin = mode === 'login';
  loginTab.classList.toggle('is-active', isLogin);
  regTab.classList.toggle('is-active', !isLogin);
  loginTab.setAttribute('aria-selected', isLogin ? 'true' : 'false');
  regTab.setAttribute('aria-selected', isLogin ? 'false' : 'true');
  loginPanel.classList.toggle('hidden', !isLogin);
  regPanel.classList.toggle('hidden', isLogin);
  clearRegPassError();
  if (mode === 'register') updateRegPassMeter();
}

if (document.getElementById('tabLogin')) {
  document.getElementById('tabLogin').addEventListener('click', () => {
    setGateTab('login');
    showAlert('authAlert', '', '');
  });

  document.getElementById('tabRegister').addEventListener('click', () => {
    setGateTab('register');
    showAlert('authAlert', '', '');
  });
}

if (document.getElementById('regPass')) {
  document.getElementById('regPass').addEventListener('input', () => {
    updateRegPassMeter();
    clearRegPassError();
  });
}

if (document.getElementById('btnLogin')) {
  document.getElementById('btnLogin').addEventListener('click', async () => {
  showAlert('authAlert', '', '');
  try {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;
    const data = await api('/auth/login', {
      method: 'POST',
      body: { email, password },
      sendAuthIfAvailable: false,
    });
    setToken(data.token);
    setUserEmail(data.user?.email || email);
    setUserSession(data.user);
    updateSessionUI();
    showAlert('authAlert', '', '');
    loadRecipes();
    loadCategoriesStrip();
  } catch (e) {
    showAlert('authAlert', e.message, 'err');
  }
  });
}

if (document.getElementById('btnRegister')) {
  document.getElementById('btnRegister').addEventListener('click', async () => {
  showAlert('authAlert', '', '');
  clearRegPassError();
  try {
    const username = document.getElementById('regUser').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPass').value;
    const data = await api('/auth/register', {
      method: 'POST',
      body: { username, email, password, role: 'user' },
      sendAuthIfAvailable: false,
    });
    setToken(data.token);
    setUserEmail(data.user?.email || email);
    setUserSession(data.user);
    updateSessionUI();
    showAlert('authAlert', '', '');
    loadRecipes();
    loadCategoriesStrip();
  } catch (e) {
    const { password: passMsg, other, fallback } = splitRegisterErrors(e.message);
    const passEl = document.getElementById('regPassError');
    if (passMsg && passEl) {
      passEl.textContent = displayRegisterPasswordError(passMsg);
      passEl.classList.remove('hidden');
    } else {
      clearRegPassError();
    }
    const globalErr = other || (!passMsg ? fallback || e.message : '');
    if (globalErr) showAlert('authAlert', globalErr, 'err');
  }
  });
}

if (document.getElementById('btnLogout')) {
  document.getElementById('btnLogout').addEventListener('click', () => {
    clearUserSession();
    exitEditMode();
    const detail = document.getElementById('recipeDetail');
    if (detail) detail.classList.add('hidden');
    const grid = document.getElementById('recipeGrid');
    if (grid) grid.innerHTML = '';
    updateSessionUI();
    showAlert('authAlert', '', '');
  });
}

if (document.getElementById('recipeGrid')) {
  document.getElementById('btnLoadRecipes').addEventListener('click', () => {
    recipeListPage = 1;
    loadRecipes();
  });

  document.getElementById('searchInput').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      recipeListPage = 1;
      loadRecipes();
    }
  });

  document.getElementById('btnPrev').addEventListener('click', () => {
    if (recipeListPage > 1) {
      recipeListPage -= 1;
      loadRecipes();
    }
  });

  document.getElementById('btnNext').addEventListener('click', () => {
    recipeListPage += 1;
    loadRecipes();
  });
}

async function loadCategoriesStrip() {
  const el = document.getElementById('categoriesStrip');
  if (!el) return;
  try {
    const list = await api('/categories', { sendAuthIfAvailable: true });
    if (!Array.isArray(list) || !list.length) {
      el.innerHTML = '<span class="chip muted">אין קטגוריות עדיין — הוסיפי מתכון</span>';
      return;
    }
    el.innerHTML = list
      .map(
        (c) =>
          `<button type="button" class="chip" data-code="${escapeHtml(c.code)}">${escapeHtml(c.description || c.code)} <small>(${escapeHtml(String(c.recipeCount || 0))})</small></button>`
      )
      .join('');
    el.querySelectorAll('.chip[data-code]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById('searchInput').value = btn.getAttribute('data-code');
        recipeListPage = 1;
        loadRecipes();
      });
    });
  } catch {
    el.innerHTML = '<span class="chip muted">לא נטענו קטגוריות</span>';
  }
}

async function loadRecipes() {
  const grid = document.getElementById('recipeGrid');
  const pagerInfo = document.getElementById('pagerInfo');
  showAlert('listAlert', '', '');
  grid.innerHTML = '<div class="skeleton-grid"><div class="skeleton card-skel"></div><div class="skeleton card-skel"></div><div class="skeleton card-skel"></div></div>';
  try {
    const search = document.getElementById('searchInput').value.trim();
    const limit = document.getElementById('limitInput').value || 10;
    const q = new URLSearchParams({ limit, page: recipeListPage });
    if (search) q.set('search', search);
    const data = await api(`/recipes?${q}`);
    const recipes = data.recipes || [];
    const totalPages =
      data.totalPages != null ? data.totalPages : Math.ceil((data.total || 0) / Number(data.limit || limit));
    const dataPage = Number(data.page);
    if (!recipes.length && (data.total || 0) > 0 && dataPage > totalPages) {
      recipeListPage = Math.max(1, totalPages);
      return loadRecipes();
    }
    recipeListPage = dataPage || recipeListPage;
    pagerInfo.textContent = `עמוד ${data.page} מתוך ${totalPages || 1} · מוצגים ${recipes.length} · סה״כ ${data.total ?? 0} מתכונים`;
    if (!recipes.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <p><strong>אין עדיין מתכונים להצגה</strong></p>
          <p class="muted">התחברי והוסיפי מתכון, או חפשי משהו אחר. (מתכונים פרטיים מוצגים רק אחרי התחברות.)</p>
        </div>`;
      return;
    }
    grid.innerHTML = '';
    grid.className = 'recipe-grid';
    recipes.forEach((r) => {
      const id = recipeId(r);
      const div = document.createElement('article');
      div.className = 'recipe-card';
      div.setAttribute('role', 'button');
      div.tabIndex = 0;
      const cats = (r.categories || [])
        .map((c) => (typeof c === 'object' ? c.code : ''))
        .filter(Boolean)
        .join(' · ');
      const imgSrc = recipeImageUrl(r.image);
      const thumb = imgSrc
        ? `<img src="${escapeHtml(imgSrc)}" alt="" loading="lazy" />`
        : `<div class="thumb-placeholder" aria-hidden="true"><span>${escapeHtml((r.name || '?').slice(0, 1))}</span></div>`;
      div.innerHTML = `
        <div class="recipe-thumb">${thumb}</div>
        <div class="recipe-body">
          <h3>${escapeHtml(r.name)}</h3>
          <p class="recipe-excerpt">${escapeHtml((r.description || '').slice(0, 120))}${(r.description || '').length > 120 ? '…' : ''}</p>
          <div class="recipe-meta">
            <span>${r.preparationTime} דק׳</span>
            <span>קושי ${r.difficulty}</span>
            ${cats ? `<span>${escapeHtml(cats)}</span>` : ''}
            ${r.isPrivate ? '<span class="pill private">פרטי</span>' : ''}
          </div>
        </div>`;
      const open = () => id && showDetail(id);
      div.addEventListener('click', open);
      div.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          open();
        }
      });
      grid.appendChild(div);
    });
  } catch (e) {
    grid.innerHTML = '';
    showAlert('listAlert', e.message, 'err');
  }
}

function escapeHtml(s) {
  if (s == null) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

async function showDetail(id) {
  syncUserClaimsFromToken();
  const box = document.getElementById('recipeDetail');
  box.classList.remove('hidden');
  box.innerHTML = '<p class="muted">טוען…</p>';
  try {
    const r = await api(`/recipes/${id}`);
    const rid = recipeId(r);
    const cats = (r.categories || [])
      .map((c) => (typeof c === 'object' ? `${c.code} (${c.description})` : ''))
      .filter(Boolean)
      .join(' · ');
    const layers = (r.layers || [])
      .map(
        (l) =>
          `<li><strong>${escapeHtml(l.description)}</strong>: ${(l.ingredients || []).map(escapeHtml).join(', ')}</li>`
      )
      .join('');
    const steps = (r.instructions || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('');
    const heroSrc = recipeImageUrl(r.image);
    const heroImg = heroSrc
      ? `<div class="detail-hero"><img src="${escapeHtml(heroSrc)}" alt="" /></div>`
      : '';
    const actions = canEditRecipe(r)
      ? `<div class="detail-actions">
          <button type="button" class="ghost btn-edit-recipe">עריכה</button>
          <button type="button" class="ghost btn-danger btn-delete-recipe">מחיקה</button>
        </div>`
      : '';
    let permHint = '';
    if (!token()) {
      permHint =
        '<p class="detail-perm-hint muted">כמשתמשת אורחת אפשר לצפות במתכונים ציבוריים. התחברי כדי להוסיף מתכונים, לערוך או למחוק (רק מתכונים שלך או כמנהלת).</p>';
    } else if (!canEditRecipe(r)) {
      permHint =
        '<p class="detail-perm-hint muted">עריכה ומחיקה זמינות רק ל<strong>בעלת המתכון</strong> או ל<strong>מנהלת</strong> המערכת.</p>';
    }
    box.innerHTML = `
      ${heroImg}
      <div class="detail-inner">
        ${permHint}
        ${actions}
        <h3>${escapeHtml(r.name)}</h3>
        <p class="recipe-meta">${r.preparationTime} דק׳ · קושי ${r.difficulty}${cats ? ` · ${escapeHtml(cats)}` : ''}</p>
        <p class="lead">${escapeHtml(r.description || '')}</p>
        ${layers ? `<h4>שכבות</h4><ul class="detail-list">${layers}</ul>` : ''}
        ${steps ? `<h4>הוראות הכנה</h4><ol class="detail-list">${steps}</ol>` : ''}
      </div>`;
    box.querySelector('.btn-edit-recipe')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      enterEditMode(r);
    });
    box.querySelector('.btn-delete-recipe')?.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!confirm('למחוק את המתכון? הפעולה בלתי הפיכה.')) return;
      try {
        await api(`/recipes/${rid}`, { method: 'DELETE' });
        box.classList.add('hidden');
        box.innerHTML = '';
        await loadRecipes();
        loadCategoriesStrip();
        showAlert('listAlert', 'המתכון נמחק', 'ok');
      } catch (err) {
        showAlert('listAlert', err.message, 'err');
      }
    });
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    box.innerHTML = `<div class="alert err">${escapeHtml(e.message)}</div>`;
  }
}

function parseIngredientLines(text) {
  const parts = text.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  return parts;
}

function layersToIngredientText(layers) {
  if (!layers?.length) return '';
  return layers
    .map((l) => {
      const ing = (l.ingredients || []).join('\n');
      if (!l.description || l.description === 'מרכיבים') return ing;
      return `${l.description}\n${ing}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

function fillRecipeForm(r) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && 'value' in el) el.value = val;
  };
  set('newName', r.name || '');
  set('newDesc', r.description || '');
  const c0 = r.categories?.[0];
  const code = c0 && typeof c0 === 'object' ? c0.code : '';
  set('newCat', code || '');
  set('newTime', r.preparationTime ?? 30);
  set('newDiff', String(r.difficulty ?? 3));
  set('newIngredients', layersToIngredientText(r.layers));
  set('newSteps', (r.instructions || []).join('\n'));
  set('newImage', r.image || '');
  const fileInput = document.getElementById('newImageFile');
  if (fileInput) fileInput.value = '';
  const priv = document.getElementById('newPrivate');
  if (priv) priv.checked = !!r.isPrivate;
}

function exitEditMode() {
  editingRecipeId = null;
  const titleEl = document.getElementById('recipeFormTitle');
  const btnAdd = document.getElementById('btnAddRecipe');
  const btnCancel = document.getElementById('btnCancelEdit');
  if (titleEl) titleEl.textContent = 'הוספת מתכון חדש';
  if (btnAdd) btnAdd.textContent = 'שמירת המתכון';
  if (btnCancel) btnCancel.classList.add('hidden');
  const clear = (id, fallback) => {
    const el = document.getElementById(id);
    if (el && 'value' in el) el.value = fallback != null ? String(fallback) : '';
  };
  clear('newName', '');
  clear('newDesc', '');
  clear('newCat', '');
  clear('newTime', '30');
  clear('newDiff', '3');
  clear('newIngredients', '');
  clear('newSteps', '');
  clear('newImage', '');
  const fi = document.getElementById('newImageFile');
  if (fi) fi.value = '';
  const priv = document.getElementById('newPrivate');
  if (priv) priv.checked = false;
  showAlert('addAlert', '', '');
}

function enterEditMode(r) {
  const rid = recipeId(r);
  if (!rid) return;
  window.location.href = `/add-recipe.html?edit=${encodeURIComponent(rid)}`;
}

if (document.getElementById('btnCancelEdit')) {
  document.getElementById('btnCancelEdit').addEventListener('click', () => {
    const wasEditing = !!editingRecipeId;
    if (document.body.dataset.page === 'add-recipe' && wasEditing) {
      window.history.replaceState({}, '', '/add-recipe.html');
    }
    exitEditMode();
    if (document.body.dataset.page === 'add-recipe' && !wasEditing) {
      window.location.href = '/';
    }
  });
}

if (document.getElementById('btnAddRecipe')) {
  document.getElementById('btnAddRecipe').addEventListener('click', async () => {
  showAlert('addAlert', '', '');
  if (!token()) {
    showAlert('addAlert', 'התחברי או הירשמי למעלה כדי לשמור מתכון', 'err');
    return;
  }
  const name = document.getElementById('newName').value.trim();
  const description = document.getElementById('newDesc').value.trim();
  const category = document.getElementById('newCat').value.trim();
  if (!name || !description || !category) {
    showAlert('addAlert', 'נא למלא שם מתכון, תיאור וקטגוריה', 'err');
    return;
  }
  const ingText = document.getElementById('newIngredients').value || '';
  const ingredients = parseIngredientLines(ingText);
  const layers =
    ingredients.length > 0
      ? [{ description: 'מרכיבים', ingredients }]
      : [];
  try {
    const preparationTime = Number(document.getElementById('newTime').value);
    const difficulty = Number(document.getElementById('newDiff').value);
    let image = (document.getElementById('newImage').value || '').trim();
    const fileInput = document.getElementById('newImageFile');
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      image = await apiUploadRecipeImage(fileInput.files[0]);
    }
    const instructions = (document.getElementById('newSteps').value || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const isPrivate = document.getElementById('newPrivate').checked;
    const body = {
      name,
      description,
      category,
      categoryDescription: category,
      preparationTime,
      difficulty,
      layers,
      instructions,
      image: editingRecipeId ? image : image || undefined,
      isPrivate,
    };
    if (editingRecipeId) {
      const rid = editingRecipeId;
      await api(`/recipes/${rid}`, { method: 'PUT', body });
      showAlert('addAlert', 'המתכון עודכן בהצלחה', 'ok');
      exitEditMode();
      if (document.body.dataset.page === 'add-recipe') {
        window.location.href = '/';
      } else {
        loadRecipes();
        loadCategoriesStrip();
        const detail = document.getElementById('recipeDetail');
        if (detail && !detail.classList.contains('hidden')) await showDetail(rid);
      }
    } else {
      await api('/recipes', { method: 'POST', body });
      showAlert('addAlert', 'המתכון נשמר בהצלחה', 'ok');
      if (document.body.dataset.page === 'add-recipe') {
        window.location.href = '/';
      } else {
        document.getElementById('newName').value = '';
        document.getElementById('newDesc').value = '';
        document.getElementById('newSteps').value = '';
        document.getElementById('newIngredients').value = '';
        document.getElementById('newImage').value = '';
        if (fileInput) fileInput.value = '';
        loadRecipes();
        loadCategoriesStrip();
      }
    }
  } catch (e) {
    showAlert('addAlert', e.message, 'err');
  }
  });
}

async function initAddRecipePage() {
  syncUserClaimsFromToken();
  document.getElementById('btnPickImage')?.addEventListener('click', () => {
    document.getElementById('newImageFile')?.click();
  });
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('edit');
  if (!editId) return;
  try {
    const r = await api(`/recipes/${editId}`);
    if (!canEditRecipe(r)) {
      showAlert('addAlert', 'אין הרשאה לערוך מתכון זה', 'err');
      window.history.replaceState({}, '', '/add-recipe.html');
      return;
    }
    editingRecipeId = editId;
    const titleEl = document.getElementById('recipeFormTitle');
    const btnAdd = document.getElementById('btnAddRecipe');
    const btnCancel = document.getElementById('btnCancelEdit');
    if (titleEl) titleEl.textContent = 'עריכת מתכון';
    if (btnAdd) btnAdd.textContent = 'עדכון מתכון';
    if (btnCancel) btnCancel.classList.remove('hidden');
    fillRecipeForm(r);
  } catch (e) {
    showAlert('addAlert', e.message, 'err');
    window.history.replaceState({}, '', '/add-recipe.html');
  }
}

function syncUserClaimsFromToken() {
  const t = token();
  if (!t) return;
  try {
    const part = t.split('.')[1];
    if (!part) return;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const payload = JSON.parse(atob(b64 + pad));
    const pid = payload.id ?? payload.sub ?? payload._id;
    if (pid != null && pid !== '') localStorage.setItem(USER_ID_KEY, String(pid));
    if (payload.role) localStorage.setItem(USER_ROLE_KEY, payload.role);
  } catch {
    /* ignore invalid token shape */
  }
}

syncUserClaimsFromToken();
if (document.body.dataset.page === 'add-recipe') {
  updateSessionUI();
  initAddRecipePage();
} else {
  updateSessionUI();
  if (token()) {
    loadCategoriesStrip();
    loadRecipes();
  }
}
