/*
 * kq-app.js - shared helpers for the Kisan Queue / Farmer Queue farmer pages.
 *
 *   KQ.api(path, options)     talk to the backend (one place for API_BASE, auth header, errors)
 *   KQ.requireLogin()         send visitors who are not logged in to the login page
 *   KQ.logout()               revoke the session on the server, clear it here
 *   KQ.mountAuthUI()          show "who is logged in" + a Logout button in the page header
 *   KQ.fmt                    date / time / status formatting
 *   KQ.getLocation()          optional browser geolocation (never stored)
 *
 * Security notes
 *   - The password is only ever sent to POST /auth/login or /auth/register. It is never stored.
 *   - What is stored in the browser is a random session token (revocable on the server) and the
 *     farmer's public profile fields - no password, no password hash.
 */
(function (global) {
  'use strict';

  var AUTH_KEY = 'kq_auth';
  var LEGACY_FARMER_KEY = 'Kisan Queue_farmer';            // key name kept exactly as the old pages use it
  var LEGACY_BOOKING_KEY = 'Kisan Queue_booking';
  var LEGACY_PREFS_KEY = 'Kisan Queue_booking_preferences';
  var LOGIN_PAGE = 'page02a-farmer-login.html';

  var KQ = {};

  /* ---------------------------------------------------------------- config */

  function resolveApiBase() {
    if (global.KQ_API_BASE) return String(global.KQ_API_BASE).replace(/\/+$/, '');
    var loc = global.location || {};
    var sameMachine = (loc.protocol === 'http:' || loc.protocol === 'https:') &&
      (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1');
    // Talk to the backend on the same host name the page was opened with (localhost vs 127.0.0.1).
    return 'http://' + (sameMachine ? loc.hostname : 'localhost') + ':5000/api';
  }
  KQ.API_BASE = resolveApiBase();

  /* --------------------------------------------------------------- session */

  function safeParse(text) {
    try { return JSON.parse(text); } catch (e) { return null; }
  }

  function readFrom(storage) {
    try {
      var raw = storage.getItem(AUTH_KEY);
      if (!raw) return null;
      var session = safeParse(raw);
      if (!session || !session.token || !session.farmer) { storage.removeItem(AUTH_KEY); return null; }
      if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
        storage.removeItem(AUTH_KEY);
        return null;
      }
      return session;
    } catch (e) { return null; }
  }

  KQ.getSession = function () {
    return readFrom(global.localStorage) || readFrom(global.sessionStorage);
  };

  KQ.isLoggedIn = function () { return !!KQ.getSession(); };

  KQ.getFarmer = function () {
    var s = KQ.getSession();
    return s ? s.farmer : null;
  };

  KQ.saveSession = function (data, remember) {
    var session = { token: data.token, expiresAt: data.expiresAt, farmer: data.farmer };
    KQ.clearSession();
    var storage = remember === false ? global.sessionStorage : global.localStorage;
    storage.setItem(AUTH_KEY, JSON.stringify(session));
    // The older pages read the farmer profile from this key.
    try { global.localStorage.setItem(LEGACY_FARMER_KEY, JSON.stringify(data.farmer)); } catch (e) { /* storage full / blocked */ }
    return session;
  };

  KQ.clearSession = function () {
    [global.localStorage, global.sessionStorage].forEach(function (storage) {
      try {
        storage.removeItem(AUTH_KEY);
        storage.removeItem(LEGACY_FARMER_KEY);
        storage.removeItem(LEGACY_BOOKING_KEY);
        storage.removeItem(LEGACY_PREFS_KEY);
      } catch (e) { /* ignore */ }
    });
  };

  /* ---------------------------------------------------------------- errors */

  function KQError(kind, message, extra) {
    var err = new Error(message);
    err.name = 'KQError';
    err.kind = kind;                 // 'network' | 'timeout' | 'http' | 'auth' | 'parse'
    Object.assign(err, extra || {});
    return err;
  }

  /** Turns any error into a message that is safe and useful to show a farmer / developer. */
  KQ.describeError = function (err, action) {
    action = action || 'complete this request';
    if (!err) return 'Unable to ' + action + '. Please try again.';
    if (err.kind === 'network') {
      return 'Unable to ' + action + ': cannot reach the server (' + KQ.API_BASE +
        '). Check your internet connection. If you are the developer, make sure the backend is running ' +
        '(npm.cmd run dev) and that this page was opened from an address allowed by FRONTEND_ORIGIN.';
    }
    if (err.kind === 'timeout') return 'Unable to ' + action + ': the server took too long to answer. Please try again.';
    if (err.kind === 'auth') return 'Your session has expired. Please log in again.';
    if (err.status >= 500) {
      return 'Unable to ' + action + ': server error' + (err.message ? ' (' + err.message + ')' : '') + '.' +
        (err.hint ? ' ' + err.hint : '');
    }
    return err.message || ('Unable to ' + action + '. Please try again.');
  };

  /* ------------------------------------------------------------------- api */

  /**
   * KQ.api('/crops')
   * KQ.api('/bookings', { method: 'POST', body: {...} })
   * options.auth: true (default, sends the token when logged in) | false (never send it)
   * Resolves with the parsed JSON body ({ success, data, ... }); rejects with a KQError.
   */
  KQ.api = function (path, options) {
    options = options || {};
    var method = options.method || 'GET';
    var headers = { Accept: 'application/json' };
    var session = options.auth === false ? null : KQ.getSession();
    if (session) headers.Authorization = 'Bearer ' + session.token;
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';

    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timedOut = false;
    var timer = controller ? setTimeout(function () { timedOut = true; controller.abort(); }, options.timeoutMs || 20000) : null;

    return fetch(KQ.API_BASE + path, {
      method: method,
      headers: headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      return res.text().then(function (text) {
        var json = text ? safeParse(text) : {};
        if (json === null) {
          throw KQError('parse', 'The server sent an unreadable response.', { status: res.status });
        }
        if (res.status === 401 && session && !options.noAuthRedirect) {
          KQ.clearSession();
          KQ.redirectToLogin();
          throw KQError('auth', json.error || 'Please log in to continue.', { status: 401, code: json.code });
        }
        if (!res.ok || json.success === false) {
          throw KQError('http', json.error || ('Request failed (' + res.status + ').'),
            { status: res.status, code: json.code, hint: json.hint, body: json });
        }
        return json;
      });
    }, function (fetchError) {
      throw KQError(timedOut ? 'timeout' : 'network', fetchError && fetchError.message);
    }).then(function (result) {
      if (timer) clearTimeout(timer);
      return result;
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  };

  /* ---------------------------------------------------------------- guards */

  function currentPageWithQuery() {
    var file = (global.location.pathname.split('/').pop() || 'page01-landing.html');
    return file + (global.location.search || '');
  }

  function safeNext(next) {
    return /^[A-Za-z0-9._-]+\.html(\?[^#]*)?$/.test(next || '') ? next : null;
  }

  KQ.redirectToLogin = function () {
    var target = LOGIN_PAGE + '?next=' + encodeURIComponent(currentPageWithQuery());
    global.location.replace(target);
  };

  /** Where to go after logging in (?next=page03-slot-booking.html), defaulting to the booking page. */
  KQ.nextPage = function (fallback) {
    var params = new URLSearchParams(global.location.search);
    return safeNext(params.get('next')) || fallback || 'page03-slot-booking.html';
  };

  /**
   * Call at the top of every protected page. Redirects immediately when there is no session, and
   * confirms the session with the server in the background (a revoked / expired token is dropped).
   */
  KQ.requireLogin = function () {
    if (!KQ.isLoggedIn()) {
      KQ.redirectToLogin();
      return null;
    }
    KQ.api('/auth/me').then(function (res) {
      var session = KQ.getSession();
      if (session && res.data && res.data.farmer) {
        session.farmer = res.data.farmer;
        var storage = global.localStorage.getItem(AUTH_KEY) ? global.localStorage : global.sessionStorage;
        try { storage.setItem(AUTH_KEY, JSON.stringify(session)); } catch (e) { /* ignore */ }
        KQ.hydrateFarmerBadge();
      }
    }).catch(function () { /* network errors are handled by the page's own loading states */ });
    return KQ.getSession();
  };

  KQ.logout = function () {
    var done = function () {
      KQ.clearSession();
      global.location.replace(LOGIN_PAGE);
    };
    if (!KQ.isLoggedIn()) return done();
    KQ.api('/auth/logout', { method: 'POST', noAuthRedirect: true }).then(done, done);
  };

  /* -------------------------------------------------------- header account UI */

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  /** Fills the existing .farmer-badge blocks (name / place / initials) with the logged-in farmer. */
  KQ.hydrateFarmerBadge = function () {
    var farmer = KQ.getFarmer();
    if (!farmer) return;
    var place = [farmer.village, farmer.district].filter(Boolean).join(', ');
    document.querySelectorAll('.farmer-badge').forEach(function (badge) {
      var avatar = badge.querySelector('.farmer-avatar');
      var name = badge.querySelector('.farmer-name');
      var village = badge.querySelector('.farmer-village');
      if (avatar) avatar.textContent = initials(farmer.full_name);
      if (name) name.textContent = farmer.full_name;
      if (village) village.textContent = place || farmer.mobile || '';
    });
  };

  var AUTH_UI_CSS =
    '.kq-auth-chip{display:inline-flex;align-items:center;gap:8px;margin-left:12px;font-family:inherit}' +
    '.kq-auth-name{font-size:13px;color:#3d4a3d;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.kq-logout-btn{font:600 13px/1 inherit;font-family:inherit;padding:9px 14px;border-radius:9px;border:1px solid #c9d2c1;' +
    'background:#fff;color:#2d4a2b;cursor:pointer;min-height:38px}' +
    '.kq-logout-btn:hover{background:#edf1e7}.kq-logout-btn:focus-visible{outline:3px solid #c9962c;outline-offset:2px}' +
    // The page headers were restyled light, but the farmer badge text stayed white: make it readable.
    '.farmer-badge .farmer-name{color:#1E231E}.farmer-badge .farmer-village{color:#5A6156}' +
    '.farmer-badge + .kq-auth-chip .kq-auth-name,.header-right:has(.farmer-badge) .kq-auth-name{display:none}' +
    '@media(max-width:560px){.kq-auth-name{display:none}.kq-logout-btn{padding:8px 10px}' +
    '.farmer-badge .farmer-village{display:none}.farmer-badge .farmer-name{max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}';

  /** Adds "<name> [Logout]" to the page header (works with both header layouts used in the project). */
  KQ.mountAuthUI = function () {
    var farmer = KQ.getFarmer();
    if (!farmer || document.querySelector('.kq-auth-chip')) return;

    var style = document.createElement('style');
    style.textContent = AUTH_UI_CSS;
    document.head.appendChild(style);

    var chip = document.createElement('div');
    chip.className = 'kq-auth-chip';

    var name = document.createElement('span');
    name.className = 'kq-auth-name';
    name.textContent = farmer.full_name;

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'kq-logout-btn';
    button.textContent = 'Logout';
    button.setAttribute('aria-label', 'Log out of Kisan Queue');
    button.addEventListener('click', KQ.logout);

    chip.appendChild(name);
    chip.appendChild(button);

    var host = document.querySelector('.header-right') || document.querySelector('.topbar') || document.querySelector('header');
    if (host) host.appendChild(chip);
    KQ.hydrateFarmerBadge();
  };

  /* ------------------------------------------------------------ formatting */

  var STATUS_LABELS = {
    BOOKED: 'Booked', CHECKED_IN: 'Checked in', WAITING: 'Waiting', QUALITY_CHECK: 'Quality check',
    WEIGHING: 'Weighing', ACCEPTED: 'Accepted', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
    CALLED: 'Called', SERVING: 'Being served', HOLD: 'On hold',
    PENDING: 'Pending', PROCESSING: 'Processing', CREDITED: 'Credited', FAILED: 'Failed'
  };

  KQ.fmt = {
    statusLabel: function (status) { return STATUS_LABELS[status] || (status ? String(status) : 'Unknown'); },
    token: function (n) { return (n === null || n === undefined) ? '—' : '#' + n; },
    time: function (value) {
      if (!value) return '—';
      var m = /^(\d{1,2}):(\d{2})/.exec(String(value));
      if (!m) return String(value);
      var h = Number(m[1]);
      var suffix = h >= 12 ? 'PM' : 'AM';
      return ((h % 12) || 12) + ':' + m[2] + ' ' + suffix;
    },
    date: function (iso, opts) {
      if (!iso) return '—';
      var d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
      if (isNaN(d.getTime())) return String(iso);
      return d.toLocaleDateString('en-IN', opts || { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    },
    quantity: function (q) {
      var n = Number(q);
      return isFinite(n) ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) + ' quintals' : '—';
    },
    money: function (amount) {
      var n = Number(amount);
      return isFinite(n) ? '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';
    },
    minutes: function (m) {
      if (m === null || m === undefined) return null;
      if (m < 1) return 'Your turn';
      if (m < 60) return m + ' min';
      var h = Math.floor(m / 60);
      var rest = m % 60;
      return h + ' hr' + (rest ? ' ' + rest + ' min' : '');
    },
    todayISO: function () {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
  };

  KQ.escapeHtml = function (value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /** The farmer's most relevant booking: today or upcoming first (soonest), else the latest one. */
  KQ.pickCurrentBooking = function (bookings) {
    var list = (bookings || []).filter(function (b) { return b.status !== 'CANCELLED'; });
    var today = KQ.fmt.todayISO();
    var upcoming = list.filter(function (b) { return String(b.booking_date).slice(0, 10) >= today && b.status !== 'COMPLETED'; })
      .sort(function (a, b) {
        var da = String(a.booking_date).slice(0, 10) + ' ' + String(a.slot_start);
        var db = String(b.booking_date).slice(0, 10) + ' ' + String(b.slot_start);
        return da < db ? -1 : da > db ? 1 : 0;
      });
    return upcoming[0] || list[0] || null;
  };

  /* -------------------------------------------------------------- location */

  /**
   * Asks the browser for the farmer's position - only when this is called (i.e. after the farmer
   * pressed "Use my location"). Coordinates are rounded (~100 m), kept in memory only, and sent
   * only as query parameters to our own backend, which does not store them.
   */
  KQ.getLocation = function () {
    return new Promise(function (resolve, reject) {
      if (!global.navigator || !global.navigator.geolocation) {
        return reject(KQError('geo', 'This browser does not support location. Please choose a centre manually.', { code: 'UNSUPPORTED' }));
      }
      global.navigator.geolocation.getCurrentPosition(function (pos) {
        KQ.lastLocation = {
          latitude: Math.round(pos.coords.latitude * 1000) / 1000,
          longitude: Math.round(pos.coords.longitude * 1000) / 1000
        };
        resolve(KQ.lastLocation);
      }, function (err) {
        var messages = {
          1: 'Location permission was denied. You can still choose a centre manually.',
          2: 'Your location could not be determined. You can still choose a centre manually.',
          3: 'Finding your location took too long. You can still choose a centre manually.'
        };
        reject(KQError('geo', messages[err.code] || 'Location is not available. You can still choose a centre manually.', { code: err.code }));
      }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 });
    });
  };

  KQ.lastLocation = null;
  KQ.LOGIN_PAGE = LOGIN_PAGE;
  global.KQ = KQ;
})(window);
