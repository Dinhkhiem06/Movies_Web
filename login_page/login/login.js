// Trần Việt Quân - B2410746
'use strict';

// Demo account used to test the login feature.
const STORAGE_KEY = 'flix_accounts';
const DEMO_ACCOUNT = {
  phone: '0901234567',
  password: '123456',
};

// Get the elements used on the page.
const loginForm = document.getElementById('login-form');
const phoneInput = document.getElementById('login-phone');
const passwordInput = document.getElementById('login-password');
const phoneError = document.getElementById('login-phone-error');
const passwordError = document.getElementById('login-password-error');
const loginNotice = document.getElementById('login-notice');
const loginButton = document.getElementById('login-continue-btn');
const passwordButton = document.querySelector('.toggle-visibility');

// Read registered accounts from localStorage.
function getAccounts() {
  let savedAccounts = [];

  try {
    savedAccounts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    savedAccounts = [];
  }

  if (!Array.isArray(savedAccounts)) {
    savedAccounts = [];
  }

  // Always add the demo account to the beginning of the list.
  return [DEMO_ACCOUNT].concat(savedAccounts);
}

// Find an account by phone number.
function findAccount(phone) {
  const accounts = getAccounts();

  for (let i = 0; i < accounts.length; i += 1) {
    if (accounts[i] && accounts[i].phone === phone) {
      return accounts[i];
    }
  }

  return null;
}

function showFieldError(input, errorElement, message) {
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

function showLoginNotice(message, isSuccess) {
  loginNotice.hidden = false;
  loginNotice.textContent = message;
  loginNotice.classList.add('show');

  if (isSuccess) {
    loginNotice.classList.add('success');
  } else {
    loginNotice.classList.remove('success');
  }
}

function hideLoginNotice() {
  loginNotice.hidden = true;
  loginNotice.textContent = '';
  loginNotice.classList.remove('show', 'success');
}

// Show or hide the password.
passwordButton.addEventListener('click', function () {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    passwordButton.textContent = 'Hide';
    passwordButton.setAttribute('aria-label', 'Hide password');
  } else {
    passwordInput.type = 'password';
    passwordButton.textContent = 'Show';
    passwordButton.setAttribute('aria-label', 'Show password');
  }
});

phoneInput.addEventListener('input', function () {
  clearFieldError(phoneInput, phoneError);
  hideLoginNotice();
});

passwordInput.addEventListener('input', function () {
  clearFieldError(passwordInput, passwordError);
  hideLoginNotice();
});

// Validate the form when the user clicks Login.
loginForm.addEventListener('submit', function (event) {
  event.preventDefault();
  hideLoginNotice();

  const phone = phoneInput.value.trim();
  const password = passwordInput.value;

  if (phone === '') {
    showFieldError(phoneInput, phoneError, 'Please enter your phone number.');
    phoneInput.focus();
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    showFieldError(phoneInput, phoneError, 'Phone number must contain exactly 10 digits.');
    phoneInput.focus();
    return;
  }

  clearFieldError(phoneInput, phoneError);

  if (password.trim() === '') {
    showFieldError(passwordInput, passwordError, 'Please enter your password.');
    passwordInput.focus();
    return;
  }

  clearFieldError(passwordInput, passwordError);

  const account = findAccount(phone);

  if (account === null) {
    showFieldError(phoneInput, phoneError, 'This phone number is not registered.');
    phoneInput.focus();
    return;
  }

  if (account.password !== password) {
    showFieldError(passwordInput, passwordError, 'Incorrect password.');
    passwordInput.focus();
    return;
  }

  showLoginNotice('Login successful! Redirecting...', true);
  loginButton.disabled = true;

  setTimeout(function () {
    window.location.href = '/index.html';
  }, 500);
});