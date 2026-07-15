(() => {
  'use strict';

  // ===== REGISTRATION AND OTP PAGE CONFIGURATION =====
  // DEMO_OTP is a fixed code that replaces a real SMS flow.
  // DEMO_ACCOUNTS contains accounts for quick login testing.
  const STORAGE_KEY = 'cinewave_accounts';
  const DEMO_OTP = '123456';
  const OTP_DURATION = 120;
  const PHONE_LENGTH = 10;
  const OTP_LENGTH = 6;
  const PASSWORD_MIN_LENGTH = 6;
  const REDIRECT_DELAY = 1500;
  const DEMO_ACCOUNTS = [
    {
      phone: '0901234567',
      password: '123456',
    },
  ];

  /**
   * TEMPORARY REGISTRATION STATE.
   * An account is stored in localStorage only after successful OTP verification,
   * so the phone number and password are kept here until then.
   */
  const state = {
    phone: null,
    password: null,
    timerId: null,
    expiresAt: null,
    remaining: OTP_DURATION,
  };

  // ===== TWO VIEWS SHARED BY register.html =====
  // The "register" view contains the initial registration form.
  // The "otp" view contains the OTP input form.
  const views = {
    register: document.getElementById('view-register'),
    otp: document.getElementById('view-otp'),
  };

  // ----- Registration form DOM elements -----
  const registerForm = document.getElementById('register-form');
  const registerPhoneInput = document.getElementById('register-phone');
  const registerPhoneError = document.getElementById('register-phone-error');
  const registerPasswordInput = document.getElementById('register-password');
  const registerPasswordError = document.getElementById('register-password-error');
  const registerConfirmInput = document.getElementById('register-confirm-password');
  const registerConfirmError = document.getElementById('register-confirm-password-error');
  const registerNotice = document.getElementById('register-notice');

  // ----- OTP form DOM elements -----
  const otpPhoneDisplay = document.getElementById('otp-phone-display');
  const otpNotice = document.getElementById('otp-notice');
  const otpInputsWrap = document.getElementById('otp-inputs');
  const otpBoxes = Array.from(otpInputsWrap.querySelectorAll('.otp-box')); // List of six OTP inputs
  const otpGroupError = document.getElementById('otp-group-error');
  const otpTimerWrap = document.getElementById('otp-timer-wrap');
  const otpTimerEl = document.getElementById('otp-timer');
  const otpResendBtn = document.getElementById('otp-resend-btn');
  const otpConfirmBtn = document.getElementById('otp-confirm-btn');
  const otpBackBtn = document.getElementById('otp-back');
  const otpForm = document.getElementById('otp-form');

  /**
   * Read accounts from localStorage and merge them with the demo account.
   * Remove duplicate phone numbers so saved data cannot override the demo account.
   */
  function getAccounts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [...DEMO_ACCOUNTS];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [...DEMO_ACCOUNTS];

      const savedAccounts = parsed
        .filter((account) => {
          return account && typeof account.phone === 'string' && typeof account.password === 'string';
        })
        .filter((account) => {
          return !DEMO_ACCOUNTS.some((demoAccount) => demoAccount.phone === account.phone);
        });

      return [...DEMO_ACCOUNTS, ...savedAccounts];
    } catch {
      // Invalid data: keep the demo account available
      return [...DEMO_ACCOUNTS];
    }
  }

  // Find an account by phone number to detect duplicate registrations
  function findAccount(phone) {
    return getAccounts().find((account) => account.phone === phone) || null;
  }

  /**
   * Save a new account after successful OTP verification.
   * localStorage acts as a mock database for this static website.
   */
  function saveAccount(phone, password) {
    try {
      const accounts = getAccounts();

      if (accounts.some((account) => account.phone === phone)) {
        return { ok: false, reason: 'duplicate' };
      }

      const savedAccounts = accounts.filter((account) => {
        return !DEMO_ACCOUNTS.some((demoAccount) => demoAccount.phone === account.phone);
      });

      savedAccounts.push({ phone, password });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAccounts));
      return { ok: true };
    } catch {
      return { ok: false, reason: 'storage' };
    }
  }

  // Validate the phone number when the registration form is submitted
  function validatePhone(rawValue) {
    const value = rawValue.trim();

    if (!value) return { valid: false, message: 'Vui lòng nhập số điện thoại.' };
    if (!/^\d+$/.test(value)) return { valid: false, message: 'Số điện thoại chỉ được chứa chữ số.' };
    if (value.length !== PHONE_LENGTH) {
      return { valid: false, message: `Số điện thoại phải gồm đúng ${PHONE_LENGTH} chữ số.` };
    }

    return { valid: true, value };
  }

  // Validate the password without silently changing leading or trailing spaces.
  function validatePassword(rawValue) {
    const value = rawValue;

    if (!value.trim()) return { valid: false, message: 'Vui lòng nhập mật khẩu.' };
    if (value.length < PASSWORD_MIN_LENGTH) {
      return { valid: false, message: `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.` };
    }

    return { valid: true, value };
  }

  // ===== ERROR AND NOTICE DISPLAY HELPERS =====

  // Show or clear the error for a specific input
  function setFieldError(input, errorEl, message) {
    const hasError = Boolean(message);
    input.classList.toggle('input-error', hasError);
    input.setAttribute('aria-invalid', String(hasError));
    errorEl.classList.toggle('show', hasError);
    errorEl.textContent = message;
  }

  // Show a shared error or success notice on the form
  function showNotice(el, message, type = 'error') {
    el.hidden = false;
    el.textContent = message;
    el.classList.toggle('success', type === 'success');
    el.classList.add('show');
  }

  // Hide the shared notice and restore its initial state
  function hideNotice(el) {
    el.classList.remove('show', 'success');
    el.textContent = '';
    el.hidden = true;
  }

  // Switch between the registration and OTP views
  function showView(name) {
    Object.entries(views).forEach(([key, el]) => {
      const isTarget = key === name;
      el.hidden = !isTarget;
      el.classList.toggle('is-active', isTarget);
    });
  }

  // ===== LIVE VALIDATION =====

  // Report a phone error as soon as a non-digit character is entered
  function updatePhoneLiveState() {
    const raw = registerPhoneInput.value;
    const isDigitsOnly = /^\d*$/.test(raw);

    if (!isDigitsOnly) {
      registerPhoneInput.classList.remove('input-success');
      setFieldError(registerPhoneInput, registerPhoneError, 'Số điện thoại chỉ được chứa chữ số.');
      return;
    }

    setFieldError(registerPhoneInput, registerPhoneError, '');
    // Mark the input as successful when it reaches the required length
    registerPhoneInput.classList.toggle('input-success', raw.length === PHONE_LENGTH);
  }

  // Report a password error while its value is shorter than the minimum length
  function updatePasswordLiveState() {
    const value = registerPasswordInput.value;

    if (!value.trim()) {
      registerPasswordInput.classList.remove('input-success');
      setFieldError(registerPasswordInput, registerPasswordError, '');
      return;
    }

    if (value.length < PASSWORD_MIN_LENGTH) {
      registerPasswordInput.classList.remove('input-success');
      setFieldError(registerPasswordInput, registerPasswordError, `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`);
      return;
    }

    setFieldError(registerPasswordInput, registerPasswordError, '');
    registerPasswordInput.classList.add('input-success');
  }

  // ===== OTP INPUT HELPERS =====

  function setOtpValidation(message = '', invalidBoxes = []) {
    const invalidSet = new Set(invalidBoxes);

    otpGroupError.textContent = message;
    otpGroupError.classList.toggle('show', Boolean(message));

    otpBoxes.forEach((box) => {
      const isInvalid = invalidSet.has(box);
      box.classList.toggle('error', isInvalid);
      box.setAttribute('aria-invalid', String(isInvalid));
    });
  }

  function refreshOtpValidationAfterEdit(hadValidationError) {
    const isExpired = state.expiresAt === null
      ? state.remaining <= 0
      : getRemainingSeconds() <= 0;

    if (isExpired) {
      setOtpValidation('', otpBoxes);
      return false;
    }

    if (!hadValidationError) {
      setOtpValidation();
      return true;
    }

    const emptyBoxes = otpBoxes.filter((box) => !box.value);
    const message = emptyBoxes.length
      ? `Vui lòng nhập đầy đủ ${OTP_LENGTH} chữ số OTP.`
      : '';
    setOtpValidation(message, emptyBoxes);
    return true;
  }

  // Reset all OTP inputs when switching views, resending the code, and so on
  function clearOtpBoxes() {
    otpBoxes.forEach((box) => {
      box.value = '';
      box.classList.remove('filled');
    });

    setOtpValidation();
  }

  // Distribute an autofilled or pasted code across the remaining OTP boxes.
  function distributeOtpDigits(rawValue, startIndex = 0) {
    const availableLength = OTP_LENGTH - startIndex;
    const digits = rawValue.replace(/\D/g, '').slice(0, availableLength).split('');
    if (!digits.length) return;

    digits.forEach((digit, offset) => {
      const box = otpBoxes[startIndex + offset];
      box.value = digit;
      box.classList.add('filled');
      box.setAttribute('aria-invalid', 'false');
    });

    const firstEmptyIndex = startIndex + digits.length;
    const focusIndex = firstEmptyIndex < OTP_LENGTH ? firstEmptyIndex : OTP_LENGTH - 1;
    otpBoxes[focusIndex].focus();
  }

  // Combine the six input values into one complete OTP string
  function getOtpValue() {
    return otpBoxes.map((box) => box.value).join('');
  }

  // Format a number of seconds as mm:ss for the countdown display
  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  function getRemainingSeconds() {
    if (state.expiresAt === null) return 0;
    return Math.max(0, Math.ceil((state.expiresAt - Date.now()) / 1000));
  }

  // Stop the previous timer before creating another interval
  function stopTimer() {
    if (state.timerId !== null) {
      clearInterval(state.timerId);
      state.timerId = null;
    }

    state.expiresAt = null;
  }

  function updateTimer() {
    state.remaining = getRemainingSeconds();
    otpTimerEl.textContent = formatTime(state.remaining);

    if (state.remaining > 0) return;

    stopTimer();
    state.remaining = 0;
    otpTimerWrap.style.display = 'none';
    otpResendBtn.hidden = false;
    showNotice(otpNotice, 'Mã OTP đã hết hiệu lực. Vui lòng gửi lại mã mới.');
  }

  // Count down the OTP validity period.
  // When it expires, show the resend button and block verification.
  function startTimer() {
    stopTimer();
    state.expiresAt = Date.now() + OTP_DURATION * 1000;
    state.remaining = OTP_DURATION;
    otpTimerEl.textContent = formatTime(state.remaining);
    otpTimerWrap.style.display = 'inline';
    otpResendBtn.hidden = true;
    state.timerId = setInterval(updateTimer, 1000);
  }

  // Open the OTP view and start the countdown after valid registration input
  function enterOtpView() {
    otpPhoneDisplay.textContent = state.phone;
    otpConfirmBtn.disabled = false;
    hideNotice(otpNotice);
    clearOtpBoxes();
    showView('otp');
    startTimer();
    otpBoxes[0].focus(); // Focus the first input so the user can start typing immediately
  }

  // ===== PASSWORD VISIBILITY BUTTONS =====
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

  // Run live validation as the user types
  registerPhoneInput.addEventListener('input', updatePhoneLiveState);
  registerPasswordInput.addEventListener('input', updatePasswordLiveState);
  registerConfirmInput.addEventListener('input', () => {
    // Clear the previous error; matching is checked again on submission
    setFieldError(registerConfirmInput, registerConfirmError, '');
  });

  /**
   * REGISTRATION FLOW:
   * 1. Validate the phone number, password, and confirmation password.
   * 2. Reject phone numbers already present in localStorage or the demo account.
   * 3. Keep the phone number and password in state, then open the OTP view.
   */
  registerForm.addEventListener('submit', (event) => {
    // Prevent the default page reload and handle submission with JavaScript
    event.preventDefault();
    hideNotice(registerNotice);

    // Step 1a: validate the phone number format
    const phoneResult = validatePhone(registerPhoneInput.value);
    if (!phoneResult.valid) {
      setFieldError(registerPhoneInput, registerPhoneError, phoneResult.message);
      registerPhoneInput.focus();
      return;
    }
    setFieldError(registerPhoneInput, registerPhoneError, '');

    // Step 2: check whether the phone number is already registered
    if (findAccount(phoneResult.value)) {
      setFieldError(registerPhoneInput, registerPhoneError, 'Số điện thoại đã được đăng ký.');
      registerPhoneInput.focus();
      return;
    }

    // Step 1b: validate the password
    const passwordResult = validatePassword(registerPasswordInput.value);
    if (!passwordResult.valid) {
      setFieldError(registerPasswordInput, registerPasswordError, passwordResult.message);
      registerPasswordInput.focus();
      return;
    }
    setFieldError(registerPasswordInput, registerPasswordError, '');

    // Step 1c: confirm that both passwords match
    if (registerConfirmInput.value !== passwordResult.value) {
      setFieldError(registerConfirmInput, registerConfirmError, 'Mật khẩu xác nhận không khớp.');
      registerConfirmInput.focus();
      return;
    }
    setFieldError(registerConfirmInput, registerConfirmError, '');

    // Step 3: store valid input in state and open the OTP step
    state.phone = phoneResult.value;
    state.password = passwordResult.value;
    enterOtpView();
  });

  // Back button: stop the timer and return to the registration view
  otpBackBtn.addEventListener('click', () => {
    stopTimer();
    hideNotice(otpNotice);
    showView('register');
    registerPhoneInput.focus();
  });

  /**
   * MANAGE THE SIX OTP INPUTS:
   * - Accept digits only.
   * - Move focus to the next input after a digit is entered.
   * - Move back when Backspace is pressed in an empty input.
   * - Distribute a pasted sequence across all inputs.
   */
  otpBoxes.forEach((box, index) => {
    // Handle typing in each input
    box.addEventListener('input', () => {
      const hadValidationError = otpGroupError.classList.contains('show')
        || otpBoxes.some((otpBox) => otpBox.getAttribute('aria-invalid') === 'true');
      const digitsOnly = box.value.replace(/\D/g, ''); // Remove every non-digit character

      if (digitsOnly.length > 1) {
        clearOtpBoxes();
        distributeOtpDigits(digitsOnly);
        if (refreshOtpValidationAfterEdit(hadValidationError)) hideNotice(otpNotice);
        return;
      }

      box.value = digitsOnly.slice(-1); // Keep only the last digit entered
      box.classList.toggle('filled', box.value !== '');
      if (refreshOtpValidationAfterEdit(hadValidationError)) hideNotice(otpNotice);

      // Move to the next input after the current one receives a value
      if (box.value && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }
    });

    // Move to the previous input when Backspace is pressed on an empty input
    box.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !box.value && index > 0) {
        const hadValidationError = otpGroupError.classList.contains('show')
          || otpBoxes.some((otpBox) => otpBox.getAttribute('aria-invalid') === 'true');
        otpBoxes[index - 1].focus();
        otpBoxes[index - 1].value = '';
        otpBoxes[index - 1].classList.remove('filled');
        if (refreshOtpValidationAfterEdit(hadValidationError)) hideNotice(otpNotice);
      }
    });

    // Handle pasting an entire OTP at once
    box.addEventListener('paste', (event) => {
      event.preventDefault(); // Prevent the browser's default paste behavior

      const clipboard = event.clipboardData || window.clipboardData;
      const pasted = clipboard ? clipboard.getData('text').replace(/\D/g, '') : '';
      if (!pasted) return;

      const hadValidationError = otpGroupError.classList.contains('show')
        || otpBoxes.some((otpBox) => otpBox.getAttribute('aria-invalid') === 'true');
      clearOtpBoxes();
      distributeOtpDigits(pasted);
      if (refreshOtpValidationAfterEdit(hadValidationError)) hideNotice(otpNotice);
    });
  });

  /**
   * OTP VERIFICATION FLOW:
   * 1. Reject an expired OTP.
   * 2. Require all six digits.
   * 3. Compare the input with DEMO_OTP.
   * 4. Save a valid account to localStorage and return to the login page.
   */
  otpForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Handle verification with JavaScript instead of a default submission

    const value = getOtpValue();

    // Step 1: ensure the OTP is still valid
    state.remaining = getRemainingSeconds();
    if (state.remaining <= 0) {
      stopTimer();
      state.remaining = 0;
      showNotice(otpNotice, 'Mã OTP đã hết hiệu lực. Vui lòng gửi lại mã mới.');
      otpTimerWrap.style.display = 'none';
      otpResendBtn.hidden = false;
      setOtpValidation('', otpBoxes);
      otpBoxes[0].focus();
      return;
    }

    // Step 2: ensure all OTP digits were entered
    if (value.length < OTP_LENGTH) {
      const emptyBoxes = otpBoxes.filter((box) => !box.value);
      setOtpValidation(`Vui lòng nhập đầy đủ ${OTP_LENGTH} chữ số OTP.`, emptyBoxes);
      emptyBoxes[0].focus();
      return;
    }

    // Step 3: compare the entered code with the demo OTP
    if (value !== DEMO_OTP) {
      otpBoxes.forEach((box) => {
        box.value = '';
        box.classList.remove('filled');
      });
      setOtpValidation('Mã OTP không đúng. Vui lòng thử lại.', otpBoxes);
      otpBoxes[0].focus();
      return;
    }

    // Step 4: save the verified account and redirect to the login page
    hideNotice(otpNotice);
    const saveResult = saveAccount(state.phone, state.password);

    if (!saveResult.ok) {
      if (saveResult.reason === 'duplicate') {
        stopTimer();
        showView('register');
        setFieldError(registerPhoneInput, registerPhoneError, 'Số điện thoại vừa được đăng ký.');
        registerPhoneInput.focus();
        return;
      }

      showNotice(otpNotice, 'Không thể lưu tài khoản trên trình duyệt này. Vui lòng thử lại.');
      return;
    }

    stopTimer();

    showNotice(otpNotice, 'Xác thực thành công! Vui lòng đăng nhập lại.', 'success');
    otpConfirmBtn.disabled = true;

    registerPhoneInput.value = '';
    registerPasswordInput.value = '';
    registerConfirmInput.value = '';
    registerPhoneInput.classList.remove('input-success');
    registerPasswordInput.classList.remove('input-success');
    clearOtpBoxes();

    // Keep the status visible long enough to be read before redirecting.
    setTimeout(() => {
      window.location.href = '../login/login.html';
    }, REDIRECT_DELAY);
  });

  // Simulate resending an OTP by resetting the inputs, notice, and countdown
  otpResendBtn.addEventListener('click', () => {
    hideNotice(otpNotice);
    clearOtpBoxes();
    showNotice(otpNotice, `Đã gửi lại mã OTP đến ${state.phone}.`, 'success');
    startTimer();
    otpBoxes[0].focus();
  });
})();