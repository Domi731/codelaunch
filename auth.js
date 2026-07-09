// Firebase Auth — GitHub Sign-In
// Lädt das Firebase SDK (compat) dynamisch, damit die Seite auch ohne
// Login funktioniert, falls das Script blockiert wird.
(function () {
  'use strict';

  // Firebase SDK (compat) lazy laden
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function getProvider() {
    if (!window.firebase) return null;
    return new window.firebase.auth.GithubAuthProvider();
  }

  // Menschenlesbare Fehlertexte
  function explainError(e) {
    var msg = (e && e.message) ? e.message : String(e || 'Unbekannter Fehler.');
    var code = e && e.code ? e.code : '';

    if (code === 'auth/operation-not-supported-in-this-environment' ||
        /location\.protocol|web storage/i.test(msg)) {
      return 'Firebase läuft nicht über file://.\n\n' +
             'Starte die Seite über einen lokalen Server:\n' +
             '  • VS Code: "Live Server" Extension\n' +
             '  • Python:  python -m http.server 8000\n' +
             '  • Node:    npx serve .\n\n' +
             'Dann http://localhost:8000 im Browser öffnen.';
    }
    if (code === 'auth/popup-blocked') {
      return 'Das Pop-up wurde blockiert. Erlaube Pop-ups für diese Seite und versuche es erneut.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Login abgebrochen.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Netzwerkfehler. Prüfe deine Internetverbindung.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Diese Domain ist in der Firebase-Console nicht autorisiert.\n' +
             'Füge sie unter Authentication → Settings → Authorized domains hinzu.';
    }
    if (/requested action is invalid|invalid argument/i.test(msg)) {
      return 'Firebase-Konfiguration ungültig oder unvollständig.\n' +
             'Prüfe firebase-config.js — alle Platzhalter müssen ersetzt sein.';
    }
    return msg;
  }

  // Öffentliche API
  window.CodeLaunchAuth = {
    _ready: null,
    _initialized: false,

    init: function () {
      if (this._ready) return this._ready;
      this._ready = (async function () {
        if (location.protocol === 'file:') {
          var e = new Error('auth/operation-not-supported-in-this-environment');
          e.code = 'auth/operation-not-supported-in-this-environment';
          throw e;
        }
        if (typeof window.firebaseConfig === 'undefined' ||
            !window.firebaseConfig.apiKey ||
            /DEIN_API_KEY|PLACEHOLDER/i.test(window.firebaseConfig.apiKey)) {
          var cfg = new Error('Firebase-Konfiguration fehlt (firebase-config.js).');
          cfg.code = 'config-missing';
          throw cfg;
        }
        await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js');
        if (!window.firebase.apps.length) {
          window.firebase.initializeApp(window.firebaseConfig);
        }
        return window.firebase.auth();
      })();
      return this._ready;
    },

    // Redirect statt Popup: keine Pop-up-Blocker-Probleme, funktioniert
    // auf Mobile und in restriktiven Browser-Settings.
    signInWithGithub: async function () {
      try {
        await this.init();
        return await window.firebase.auth().signInWithRedirect(getProvider());
      } catch (e) {
        var friendly = new Error(explainError(e));
        friendly.code = e && e.code;
        friendly.original = e;
        throw friendly;
      }
    },

    // Nach Redirect zurück: prüfen, ob ein Ergebnis da ist
    getRedirectResult: async function () {
      try {
        await this.init();
        return await window.firebase.auth().getRedirectResult();
      } catch (e) {
        return { error: e };
      }
    },

    signOut: async function () {
      try {
        await this.init();
        return await window.firebase.auth().signOut();
      } catch (e) {
        var friendly = new Error(explainError(e));
        friendly.original = e;
        throw friendly;
      }
    },

    onAuth: function (cb) {
      var self = this;
      this.init()
        .then(function (auth) {
          self._initialized = true;
          auth.onAuthStateChanged(cb);
        })
        .catch(function () {
          // Firebase nicht bereit — trotzdem User als "nicht eingeloggt" anzeigen,
          // damit der Sign-in-Button immer sichtbar ist.
          cb(null);
        });
    },

    explainError: explainError,
  };
})();
