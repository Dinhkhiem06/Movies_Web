(() => {
  'use strict';

  // ===== CẤU HÌNH DÙNG CHUNG CHO TRANG LOGIN =====
  const STORAGE_KEY = 'cinewave_accounts'; // Khóa lưu danh sách tài khoản trong localStorage
  const PHONE_LENGTH = 10;
  const DEMO_ACCOUNTS = [
    // Tài khoản demo mặc định, luôn có thể dùng để đăng nhập
    {
      phone: '0901234567',
      password: '123456',
    },
  ];

  // ===== LẤY CÁC PHẦN TỬ DOM CẦN THIẾT =====
  const loginForm = document.getElementById('login-form');
  const loginPhoneInput = document.getElementById('login-phone');
  const loginPhoneError = document.getElementById('login-phone-error');
  const loginPasswordInput = document.getElementById('login-password');
  const loginPasswordError = document.getElementById('login-password-error');
  const loginNotice = document.getElementById('login-notice');
  const loginButton = document.getElementById('login-continue-btn');

  /**
   * Lấy danh sách tài khoản từ localStorage và luôn gộp thêm tài khoản demo.
   * Nếu localStorage bị lỗi hoặc rỗng, trang vẫn đăng nhập được bằng tài khoản demo.
   */
  function getAccounts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Chưa có dữ liệu lưu trữ -> chỉ trả về tài khoản demo
      if (!raw) return [...DEMO_ACCOUNTS];

      const parsed = JSON.parse(raw);
      // Dữ liệu không đúng định dạng mảng -> fallback về tài khoản demo
      if (!Array.isArray(parsed)) return [...DEMO_ACCOUNTS];

      // Loại bỏ các tài khoản đã lưu bị trùng số điện thoại với tài khoản demo
      // để tránh đăng nhập nhầm hoặc xung đột dữ liệu
      const savedAccounts = parsed.filter((account) => {
        return !DEMO_ACCOUNTS.some((demoAccount) => demoAccount.phone === account.phone);
      });

      // Trả về tài khoản demo + tài khoản đã lưu (không trùng)
      return [...DEMO_ACCOUNTS, ...savedAccounts];
    } catch {
      // Có lỗi khi đọc/parse dữ liệu -> fallback an toàn về tài khoản demo
      return [...DEMO_ACCOUNTS];
    }
  }

  // Tìm tài khoản theo số điện thoại trong danh sách (demo + đã lưu)
  function findAccount(phone) {
    return getAccounts().find((account) => account.phone === phone) || null;
  }

  /**
   * Kiểm tra hợp lệ số điện thoại:
   * - Bắt buộc phải nhập
   * - Chỉ được chứa chữ số
   * - Phải đúng độ dài quy định (PHONE_LENGTH)
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
    input.classList.toggle('input-error', Boolean(message));
    errorEl.classList.toggle('show', Boolean(message));
    errorEl.textContent = message;
  }

  function showNotice(el, message, type = 'error') {
    el.textContent = message;
    el.classList.toggle('success', type === 'success');
    el.classList.add('show');
    el.hidden = false;
  }

  function hideNotice(el) {
    el.classList.remove('show', 'success');
    el.textContent = '';
    el.hidden = true;
  }

  // ===== XỬ LÝ NÚT HIỆN/ẨN MẬT KHẨU =====
  // Mỗi nút dùng thuộc tính data-target để biết input nào cần đổi type (password/text)
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

  // Khi người dùng nhập lại số điện thoại -> xóa lỗi cũ và ẩn thông báo chung
  loginPhoneInput.addEventListener('input', () => {
    setFieldError(loginPhoneInput, loginPhoneError, '');
    hideNotice(loginNotice);
  });

  // Khi người dùng nhập lại mật khẩu -> xóa lỗi cũ và ẩn thông báo chung
  loginPasswordInput.addEventListener('input', () => {
    setFieldError(loginPasswordInput, loginPasswordError, '');
    hideNotice(loginNotice);
  });

  /**
   * LUỒNG XỬ LÝ ĐĂNG NHẬP:
   * 1. Chặn hành vi submit mặc định của form.
   * 2. Validate số điện thoại và mật khẩu.
   * 3. Tìm tài khoản trong localStorage + tài khoản demo.
   * 4. Nếu đúng thông tin, hiển thị thông báo thành công và chuyển sang home.html.
   */
  loginForm.addEventListener('submit', (event) => {
    // Bước 1: Ngăn form load lại trang theo cách mặc định của trình duyệt
    event.preventDefault();
    hideNotice(loginNotice);

    // Bước 2a: Kiểm tra định dạng số điện thoại
    const phoneResult = validatePhone(loginPhoneInput.value);
    if (!phoneResult.valid) {
      setFieldError(loginPhoneInput, loginPhoneError, phoneResult.message);
      return; // Dừng lại nếu số điện thoại không hợp lệ
    }
    setFieldError(loginPhoneInput, loginPhoneError, '');

    // Bước 2b: Kiểm tra mật khẩu có được nhập hay không
    if (!loginPasswordInput.value.trim()) {
      setFieldError(loginPasswordInput, loginPasswordError, 'Vui lòng nhập mật khẩu.');
      return;
    }
    setFieldError(loginPasswordInput, loginPasswordError, '');

    // Bước 3: Tìm tài khoản tương ứng với số điện thoại đã nhập
    const account = findAccount(phoneResult.value);
    if (!account) {
      showNotice(loginNotice, 'Số điện thoại chưa được đăng ký.');
      return;
    }

    // Kiểm tra mật khẩu có khớp với tài khoản tìm được không
    if (account.password !== loginPasswordInput.value.trim()) {
      showNotice(loginNotice, 'Mật khẩu không đúng.');
      return;
    }

    // Bước 4: Đăng nhập thành công -> thông báo và chuyển hướng sang trang chủ
    showNotice(loginNotice, 'Đăng nhập thành công! Đang chuyển hướng...', 'success');
    loginButton.disabled = true;
    loginPhoneInput.value = '';
    loginPasswordInput.value = '';

    // Trì hoãn 500ms để người dùng kịp thấy thông báo trước khi chuyển trang
    setTimeout(() => {
      window.location.href = 'home.html';
    }, 500);
  });
})();