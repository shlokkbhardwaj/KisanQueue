(function (global) {
  'use strict';

  const KEY = 'kq_staff_auth';

  function resolveApiBase() {
    if (global.KQ_API_BASE) {
      return String(global.KQ_API_BASE).replace(/\/+$/, '');
    }

    const loc = global.location || {};

    const isLocal =
      (loc.protocol === 'http:' || loc.protocol === 'https:') &&
      (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1');

    if (isLocal) {
      return 'http://' + loc.hostname + ':5000/api';
    }

    return 'https://kisanqueue-jcgb.onrender.com/api';
  }

  const API = resolveApiBase();

  function get() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');

      if (!s?.token || !s?.staff) {
        return null;
      }

      if (
        s.expiresAt &&
        new Date(s.expiresAt).getTime() <= Date.now()
      ) {
        localStorage.removeItem(KEY);
        return null;
      }

      return s;
    } catch {
      return null;
    }
  }

  async function api(path, opts = {}) {
    const s = get();

    const headers = Object.assign(
      {
        'Content-Type': 'application/json'
      },
      opts.headers || {}
    );

    if (s) {
      headers.Authorization = 'Bearer ' + s.token;
    }

    const r = await fetch(API + path, {
      ...opts,
      headers
    });

    const out = await r.json().catch(() => ({}));

    if (r.status === 401) {
      localStorage.removeItem(KEY);
      location.href = 'page11-staff-login.html';

      throw new Error(
        out.error || 'Staff login required.'
      );
    }

    if (!r.ok) {
      throw new Error(
        out.error || 'Request failed'
      );
    }

    return out;
  }

  async function logout() {
    const s = get();

    try {
      if (s) {
        await api('/staff/auth/logout', {
          method: 'POST'
        });
      }
    } catch {}

    localStorage.removeItem(KEY);

    location.href = 'page11-staff-login.html';
  }

  async function requireAuth() {
    const s = get();

    if (!s) {
      location.href = 'page11-staff-login.html';
      return null;
    }

    try {
      const out = await api('/staff/auth/me');

      return out.data.staff;

    } catch (error) {
      console.error('Staff authentication failed:', error);

      localStorage.removeItem(KEY);

      location.href = 'page11-staff-login.html';

      return null;
    }
  }

  global.KQStaff = {
    API,
    get,
    api,
    logout,
    requireAuth
  };

})(window);
