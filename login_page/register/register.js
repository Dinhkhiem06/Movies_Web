'use strict';

// Values used for the demo registration flow.
const STORAGE_KEY = 'flix_accounts';
const DEMO_PHONE = '0901234567';
const DEMO_OTP = '123456';
const OTP_TIME = 120;

// Store the form data until the OTP is confirmed.
let pendingPhone = '';
let pendingPassword = '';
let secondsLeft = OTP_TIME;
let timerId = null;

// The two views on the Register page.
const registerView = document.getElementById('view-register');
const otpView = document.getElementById('view-otp');

// Registration form elements.
const registerForm = document.getElementById('register-form');
const phoneInput = document.getElementById('register-phone');
const passwordInput = document.getElementById('register-password');
const confirmInput = document.getElementById('register-confirm-password');
const phoneError = document.getElementById('register-phone-error');
const passwordError = document.getElementById('register-password-error');
const confirmError = document.getElementById('register-confirm-password-error');
const registerNotice = document.getElementById('register-notice');

// OTP view elements.
const otpForm = document.getElementById('otp-form');
const otpBoxes = document.querySelectorAll('.otp-box');
const otpError = document.getElementById('otp-group-error');
const otpNotice = document.getElementById('otp-notice');
const otpPhoneDisplay = document.getElementById('otp-phone-display');
const otpTimer = document.getElementById('otp-timer');
const otpTimerWrap = document.getElementById('otp-timer-wrap');
const otpResendButton = document.getElementById('otp-resend-btn');
const otpConfirmButton = document.getElementById('otp-confirm-btn');
const otpBackButton = document.getElementById('otp-back');

// Read registered accounts.
function getSavedAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    if (Array.isArray(accounts)) {
      return accounts;
    }
  } catch (error) {
    // Return an empty list when the saved data is invalid.
  }

  return [];
}

function findAccount(phone) {
  if (phone === DEMO_PHONE) {
    return true;
  }

  const accounts = getSavedAccounts();

  for (let i = 0; i < accounts.length; i += 1) {
    if (accounts[i] && accounts[i].phone === phone) {
      return true;
    }
  }

  return false;
}

// Possible results: success, duplicate, or error.
function saveAccount(phone, password) {
  if (findAccount(phone)) {
    return 'duplicate';
  }

  try {
    const accounts = getSavedAccounts();
    accounts.push({ phone: phone, password: password });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    return 'success';
  } catch (error) {
    return 'error';
  }
}

function showFieldError(input, errorElement, message) {
  input.classList.remove('input-success');
  input.classList.add('input-error');
  input.setAttribute('aria-invalid', 'true');
  errorElement.textContent = message;
  errorElement.classList.add('show');
}

function clearFieldError(input, errorElement) {
  input.classList.remove('input-error');
  input.setAttribute('aria-invalid', 'false');
  errorElement.textContent = '';
  errorElement.classList.remove('show');
}

function showNotice(element, message, isSuccess) {
  element.hidden = false;
  element.textContent = message;
  element.classList.add('show');

  if (isSuccess) {
    element.classList.add('success');
  } else {
    element.classList.remove('success');
  }
}

function hideNotice(element) {
  element.hidden = true;
  element.textContent = '';
  element.classList.remove('show', 'success');
}

function showRegisterView() {
  registerView.hidden = false;
  registerView.classList.add('is-active');
  otpView.hidden = true;
  otpView.classList.remove('is-active');
}

function showOtpView() {
  registerView.hidden = true;
  registerView.classList.remove('is-active');
  otpView.hidden = false;
  otpView.classList.add('is-active');
}

// Show or hide the two password fields.
const passwordButtons = document.querySelectorAll('.toggle-visibility');

for (let i = 0; i < passwordButtons.length; i += 1) {
  passwordButtons[i].addEventListener('click', function () {
    const inputId = this.getAttribute('data-target');
    const input = document.getElementById(inputId);

    if (input.type === 'password') {
      input.type = 'text';
      this.textContent = 'Hide';
      this.setAttribute('aria-label', 'Hide password');
    } else {
      input.type = 'password';
      this.textContent = 'Show';
      this.setAttribute('aria-label', 'Show password');
    }
  });
}

