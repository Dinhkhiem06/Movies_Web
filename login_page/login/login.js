(() => {
  'use strict';

  // ===== SHARED LOGIN PAGE CONFIGURATION =====
  const STORAGE_KEY = 'cinewave_accounts'; // Key used to store the account list in localStorage
  const PHONE_LENGTH = 10;
  const REDIRECT_DELAY = 1500;
  const DEMO_ACCOUNTS = [
    // Default demo account that is always available for login
    {
      phone: '0901234567',
      password: '123456',
    },
  ];

  // ===== GET THE REQUIRED DOM ELEMENTS =====
  const loginForm = document.getElementById('login-form');
  const loginPhoneInput = document.getElementById('login-phone');
  const loginPhoneError = document.getElementById('login-phone-error');
  const loginPasswordInput = document.getElementById('login-password');
  const loginPasswordError = document.getElementById('login-password-error');
  const loginNotice = document.getElementById('login-notice');
  const loginButton = document.getElementById('login-continue-btn');

  /**
   * Read the account list from localStorage and always include the demo account.
   * If localStorage is empty or invalid, the demo account remains available.
   */
  function getAccounts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // No stored data: return only the demo account
      if (!raw) return [...DEMO_ACCOUNTS];

      const parsed = JSON.parse(raw);
      // Invalid array data: fall back to the demo account
      if (!Array.isArray(parsed)) return [...DEMO_ACCOUNTS];

      // Remove saved accounts that duplicate the demo phone number
      // to prevent ambiguous logins or data conflicts
      const savedAccounts = parsed
        .filter((account) => {
          return account && typeof account.phone === 'string' && typeof account.password === 'string';
        })
        .filter((account) => {
          return !DEMO_ACCOUNTS.some((demoAccount) => demoAccount.phone === account.phone);
        });

      // Return the demo account and all unique saved accounts
      return [...DEMO_ACCOUNTS, ...savedAccounts];
    } catch {
      // Reading or parsing failed: safely fall back to the demo account
      return [...DEMO_ACCOUNTS];
    }
  }

  // Find an account by phone number in the combined demo and saved list
  function findAccount(phone) {
    return getAccounts().find((account) => account.phone === phone) || null;
  }

  /**
   * Validate a phone number:
   * - A value is required.
   * - Only digits are allowed.
   * - The value must match PHONE_LENGTH.
   */
  function validatePhone(rawValue) {
    const value = rawValue.trim();

    if (!value) return { valid: false, message: 'Vui lòng nhập số điện thoại.' };
    if (!/^\d+$/.test(value)) return { valid: false, message: 'Số điện thoại chỉ được chứa chữ số.' };
    if (value.length !== PHONE_LENGTH) {
      return { valid: false, message: `Số điện thoại phải gồm đúng ${PHONE_LENGTH} chữ số.` };
    }

    return { valid: true, value };
  }

  function setFieldError(input, errorEl, message) {
    const hasError = Boolean(message);
    input.classList.toggle('input-error', hasError);
    input.setAttribute('aria-invalid', String(hasError));
    errorEl.classList.toggle('show', hasError);
    errorEl.textContent = message;
  }

  function showNotice(el, message, type = 'error') {
    el.hidden = false;
    el.textContent = message;
    el.classList.toggle('success', type === 'success');
    el.classList.add('show');
  }

  function hideNotice(el) {
    el.classList.remove('show', 'success');
    el.textContent = '';
    el.hidden = true;
  }

  // ===== HANDLE PASSWORD VISIBILITY BUTTONS =====
  // Each button uses data-target to identify which input type should be toggled
  document.querySelectorAll('.toggle-visibility').forEach((button) => {
    button.addEventListener('click', () => {
      const targetInput = document.getElementById(button.dataset.target);
      if (!targetInput) return;

      const isHidden = targetInput.type === 'password';
      targetInput.type = isHidden ? 'text' : 'password';
      button.textContent = isHidden ? 'Ẩn' : 'Hiện';
      button.setAttribute('aria-label', isHidden ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
    });
  });

  // Clear the previous error and shared notice when the phone value changes
  loginPhoneInput.addEventListener('input', () => {
    setFieldError(loginPhoneInput, loginPhoneError, '');
    hideNotice(loginNotice);
  });

  // Clear the previous error and shared notice when the password changes
  loginPasswordInput.addEventListener('input', () => {
    setFieldError(loginPasswordInput, loginPasswordError, '');
    hideNotice(loginNotice);
  });

  /**
   * LOGIN FLOW:
   * 1. Prevent the form's default submission.
   * 2. Validate the phone number and password.
   * 3. Find the account in localStorage or the demo account list.
   * 4. Show a success message and redirect to the home page.
   */
  loginForm.addEventListener('submit', (event) => {
    // Step 1: prevent the browser from reloading the page
    event.preventDefault();
    hideNotice(loginNotice);

    // Step 2a: validate the phone number format
    const phoneResult = validatePhone(loginPhoneInput.value);
    if (!phoneResult.valid) {
      setFieldError(loginPhoneInput, loginPhoneError, phoneResult.message);
      loginPhoneInput.focus();
      return; // Stop when the phone number is invalid
    }
    setFieldError(loginPhoneInput, loginPhoneError, '');

    // Step 2b: ensure a password was entered
    const password = loginPasswordInput.value;
    if (!password.trim()) {
      setFieldError(loginPasswordInput, loginPasswordError, 'Vui lòng nhập mật khẩu.');
      loginPasswordInput.focus();
      return;
    }
    setFieldError(loginPasswordInput, loginPasswordError, '');

    // Step 3: find the account associated with the entered phone number
    const account = findAccount(phoneResult.value);
    if (!account) {
      setFieldError(loginPhoneInput, loginPhoneError, 'Số điện thoại chưa được đăng ký.');
      loginPhoneInput.focus();
      return;
    }

    // Check whether the entered password matches the account
    if (account.password !== password) {
      setFieldError(loginPasswordInput, loginPasswordError, 'Mật khẩu không đúng.');
      loginPasswordInput.focus();
      return;
    }

    // Step 4: show a success message and redirect to the home page
    showNotice(loginNotice, 'Đăng nhập thành công! Đang chuyển hướng...', 'success');
    loginButton.disabled = true;
    loginPhoneInput.value = '';
    loginPasswordInput.value = '';

    // Keep the status visible long enough to be read before redirecting.
    setTimeout(() => {
      window.location.href = '/index.html';
    }, REDIRECT_DELAY);
  });
})();