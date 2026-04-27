/**
 * Smoke test: same flows as Postman/Thunder (HTTP client).
 * Run with server already up: npm run smoke
 * Or: BASE_URL=http://127.0.0.1:3000 npm run smoke
 */

const base = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;

async function http(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log('Smoke API against', base);

  let r = await http('GET', '/health');
  assert(r.status === 200 && r.data?.status === 'ok', `health: ${r.status} ${JSON.stringify(r.data)}`);
  console.log('OK GET /health');

  r = await http('POST', '/auth/register', {
    body: {
      username: 'admin_smoke',
      email: 'admin_smoke@example.com',
      password: 'Pass1234',
      role: 'admin',
    },
  });
  assert(r.status === 201 && r.data?.token, `register admin: ${r.status} ${JSON.stringify(r.data)}`);
  const adminToken = r.data.token;
  const adminId = r.data.user.id;
  console.log('OK POST /auth/register (admin)');

  r = await http('GET', '/users', { token: adminToken });
  assert(r.status === 200 && Array.isArray(r.data), `list users: ${r.status}`);
  console.log('OK GET /users');

  r = await http('POST', '/auth/register', {
    body: {
      username: 'user_smoke',
      email: 'user_smoke@example.com',
      password: 'Pass1234',
      role: 'user',
    },
  });
  assert(r.status === 201 && r.data?.token, `register user: ${r.status}`);
  const userToken = r.data.token;
  const userId = r.data.user.id;
  console.log('OK POST /auth/register (user)');

  r = await http('POST', '/auth/login', {
    body: { email: 'user_smoke@example.com', password: 'Pass1234' },
  });
  assert(r.status === 200 && r.data?.token, `login: ${r.status}`);
  console.log('OK POST /auth/login');

  r = await http('POST', '/recipes', {
    token: userToken,
    body: {
      name: 'Chocolate Cake',
      description: 'Rich chocolate cake',
      category: 'cakes',
      categoryDescription: 'Cakes and desserts',
      preparationTime: 45,
      difficulty: 3,
      layers: [{ description: 'Base', ingredients: ['flour', 'cocoa', 'sugar'] }],
      instructions: ['Mix', 'Bake at 180C'],
      image: 'https://example.com/cake.jpg',
      isPrivate: false,
    },
  });
  assert(r.status === 201 && r.data?._id, `create recipe: ${r.status} ${JSON.stringify(r.data)}`);
  const recipeId = r.data._id;
  console.log('OK POST /recipes');

  r = await http('GET', `/recipes?search=choco&limit=5&page=1`, { token: userToken });
  assert(r.status === 200 && Array.isArray(r.data?.recipes), `list recipes: ${r.status}`);
  console.log('OK GET /recipes?search=&limit=&page=');

  r = await http('GET', `/recipes/${recipeId}`, { token: userToken });
  assert(r.status === 200 && r.data?._id === recipeId, `get recipe: ${r.status}`);
  console.log('OK GET /recipes/:id');

  r = await http('GET', '/recipes/max-time/60', { token: userToken });
  assert(r.status === 200 && Array.isArray(r.data), `max-time: ${r.status}`);
  console.log('OK GET /recipes/max-time/:minutes');

  r = await http('PUT', `/recipes/${recipeId}`, {
    token: userToken,
    body: { preparationTime: 40, difficulty: 2 },
  });
  assert(r.status === 200 && r.data?.preparationTime === 40, `update recipe: ${r.status}`);
  console.log('OK PUT /recipes/:id');

  r = await http('GET', '/categories');
  assert(r.status === 200 && Array.isArray(r.data), `categories: ${r.status}`);
  console.log('OK GET /categories');

  r = await http('GET', '/categories/with-recipes');
  assert(r.status === 200 && Array.isArray(r.data), `categories+recipes: ${r.status}`);
  console.log('OK GET /categories/with-recipes');

  r = await http('GET', '/api/categories/cakes');
  assert(r.status === 200 && r.data?.code === 'cakes', `category by key: ${r.status}`);
  console.log('OK GET /categories/:key');

  r = await http('PATCH', `/users/${userId}/password`, {
    token: userToken,
    body: { oldPassword: 'Pass1234', newPassword: 'Newpass123' },
  });
  assert(r.status === 200, `patch password: ${r.status} ${JSON.stringify(r.data)}`);
  console.log('OK PATCH /users/:id/password');

  r = await http('DELETE', `/recipes/${recipeId}`, { token: userToken });
  assert(r.status === 200, `delete recipe: ${r.status}`);
  console.log('OK DELETE /recipes/:id');

  r = await http('DELETE', `/users/${userId}`, { token: adminToken });
  assert(r.status === 200, `delete user: ${r.status}`);
  console.log('OK DELETE /users/:id (admin)');

  console.log('\nAll smoke checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