// Perform simple validation while the user types.
phoneInput.addEventListener('input', function () {
  hideNotice(registerNotice);
  clearFieldError(phoneInput, phoneError);
  phoneInput.classList.remove('input-success');

  if (phoneInput.value !== '' && !/^\d+$/.test(phoneInput.value)) {
    showFieldError(phoneInput, phoneError, 'Phone number can only contain digits.');
  } else if (phoneInput.value.length === 10) {
    phoneInput.classList.add('input-success');
  }
});

passwordInput.addEventListener('input', function () {
  clearFieldError(passwordInput, passwordError);
  passwordInput.classList.remove('input-success');

  if (passwordInput.value !== '' && passwordInput.value.length < 6) {
    showFieldError(passwordInput, passwordError, 'Password must contain at least 6 characters.');
  } else if (passwordInput.value.length >= 6) {
    passwordInput.classList.add('input-success');
  }
});

confirmInput.addEventListener('input', function () {
  clearFieldError(confirmInput, confirmError);
});

// Validate the registration form.
registerForm.addEventListener('submit', function (event) {
  event.preventDefault();
  hideNotice(registerNotice);

  const phone = phoneInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmInput.value;

  if (phone === '') {
    showFieldError(phoneInput, phoneError, 'Please enter your phone number.');
    phoneInput.focus();
    return;
  }

  if (!/^\d+$/.test(phone)) {
    showFieldError(phoneInput, phoneError, 'Phone number can only contain digits.');
    phoneInput.focus();
    return;
  }

  if (phone.length !== 10) {
    showFieldError(phoneInput, phoneError, 'Phone number must contain exactly 10 digits.');
    phoneInput.focus();
    return;
  }

  clearFieldError(phoneInput, phoneError);
  phoneInput.classList.add('input-success');

  if (findAccount(phone)) {
    showFieldError(phoneInput, phoneError, 'This phone number is already registered.');
    phoneInput.focus();
    return;
  }

  if (password.trim() === '') {
    showFieldError(passwordInput, passwordError, 'Please enter your password.');
    passwordInput.focus();
    return;
  }

  if (password.length < 6) {
    showFieldError(passwordInput, passwordError, 'Password must contain at least 6 characters.');
    passwordInput.focus();
    return;
  }

  clearFieldError(passwordInput, passwordError);
  passwordInput.classList.add('input-success');

  if (confirmPassword !== password) {
    showFieldError(confirmInput, confirmError, 'Passwords do not match.');
    confirmInput.focus();
    return;
  }

  clearFieldError(confirmInput, confirmError);

  pendingPhone = phone;
  pendingPassword = password;
  otpPhoneDisplay.textContent = phone;
  otpConfirmButton.disabled = false;

  clearOtpBoxes();
  hideNotice(otpNotice);
  showOtpView();
  startTimer();
  otpBoxes[0].focus();
});

function clearOtpError() {
  otpError.textContent = '';
  otpError.classList.remove('show');

  for (let i = 0; i < otpBoxes.length; i += 1) {
    otpBoxes[i].classList.remove('error');
    otpBoxes[i].setAttribute('aria-invalid', 'false');
  }
}

function showOtpError(message, markEmptyOnly) {
  otpError.textContent = message;
  otpError.classList.add('show');

  for (let i = 0; i < otpBoxes.length; i += 1) {
    const shouldMark = !markEmptyOnly || otpBoxes[i].value === '';

    if (shouldMark) {
      otpBoxes[i].classList.add('error');
      otpBoxes[i].setAttribute('aria-invalid', 'true');
    }
  }
}

function clearOtpBoxes() {
  for (let i = 0; i < otpBoxes.length; i += 1) {
    otpBoxes[i].value = '';
    otpBoxes[i].classList.remove('filled');
  }

  clearOtpError();
}

function getOtpCode() {
  let code = '';

  for (let i = 0; i < otpBoxes.length; i += 1) {
    code += otpBoxes[i].value;
  }

  return code;
}

