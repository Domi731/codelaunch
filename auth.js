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

  // Öffentliche API
  window.CodeLaunchAuth = {
    _ready: null,

    init: function () {
      if (this._ready) return this._ready;
      var self = this;
      this._ready = (async function () {
        if (typeof window.firebaseConfig === 'undefined') {
          throw new Error('firebase-config.js fehlt.');
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

    signInWithGithub: async function () {
      await this.init();
      return window.firebase.auth().signInWithPopup(getProvider());
    },

    signOut: async function () {
      await this.init();
      return window.firebase.auth().signUserOut ? window.firebase.auth().signUserOut() : window.firebase.auth().signOut();
    },

    onAuth: function (cb) {
      this.init().then(function (auth) {
        auth.onAuthStateChanged(cb);
      });
    },
  };
})();
