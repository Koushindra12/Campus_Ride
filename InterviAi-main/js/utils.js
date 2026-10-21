/* ============================================================
   INTERVIAI — utils.js
   Shared utilities: toasts, validators, formatters, animations
   ============================================================ */

const Utils = (() => {
  // ─── Toast System ───────────────────────────────────────────
  let toastContainer = null;

  function ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container-hm';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  const TOAST_ICONS = {
    success: 'bi-check-circle-fill',
    error:   'bi-x-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info:    'bi-info-circle-fill'
  };

  function toast(type = 'info', title, message, duration = 4000) {
    const container = ensureToastContainer();
    const t = document.createElement('div');
    t.className = `toast-hm ${type}`;
    t.innerHTML = `
      <i class="bi ${TOAST_ICONS[type]} toast-icon"></i>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <i class="bi bi-x toast-close" role="button" tabindex="0"></i>
    `;
    const closeBtn = t.querySelector('.toast-close');
    const dismiss = () => {
      t.classList.add('hiding');
      setTimeout(() => t.remove(), 300);
    };
    closeBtn.addEventListener('click', dismiss);
    closeBtn.addEventListener('keydown', e => e.key === 'Enter' && dismiss());
    container.appendChild(t);
    if (duration > 0) setTimeout(dismiss, duration);
    return t;
  }

  const showSuccess = (title, msg, dur) => toast('success', title, msg, dur);
  const showError   = (title, msg, dur) => toast('error', title, msg, dur);
  const showWarning = (title, msg, dur) => toast('warning', title, msg, dur);
  const showInfo    = (title, msg, dur) => toast('info', title, msg, dur);

  // ─── Validators ─────────────────────────────────────────────
  const validators = {
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    required: (v) => v.trim().length > 0,
    minLength: (v, n) => v.trim().length >= n,
    passwordMatch: (a, b) => a === b,
    fileType: (file, types) => types.some(t => file.name.toLowerCase().endsWith(t)),
    fileSize: (file, maxMB) => file.size <= maxMB * 1024 * 1024
  };

  function validateForm(fields) {
    let valid = true;
    fields.forEach(({ input, rules, errorEl }) => {
      let fieldValid = true;
      let errorMsg = '';
      for (const rule of rules) {
        if (rule.type === 'required' && !validators.required(input.value)) {
          fieldValid = false; errorMsg = rule.message || 'This field is required.'; break;
        }
        if (rule.type === 'email' && !validators.email(input.value)) {
          fieldValid = false; errorMsg = rule.message || 'Enter a valid email address.'; break;
        }
        if (rule.type === 'minLength' && !validators.minLength(input.value, rule.value)) {
          fieldValid = false; errorMsg = rule.message || `Minimum ${rule.value} characters required.`; break;
        }
        if (rule.type === 'match' && input.value !== rule.target.value) {
          fieldValid = false; errorMsg = rule.message || 'Values do not match.'; break;
        }
      }
      input.classList.toggle('is-invalid', !fieldValid);
      input.classList.toggle('is-valid', fieldValid);
      if (errorEl) { errorEl.textContent = errorMsg; errorEl.style.display = fieldValid ? 'none' : 'block'; }
      if (!fieldValid) valid = false;
    });
    return valid;
  }

  // ─── Formatters ─────────────────────────────────────────────
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function getScoreClass(score) {
    if (score >= 75) return 'high';
    if (score >= 50) return 'med';
    return 'low';
  }

  function getScoreColor(score) {
    if (score >= 75) return '#059669';
    if (score >= 50) return '#d97706';
    return '#dc2626';
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ─── DOM Helpers ─────────────────────────────────────────────
  function el(selector, parent = document) { return parent.querySelector(selector); }
  function els(selector, parent = document) { return [...parent.querySelectorAll(selector)]; }

  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }
  function toggle(el, condition) { if (el) el.style.display = condition ? '' : 'none'; }

  function setHTML(selector, html, parent = document) {
    const e = parent.querySelector(selector);
    if (e) e.innerHTML = html;
  }

  function setText(selector, text, parent = document) {
    const e = parent.querySelector(selector);
    if (e) e.textContent = text;
  }

  // ─── Loading Overlay ─────────────────────────────────────────
  function showLoading(msg = 'Loading...') {
    let overlay = document.getElementById('hm-loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'hm-loading-overlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="spinner-hm spinner-lg"></div>
        <p id="hm-loading-msg" style="font-size:0.9rem;color:var(--text-secondary);font-weight:500">${msg}</p>
      `;
      document.body.appendChild(overlay);
    } else {
      document.getElementById('hm-loading-msg').textContent = msg;
      overlay.style.display = 'flex';
    }
  }

  function updateLoadingMsg(msg) {
    const el = document.getElementById('hm-loading-msg');
    if (el) el.textContent = msg;
  }

  function hideLoading() {
    const overlay = document.getElementById('hm-loading-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  // ─── Password Toggle ─────────────────────────────────────────
  function initPasswordToggles() {
    els('.password-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.closest('.input-group-hm').querySelector('input');
        if (!input) return;
        const isText = input.type === 'text';
        input.type = isText ? 'password' : 'text';
        btn.className = `bi ${isText ? 'bi-eye' : 'bi-eye-slash'} input-icon-right password-toggle`;
      });
    });
  }

  // ─── Button Loading State ─────────────────────────────────────
  function setButtonLoading(btn, loading, text = '') {
    if (!btn) return;
    if (loading) {
      btn.dataset.origText = btn.innerHTML;
      btn.innerHTML = `<span class="spinner-hm spinner-sm" style="border-color:rgba(255,255,255,0.3);border-top-color:white"></span> ${text || 'Loading...'}`;
      btn.disabled = true;
    } else {
      btn.innerHTML = btn.dataset.origText || text;
      btn.disabled = false;
    }
  }

  // ─── Counter Animation ─────────────────────────────────────────
  function animateCounter(el, from, to, duration = 1000, suffix = '') {
    if (!el) return;
    const start = performance.now();
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (to - from) * eased) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  // ─── Progress Bar Animation ────────────────────────────────────
  function animateProgressBar(bar, targetWidth, delay = 0) {
    if (!bar) return;
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.transition = 'width 1s ease';
      bar.style.width = targetWidth + '%';
    }, delay);
  }

  // ─── Avatar Initials ──────────────────────────────────────────
  function getInitials(name = '') {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  function renderAvatar(name, size = 'md') {
    const initials = getInitials(name);
    const colors = [
      { bg: '#2563eb', color: 'white' },
      { bg: '#6366f1', color: 'white' },
      { bg: '#059669', color: 'white' },
      { bg: '#d97706', color: 'white' },
      { bg: '#1e3a5f', color: 'white' }
    ];
    const idx = (name.charCodeAt(0) || 0) % colors.length;
    const { bg, color } = colors[idx];
    return `<div class="avatar avatar-${size}" style="background:${bg};color:${color}">${initials}</div>`;
  }

  // ─── Confirm Modal ───────────────────────────────────────────
  function confirm(title, message, onConfirm, btnText = 'Confirm', btnClass = 'btn-danger') {
    const existing = document.getElementById('hm-confirm-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'hm-confirm-modal';
    modal.className = 'modal-backdrop-hm';
    modal.innerHTML = `
      <div class="modal-hm" style="max-width:400px">
        <div class="modal-header-hm">
          <h4>${title}</h4>
          <button class="btn-hm btn-ghost btn-icon btn-icon-sm" id="hm-confirm-close" aria-label="Close">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body-hm">
          <p style="color:var(--text-secondary);font-size:0.875rem">${message}</p>
        </div>
        <div class="modal-footer-hm">
          <button class="btn-hm btn-ghost" id="hm-confirm-cancel">Cancel</button>
          <button class="btn-hm ${btnClass}" id="hm-confirm-ok">${btnText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('#hm-confirm-close').addEventListener('click', close);
    modal.querySelector('#hm-confirm-cancel').addEventListener('click', close);
    modal.querySelector('#hm-confirm-ok').addEventListener('click', () => { close(); onConfirm(); });
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
  }

  // ─── Skeleton Generation ─────────────────────────────────────
  function skeleton(height = '16px', width = '100%', radius = '6px') {
    return `<div class="skeleton" style="height:${height};width:${width};border-radius:${radius}"></div>`;
  }

  // ─── Scroll to top ───────────────────────────────────────────
  function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  // ─── Get greeting ────────────────────────────────────────────
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // ─── Delay helper ─────────────────────────────────────────────
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // ─── Sidebar mobile toggle ───────────────────────────────────
  function initSidebarToggle() {
    const hamburger = document.querySelector('.hamburger-btn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (!hamburger || !sidebar) return;

    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay && overlay.classList.toggle('visible');
    });

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
      });
    }
  }

  // ─── Active nav link ─────────────────────────────────────────
  function setActiveNav() {
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '');
    document.querySelectorAll('.sidebar-nav-link').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href') || '';
      if (href.includes(filename)) link.classList.add('active');
    });
    document.querySelectorAll('.mob-nav-item').forEach(item => {
      item.classList.remove('active');
      const href = item.getAttribute('href') || '';
      if (href.includes(filename)) item.classList.add('active');
    });
  }

  // ─── Navigate helper ──────────────────────────────────────────
  function navigate(url) { window.location.href = url; }

  // ─── Render user info in shell ────────────────────────────────
  function renderShellUser() {
    const profile = Storage.getProfile();
    const sidebarUser = document.querySelector('.sidebar-user');
    if (sidebarUser) {
      sidebarUser.innerHTML = `
        <div class="avatar avatar-sm" style="background:linear-gradient(135deg,#2563eb,#6366f1);color:white;flex-shrink:0">
          ${getInitials(profile.name)}
        </div>
        <div class="sidebar-user-info">
          <div class="user-name">${profile.name}</div>
          <div class="user-role">${profile.role}</div>
        </div>
        <i class="bi bi-three-dots-vertical" style="margin-left:auto;color:rgba(255,255,255,0.4);font-size:0.8rem"></i>
      `;
      sidebarUser.addEventListener('click', () => navigate('../pages/profile.html'));
    }

    const topbarUser = document.querySelector('.topbar-user');
    if (topbarUser) {
      topbarUser.innerHTML = `
        <div class="avatar avatar-sm" style="background:linear-gradient(135deg,#2563eb,#6366f1);color:white">
          ${getInitials(profile.name)}
        </div>
        <div class="topbar-user-info">
          <div class="t-name">${profile.name.split(' ')[0]}</div>
          <div class="t-role">${profile.role}</div>
        </div>
        <i class="bi bi-chevron-down" style="font-size:0.7rem;color:var(--text-muted)"></i>
      `;
      topbarUser.addEventListener('click', () => navigate('../pages/profile.html'));
    }
  }

  return {
    toast, showSuccess, showError, showWarning, showInfo,
    validators, validateForm,
    formatDate, formatTime, getScoreClass, getScoreColor, formatFileSize,
    el, els, show, hide, toggle, setHTML, setText,
    showLoading, updateLoadingMsg, hideLoading,
    initPasswordToggles, setButtonLoading,
    animateCounter, animateProgressBar,
    getInitials, renderAvatar,
    confirm, skeleton, scrollToTop, getGreeting, delay,
    initSidebarToggle, setActiveNav, navigate, renderShellUser
  };
})();

window.Utils = Utils;
