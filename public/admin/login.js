(function () {
  if (sessionStorage.getItem('admin-token')) {
    location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const errEl = document.getElementById('loginError');
  const passInput = document.getElementById('password');
  const passToggle = document.getElementById('passToggle');
  const btn = document.getElementById('btnLogin');

  passToggle.addEventListener('click', function () {
    if (passInput.type === 'password') {
      passInput.type = 'text';
      passToggle.textContent = '🙈';
    } else {
      passInput.type = 'password';
      passToggle.textContent = '👁';
    }
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;

    btn.textContent = 'Đang kiểm tra...';
    btn.disabled = true;
    errEl.textContent = '';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        sessionStorage.setItem('admin-token', data.token);
        sessionStorage.setItem('admin-user', data.user);
        location.href = 'dashboard.html';
      } else {
        errEl.textContent = '❌ ' + (data.error || 'Sai tên đăng nhập hoặc mật khẩu');
        btn.textContent = 'Đăng Nhập';
        btn.disabled = false;
        passInput.value = '';
        passInput.focus();
      }
    } catch {
      errEl.textContent = '❌ Không kết nối được server';
      btn.textContent = 'Đăng Nhập';
      btn.disabled = false;
    }
  });
})();
