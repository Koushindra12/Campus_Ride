/* ============================================================
   InterviAI — app.js
   Core app bootstrap, auth guard, navigation rendering
   ============================================================ */

const App = (() => {
  // ─── Auth Guard ──────────────────────────────────────────────
  function requireAuth() {
    if (!Storage.isLoggedIn()) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = '../auth/login.html?return=' + returnUrl;
    }
  }

  function requireAuthFromRoot() {
    if (!Storage.isLoggedIn()) {
      window.location.href = 'auth/login.html';
    }
  }

  function redirectIfLoggedIn(target = '../pages/dashboard.html') {
    if (Storage.isLoggedIn()) {
      window.location.href = target;
    }
  }

  // ─── Sidebar HTML ────────────────────────────────────────────
  function getSidebarHTML(basePath = '..') {
    return `
      <aside class="sidebar" id="sidebar" role="navigation" aria-label="Main navigation">
        <div class="sidebar-brand">
          <div style="width:36px;height:36px;background:white;border-radius:9px;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:3px;">
            <img src="${basePath}/assets/images/logo.png" alt="InterviAI Logo" style="width:100%;height:100%;object-fit:contain;display:block;">
          </div>
          <div>
            <div class="brand-name">InterviAI</div>
            <div class="brand-tagline">Practice. Improve. Get Hired.</div>
          </div>
        </div>

        <ul class="sidebar-nav">
          <li class="sidebar-section-label">Main</li>
          <li class="sidebar-nav-item">
            <a class="sidebar-nav-link" href="${basePath}/pages/dashboard.html">
              <i class="bi bi-grid-1x2-fill"></i> Dashboard
            </a>
          </li>
          <li class="sidebar-nav-item">
            <a class="sidebar-nav-link" href="${basePath}/pages/upload.html">
              <i class="bi bi-cloud-arrow-up-fill"></i> Upload Resume
            </a>
          </li>
          <li class="sidebar-nav-item">
            <a class="sidebar-nav-link" href="${basePath}/pages/configure.html">
              <i class="bi bi-sliders"></i> New Interview
            </a>
          </li>

          <li class="sidebar-section-label">Interview</li>
          <li class="sidebar-nav-item">
            <a class="sidebar-nav-link" href="${basePath}/pages/interview.html">
              <i class="bi bi-camera-video-fill"></i> Live Interview
            </a>
          </li>
          <li class="sidebar-nav-item">
            <a class="sidebar-nav-link" href="${basePath}/pages/practice.html">
              <i class="bi bi-play-circle-fill"></i> Practice Mode
            </a>
          </li>
          <li class="sidebar-nav-item">
            <a class="sidebar-nav-link" href="${basePath}/pages/device-check.html">
              <i class="bi bi-display"></i> Device Check
            </a>
          </li>

          <li class="sidebar-section-label">Results</li>
          <li class="sidebar-nav-item">
            <a class="sidebar-nav-link" href="${basePath}/pages/report.html">
              <i class="bi bi-bar-chart-fill"></i> Reports
            </a>
          </li>
          <li class="sidebar-nav-item">
            <a class="sidebar-nav-link" href="${basePath}/pages/history.html">
              <i class="bi bi-clock-history"></i> History
            </a>
          </li>
          <li class="sidebar-nav-item">
            <a class="sidebar-nav-link" href="${basePath}/pages/analysis.html">
              <i class="bi bi-file-earmark-text-fill"></i> Resume Analysis
            </a>
          </li>
        </ul>

        <div class="sidebar-footer">
          <div class="sidebar-user" id="sidebar-user-btn" role="button" tabindex="0" aria-label="User profile">
            <!-- Populated by JS -->
          </div>
        </div>
      </aside>

      <div class="sidebar-overlay" id="sidebar-overlay"></div>
    `;
  }

  // ─── Topbar HTML ─────────────────────────────────────────────
  function getTopbarHTML(title = 'INTERVIAI') {
    return `
      <header class="topbar" role="banner">
        <button class="hamburger-btn" id="hamburger-btn" aria-label="Toggle navigation" aria-expanded="false">
          <i class="bi bi-list"></i>
        </button>

        <div class="topbar-title">${title}</div>

        <div class="topbar-search" role="search">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="Search..." aria-label="Search" id="topbar-search-input">
        </div>

        <div class="topbar-actions">
          <div class="icon-btn" title="Notifications" role="button" tabindex="0" aria-label="Notifications">
            <i class="bi bi-bell"></i>
            <span class="notif-dot"></span>
          </div>
          <div class="icon-btn" title="Help" role="button" tabindex="0" aria-label="Help">
            <i class="bi bi-question-circle"></i>
          </div>
          <div class="topbar-user" id="topbar-user" role="button" tabindex="0" aria-label="User menu">
            <!-- Populated by JS -->
          </div>
        </div>
      </header>
    `;
  }

  // ─── Mobile Bottom Nav ───────────────────────────────────────
  function getMobileNavHTML(basePath = '..') {
    return `
      <nav class="mobile-bottom-nav" aria-label="Mobile navigation">
        <a class="mob-nav-item" href="${basePath}/pages/dashboard.html" aria-label="Home">
          <i class="bi bi-house-fill"></i>
          <span>Home</span>
        </a>
        <a class="mob-nav-item" href="${basePath}/pages/configure.html" aria-label="Interviews">
          <i class="bi bi-camera-video-fill"></i>
          <span>Interview</span>
        </a>
        <a class="mob-nav-item" href="${basePath}/pages/report.html" aria-label="Reports">
          <i class="bi bi-bar-chart-fill"></i>
          <span>Reports</span>
        </a>
        <a class="mob-nav-item" href="${basePath}/pages/history.html" aria-label="History">
          <i class="bi bi-clock-history"></i>
          <span>History</span>
        </a>
        <a class="mob-nav-item" href="${basePath}/pages/profile.html" aria-label="Profile">
          <i class="bi bi-person-fill"></i>
          <span>Profile</span>
        </a>
      </nav>
    `;
  }

  // ─── Init App Shell ──────────────────────────────────────────
  function initShell(options = {}) {
    const {
      basePath = '..',
      topbarTitle = 'INTERVIAI',
      requireLogin = true,
      activePage = null
    } = options;

    if (requireLogin) requireAuth();

    // Inject sidebar if placeholder exists
    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    if (sidebarPlaceholder) {
      sidebarPlaceholder.outerHTML = getSidebarHTML(basePath);
    }

    // Inject topbar if placeholder exists
    const topbarPlaceholder = document.getElementById('topbar-placeholder');
    if (topbarPlaceholder) {
      topbarPlaceholder.outerHTML = getTopbarHTML(topbarTitle);
    }

    // Inject mobile nav if placeholder exists
    const mobileNavPlaceholder = document.getElementById('mobile-nav-placeholder');
    if (mobileNavPlaceholder) {
      mobileNavPlaceholder.outerHTML = getMobileNavHTML(basePath);
    }

    // Init sidebar toggle
    Utils.initSidebarToggle();

    // Set active nav links
    Utils.setActiveNav();

    // Render user info
    Utils.renderShellUser();

    // Logout handlers
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.confirm(
          'Sign Out',
          'Are you sure you want to sign out of INTERVIAI?',
          () => {
            Storage.clearUser();
            Utils.showSuccess('Signed Out', 'You have been signed out successfully.');
            setTimeout(() => Utils.navigate(basePath + '/auth/login.html'), 800);
          },
          'Sign Out',
          'btn-danger'
        );
      });
    });
  }

  // ─── Demo Data Population ─────────────────────────────────────
  function ensureDemoData() {
    // Ensure demo user exists
    if (!Storage.get('demo_user_created')) {
      Storage.set('demo_user', {
        email: 'student@interviai.ai',
        password: '123456',
        name: 'Mohan Saini',
        role: 'Student'
      });
      Storage.set('demo_user_created', true);
    }
  }

  // ─── Page Init ───────────────────────────────────────────────
  function init(options = {}) {
    ensureDemoData();
    initShell(options);
  }

  return {
    requireAuth, requireAuthFromRoot, redirectIfLoggedIn,
    getSidebarHTML, getTopbarHTML, getMobileNavHTML,
    initShell, ensureDemoData, init
  };
})();

window.App = App;
