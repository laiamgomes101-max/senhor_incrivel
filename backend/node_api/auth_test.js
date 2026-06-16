(async () => {
  const base = 'http://localhost:3001';
  const random = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const user = { email: `checkuser+${random}@example.com`, password: 'Teste1234', nome: 'Check User', tipo: 'candidato' };

  try {
    console.log('Registering user:', user.email);
    let r = await fetch(base + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    console.log('register status', r.status);
    const regText = await r.text();
    console.log('register body:', regText);

    console.log('Attempting login...');
    r = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password })
    });
    console.log('login status', r.status);
    const loginText = await r.text();
    console.log('login body:', loginText);

    let token = null;
    try {
      const j = JSON.parse(loginText);
      token = j?.data?.token || j?.token || null;
      console.log('extracted token:', token ? '(present)' : '(none)');
    } catch (err) {
      console.warn('Could not parse login JSON:', err.message);
    }

    if (token) {
      console.log('Requesting /api/auth/me with token...');
      r = await fetch(base + '/api/auth/me', { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
      console.log('/me status', r.status);
      console.log('me body:', await r.text());
    }
  } catch (err) {
    console.error('Test script error:', err);
  }
})();
