/* ============================================================
   INTERVIAI — auth.js
   Authentication logic: login, signup, logout, forgot password
   ============================================================ */

const Auth = (() => {
  const DEMO_EMAIL = 'student@interviai.ai';
  const DEMO_PASSWORD = '123456';

  // ─── Login ───────────────────────────────────────────────────
  function initLogin() {
    App.redirectIfLoggedIn('../pages/dashboard.html');
    App.ensureDemoData();

    const form = document.getElementById('login-form');
    if (!form) return;

    // Demo fill button
    const demoFillBtn = document.getElementById('demo-fill-btn');
    if (demoFillBtn) {
      demoFillBtn.addEventListener('click', () => {
        document.getElementById('login-email').value = DEMO_EMAIL;
        document.getElementById('login-password').value = DEMO_PASSWORD;
        Utils.showInfo('Demo Credentials', 'Email and password filled. Click Login to continue.');
      });
    }

    Utils.initPasswordToggles();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email');
      const password = document.getElementById('login-password');
      const remember = document.getElementById('login-remember')?.checked;
      const submitBtn = document.getElementById('login-submit');

      const valid = Utils.validateForm([
        { input: email, rules: [{ type: 'required' }, { type: 'email' }], errorEl: document.getElementById('email-error') },
        { input: password, rules: [{ type: 'required' }, { type: 'minLength', value: 4 }], errorEl: document.getElementById('password-error') }
      ]);

      if (!valid) return;

      Utils.setButtonLoading(submitBtn, true, 'Signing in...');

      await Utils.delay(1200);

      // Check credentials
      const emailVal = email.value.trim().toLowerCase();
      const passVal = password.value;

      // Accept demo account or any stored accounts
      const users = Storage.get('users', [
        { email: DEMO_EMAIL, password: DEMO_PASSWORD, name: 'Mohan Saini', role: 'Student' }
      ]);

      const user = users.find(u => u.email.toLowerCase() === emailVal && u.password === passVal);

      if (user) {
        const userData = {
          email: user.email,
          name: user.name,
          role: user.role,
          loggedInAt: new Date().toISOString(),
          remember
        };
        Storage.setUser(userData);
        if (user.name) {
          Storage.setProfile({
            ...Storage.getProfile(),
            name: user.name,
            email: user.email,
            role: user.role
          });
        }
        Utils.showSuccess('Welcome back!', `Signed in as ${user.name || user.email}`);
        setTimeout(() => Utils.navigate('../pages/dashboard.html'), 800);
      } else {
        Utils.setButtonLoading(submitBtn, false);
        email.classList.add('is-invalid');
        password.classList.add('is-invalid');
        const errorEl = document.getElementById('password-error');
        if (errorEl) { errorEl.textContent = 'Invalid email or password.'; errorEl.style.display = 'block'; }
        Utils.showError('Login Failed', 'Invalid email or password. Try the demo credentials.');
      }
    });
  }

  // ─── Signup ──────────────────────────────────────────────────
  function initSignup() {
    App.redirectIfLoggedIn('../pages/dashboard.html');

    const form = document.getElementById('signup-form');
    if (!form) return;

    Utils.initPasswordToggles();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name');
      const email = document.getElementById('signup-email');
      const password = document.getElementById('signup-password');
      const confirm = document.getElementById('signup-confirm');
      const terms = document.getElementById('signup-terms');
      const submitBtn = document.getElementById('signup-submit');

      const valid = Utils.validateForm([
        { input: name, rules: [{ type: 'required' }, { type: 'minLength', value: 2 }], errorEl: document.getElementById('name-error') },
        { input: email, rules: [{ type: 'required' }, { type: 'email' }], errorEl: document.getElementById('email-error') },
        { input: password, rules: [{ type: 'required' }, { type: 'minLength', value: 6, message: 'Password must be at least 6 characters.' }], errorEl: document.getElementById('password-error') },
        { input: confirm, rules: [{ type: 'required' }, { type: 'match', target: password, message: 'Passwords do not match.' }], errorEl: document.getElementById('confirm-error') }
      ]);

      if (!valid) return;

      if (!terms?.checked) {
        Utils.showWarning('Terms Required', 'Please accept the Terms of Service to continue.');
        return;
      }

      Utils.setButtonLoading(submitBtn, true, 'Creating account...');
      await Utils.delay(1500);

      // Store new user
      const users = Storage.get('users', [
        { email: DEMO_EMAIL, password: DEMO_PASSWORD, name: 'Mohan Saini', role: 'Student' }
      ]);

      const exists = users.find(u => u.email.toLowerCase() === email.value.trim().toLowerCase());
      if (exists) {
        Utils.setButtonLoading(submitBtn, false);
        Utils.showError('Account Exists', 'An account with this email already exists. Please login.');
        email.classList.add('is-invalid');
        return;
      }

      const roleSelect = document.getElementById('signup-role');
      const newUser = {
        email: email.value.trim(),
        password: password.value,
        name: name.value.trim(),
        role: roleSelect?.value || 'Student',
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      Storage.set('users', users);

      // Auto login
      Storage.setUser({ email: newUser.email, name: newUser.name, role: newUser.role, loggedInAt: new Date().toISOString() });
      Storage.setProfile({ ...Storage.getProfile(), name: newUser.name, email: newUser.email, role: newUser.role });

      Utils.showSuccess('Account Created!', `Welcome to InterviAI, ${newUser.name}!`);
      setTimeout(() => Utils.navigate('../pages/dashboard.html'), 1000);
    });
  }

  // ─── Forgot Password ─────────────────────────────────────────
  function initForgotPassword() {
    const form = document.getElementById('forgot-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email');
      const submitBtn = document.getElementById('forgot-submit');

      const valid = Utils.validateForm([
        { input: email, rules: [{ type: 'required' }, { type: 'email' }], errorEl: document.getElementById('email-error') }
      ]);

      if (!valid) return;

      Utils.setButtonLoading(submitBtn, true, 'Sending...');
      await Utils.delay(1500);
      Utils.setButtonLoading(submitBtn, false);

      // Show success state
      form.innerHTML = `
        <div style="text-align:center;padding:20px 0">
          <div style="width:64px;height:64px;background:var(--success-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:1.8rem;color:var(--success)">
            <i class="bi bi-envelope-check-fill"></i>
          </div>
          <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">Check Your Email</h3>
          <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:20px">
            We've sent a password reset link to <strong>${email.value}</strong>.<br>
            (Demo: no actual email is sent.)
          </p>
          <a href="login.html" class="btn-hm btn-primary" style="text-decoration:none">
            <i class="bi bi-arrow-left"></i> Back to Login
          </a>
        </div>
      `;
    });
  }

  // ─── Logout ──────────────────────────────────────────────────
  function logout() {
    Storage.clearUser();
    Utils.navigate('../auth/login.html');
  }

  return { initLogin, initSignup, initForgotPassword, logout };
})();

window.Auth = Auth;
