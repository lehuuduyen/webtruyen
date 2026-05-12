'use strict';

// Shared API client
window.API = (function () {
  const BASE = '/api';

  function token() { return sessionStorage.getItem('admin-token') || ''; }

  async function req(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token() },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API error');
    return data;
  }

  return {
    get:    (path)        => req('GET',    path),
    post:   (path, body)  => req('POST',   path, body),
    put:    (path, body)  => req('PUT',    path, body),
    del:    (path)        => req('DELETE', path),
  };
})();