// Fill the six OTP boxes from one value.
function fillOtpBoxes(value) {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  clearOtpBoxes();

  for (let i = 0; i < digits.length; i += 1) {
    otpBoxes[i].value = digits[i];
    otpBoxes[i].classList.add('filled');
  }

  const nextIndex = Math.min(digits.length, otpBoxes.length - 1);
  otpBoxes[nextIndex].focus();
}

for (let i = 0; i < otpBoxes.length; i += 1) {
  otpBoxes[i].addEventListener('input', function () {
    const digits = this.value.replace(/\D/g, '');

    if (digits.length > 1) {
      fillOtpBoxes(digits);
      return;
    }

    this.value = digits.slice(-1);

    if (this.value !== '') {
      this.classList.add('filled');

      if (i < otpBoxes.length - 1) {
        otpBoxes[i + 1].focus();
      }
    } else {
      this.classList.remove('filled');
    }

    clearOtpError();

    if (secondsLeft > 0) {
      hideNotice(otpNotice);
    }
  });

  otpBoxes[i].addEventListener('keydown', function (event) {
    if (event.key === 'Backspace' && this.value === '' && i > 0) {
      otpBoxes[i - 1].value = '';
      otpBoxes[i - 1].classList.remove('filled');
      otpBoxes[i - 1].focus();
    }
  });

  otpBoxes[i].addEventListener('paste', function (event) {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text');
    fillOtpBoxes(pastedText);
  });
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const minuteText = String(minutes).padStart(2, '0');
  const secondText = String(seconds).padStart(2, '0');

  return minuteText + ':' + secondText;
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function expireOtp() {
  stopTimer();
  secondsLeft = 0;
  otpTimerWrap.style.display = 'none';
  otpResendButton.hidden = false;
  showNotice(otpNotice, 'The OTP has expired. Please request a new code.', false);
}

function startTimer() {
  stopTimer();
  secondsLeft = OTP_TIME;
  otpTimer.textContent = formatTime(secondsLeft);
  otpTimerWrap.style.display = 'inline';
  otpResendButton.hidden = true;

  timerId = setInterval(function () {
    secondsLeft -= 1;
    otpTimer.textContent = formatTime(secondsLeft);

    if (secondsLeft <= 0) {
      expireOtp();
    }
  }, 1000);
}

otpBackButton.addEventListener('click', function () {
  stopTimer();
  hideNotice(otpNotice);
  showRegisterView();
  phoneInput.focus();
});

otpResendButton.addEventListener('click', function () {
  clearOtpBoxes();
  showNotice(otpNotice, 'A new OTP was sent to ' + pendingPhone + '.', true);
  startTimer();
  otpBoxes[0].focus();
});

// Validate the OTP and save the account.
otpForm.addEventListener('submit', function (event) {
  event.preventDefault();

  if (secondsLeft <= 0) {
    expireOtp();
    otpBoxes[0].focus();
    return;
  }

  const otpCode = getOtpCode();

  if (otpCode.length !== 6) {
    showOtpError('Please enter all 6 OTP digits.', true);

    for (let i = 0; i < otpBoxes.length; i += 1) {
      if (otpBoxes[i].value === '') {
        otpBoxes[i].focus();
        break;
      }
    }

    return;
  }

  if (otpCode !== DEMO_OTP) {
    clearOtpBoxes();
    showOtpError('Incorrect OTP. Please try again.', false);
    otpBoxes[0].focus();
    return;
  }

  hideNotice(otpNotice);
  const saveResult = saveAccount(pendingPhone, pendingPassword);

  if (saveResult === 'duplicate') {
    stopTimer();
    showRegisterView();
    showFieldError(phoneInput, phoneError, 'This phone number was just registered.');
    phoneInput.focus();
    return;
  }

  if (saveResult === 'error') {
    showNotice(otpNotice, 'Unable to save the account in this browser. Please try again.', false);
    return;
  }

  stopTimer();
  showNotice(otpNotice, 'Verification successful! Please log in.', true);
  otpConfirmButton.disabled = true;

  phoneInput.value = '';
  passwordInput.value = '';
  confirmInput.value = '';
  phoneInput.classList.remove('input-success');
  passwordInput.classList.remove('input-success');
  clearOtpBoxes();

  setTimeout(function () {
    window.location.href = '/login_page/login/login.html';
  }, 500);
});