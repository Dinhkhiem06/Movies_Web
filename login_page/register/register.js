(() => {
  'use strict';

  // ===== CẤU HÌNH CHO TRANG ĐĂNG KÝ VÀ OTP =====
  // DEMO_OTP là mã OTP cố định (thay cho việc gửi SMS thật).
  // DEMO_ACCOUNTS là tài khoản có sẵn để test đăng nhập nhanh.
  const STORAGE_KEY = 'cinewave_accounts';
  const DEMO_OTP = '123456';
  const OTP_DURATION = 120;
  const PHONE_LENGTH = 10;
  const OTP_LENGTH = 6;
  const PASSWORD_MIN_LENGTH = 6;
  const DEMO_ACCOUNTS = [
    {
      phone: '0901234567',
      password: '123456',
    },
  ];

  /**
   * STATE TẠM CỦA QUÁ TRÌNH ĐĂNG KÝ.
   * Tài khoản chỉ thực sự được lưu vào localStorage sau khi xác thực OTP thành công,
   * nên trước đó phone/password phải giữ tạm ở đây.
   */
  const state = {
    phone: null,
    password: null,
    timerId: null,
    remaining: OTP_DURATION,
  };

  // ===== HAI VIEW NẰM CHUNG TRONG register.html =====
  // view "register": form đăng ký ban đầu
  // view "otp": form nhập mã OTP
  const views = {
    register: document.getElementById('view-register'),
    otp: document.getElementById('view-otp'),
  };

  // ----- Các phần tử DOM của form đăng ký -----
  const registerForm = document.getElementById('register-form');
  const registerPhoneInput = document.getElementById('register-phone');
  const registerPhoneError = document.getElementById('register-phone-error');
  const registerPasswordInput = document.getElementById('register-password');
  const registerPasswordError = document.getElementById('register-password-error');
  const registerConfirmInput = document.getElementById('register-confirm-password');
  const registerConfirmError = document.getElementById('register-confirm-password-error');
  const registerNotice = document.getElementById('register-notice');

  // ----- Các phần tử DOM của form OTP -----
  const otpPhoneDisplay = document.getElementById('otp-phone-display');
  const otpNotice = document.getElementById('otp-notice');
  const otpInputsWrap = document.getElementById('otp-inputs');
  const otpBoxes = Array.from(otpInputsWrap.querySelectorAll('.otp-box')); // Danh sách 6 ô nhập OTP
  const otpGroupError = document.getElementById('otp-group-error');
  const otpTimerWrap = document.getElementById('otp-timer-wrap');
  const otpTimerEl = document.getElementById('otp-timer');
  const otpResendBtn = document.getElementById('otp-resend-btn');
  const otpConfirmBtn = document.getElementById('otp-confirm-btn');
  const otpBackBtn = document.getElementById('otp-back');
  const otpForm = document.getElementById('otp-form');

  /**
   * Lấy tài khoản từ localStorage và gộp với tài khoản demo.
   * Lọc trùng số điện thoại để tài khoản demo không bị bản ghi trong localStorage ghi đè.
   */
  function getAccounts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [...DEMO_ACCOUNTS];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [...DEMO_ACCOUNTS];

      const savedAccounts = parsed.filter((account) => {
        return !DEMO_ACCOUNTS.some((demoAccount) => demoAccount.phone === account.phone);
      });

      return [...DEMO_ACCOUNTS, ...savedAccounts];
    } catch {
      // Dữ liệu lỗi/hỏng -> vẫn cho phép dùng tài khoản demo
      return [...DEMO_ACCOUNTS];
    }
  }

  // Tìm tài khoản theo số điện thoại, dùng để kiểm tra trùng khi đăng ký
  function findAccount(phone) {
    return getAccounts().find((account) => account.phone === phone) || null;
  }

  /**
   * Lưu tài khoản mới sau khi OTP xác thực đúng.
   * Phần này chỉ giả lập database cho web tĩnh bằng localStorage.
   */
  function saveAccount(phone, password) {
    const accounts = getAccounts();

    // Chỉ thêm nếu số điện thoại chưa tồn tại, tránh lưu trùng
    if (!accounts.some((account) => account.phone === phone)) {
      accounts.push({ phone, password });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    }
  }

  // Validate số điện thoại khi submit form đăng ký
  function validatePhone(rawValue) {
    const value = rawValue.trim();

    if (!value) return { valid: false, message: 'Vui lòng nhập số điện thoại.' };
    if (!/^\d+$/.test(value)) return { valid: false, message: 'Số điện thoại chỉ được chứa chữ số.' };
    if (value.length !== PHONE_LENGTH) {
      return { valid: false, message: `Số điện thoại phải gồm đúng ${PHONE_LENGTH} chữ số.` };
    }

    return { valid: true, value };
  }

  // Validate mật khẩu; trim để tránh trường hợp nhập toàn khoảng trắng
  // hoặc dư khoảng trắng ở đầu/cuối
  function validatePassword(rawValue) {
    const value = rawValue.trim();

    if (!value) return { valid: false, message: 'Vui lòng nhập mật khẩu.' };
    if (value.length < PASSWORD_MIN_LENGTH) {
      return { valid: false, message: `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.` };
    }

    return { valid: true, value };
  }

  // ===== CÁC HÀM HỖ TRỢ HIỂN THỊ LỖI / THÔNG BÁO =====

  // Hiển thị hoặc xóa lỗi cho một ô input cụ thể
  function setFieldError(input, errorEl, message) {
    input.classList.toggle('input-error', Boolean(message));
    errorEl.classList.toggle('show', Boolean(message));
    errorEl.textContent = message;
  }

  // Hiển thị thông báo chung (lỗi hoặc thành công) trên form
  function showNotice(el, message, type = 'error') {
    el.textContent = message;
    el.classList.toggle('success', type === 'success');
    el.classList.add('show');
    el.hidden = false;
  }

  // Ẩn thông báo chung, đưa về trạng thái ban đầu
  function hideNotice(el) {
    el.classList.remove('show', 'success');
    el.textContent = '';
    el.hidden = true;
  }

  // Chuyển đổi qua lại giữa view đăng ký và view OTP
  function showView(name) {
    Object.entries(views).forEach(([key, el]) => {
      const isTarget = key === name;
      el.hidden = !isTarget;
      el.classList.toggle('is-active', isTarget);
    });
  }

  // ===== LIVE VALIDATION (kiểm tra ngay khi người dùng đang gõ) =====

  // Live validation cho số điện thoại: chỉ báo lỗi khi có ký tự không phải số
  function updatePhoneLiveState() {
    const raw = registerPhoneInput.value;
    const isDigitsOnly = /^\d*$/.test(raw);

    if (!isDigitsOnly) {
      registerPhoneInput.classList.remove('input-success');
      setFieldError(registerPhoneInput, registerPhoneError, 'Số điện thoại chỉ được chứa chữ số.');
      return;
    }

    setFieldError(registerPhoneInput, registerPhoneError, '');
    // Đánh dấu input-success khi đã nhập đủ số ký tự yêu cầu
    registerPhoneInput.classList.toggle('input-success', raw.length === PHONE_LENGTH);
  }

  // Live validation cho mật khẩu: báo lỗi nếu đang nhập nhưng chưa đủ độ dài tối thiểu
  function updatePasswordLiveState() {
    const value = registerPasswordInput.value.trim();

    if (!value) {
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

  // ===== CÁC HÀM XỬ LÝ Ô NHẬP OTP =====

  // Reset toàn bộ ô OTP về trạng thái ban đầu (dùng khi chuyển view, gửi lại mã, v.v.)
  function clearOtpBoxes() {
    otpBoxes.forEach((box) => {
      box.value = '';
      box.classList.remove('filled', 'error');
    });

    otpGroupError.textContent = '';
    otpGroupError.classList.remove('show');
  }

  // Ghép giá trị 6 ô lại thành một chuỗi OTP hoàn chỉnh
  function getOtpValue() {
    return otpBoxes.map((box) => box.value).join('');
  }

  // Định dạng số giây thành mm:ss để hiển thị đếm ngược trên giao diện
  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  // Dừng timer cũ (nếu có) trước khi tạo timer mới, tránh chạy nhiều setInterval cùng lúc
  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  // Đếm ngược thời gian hiệu lực của OTP.
  // Khi hết hạn thì hiện nút "Gửi lại mã" và chặn xác thực OTP.
  function startTimer() {
    stopTimer();
    state.remaining = OTP_DURATION;
    otpTimerEl.textContent = formatTime(state.remaining);
    otpTimerWrap.style.display = 'inline';
    otpResendBtn.hidden = true;

    state.timerId = setInterval(() => {
      state.remaining -= 1;

      if (state.remaining <= 0) {
        // Hết thời gian: dừng đếm, ẩn đồng hồ, hiện nút gửi lại
        stopTimer();
        state.remaining = 0;
        otpTimerEl.textContent = formatTime(state.remaining);
        otpTimerWrap.style.display = 'none';
        otpResendBtn.hidden = false;
        showNotice(otpNotice, 'Mã OTP đã hết hiệu lực. Vui lòng gửi lại mã mới.');
        return;
      }

      otpTimerEl.textContent = formatTime(state.remaining);
    }, 1000);
  }

  // Sau khi form đăng ký hợp lệ, chuyển sang view OTP và bắt đầu đếm ngược
  function enterOtpView() {
    otpPhoneDisplay.textContent = state.phone;
    otpConfirmBtn.disabled = false;
    hideNotice(otpNotice);
    clearOtpBoxes();
    showView('otp');
    startTimer();
    otpBoxes[0].focus(); // Focus sẵn vào ô đầu tiên để người dùng gõ luôn
  }

  // ===== NÚT HIỆN/ẨN MẬT KHẨU (dùng chung cho cả password và confirm password) =====
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

  // Live validation khi người dùng gõ vào từng ô
  registerPhoneInput.addEventListener('input', updatePhoneLiveState);
  registerPasswordInput.addEventListener('input', updatePasswordLiveState);
  registerConfirmInput.addEventListener('input', () => {
    // Chỉ cần xóa lỗi cũ, việc so khớp mật khẩu sẽ kiểm tra lại khi submit
    setFieldError(registerConfirmInput, registerConfirmError, '');
  });

  /**
   * LUỒNG XỬ LÝ ĐĂNG KÝ:
   * 1. Validate số điện thoại, mật khẩu, xác nhận mật khẩu.
   * 2. Chặn đăng ký trùng số đã có trong localStorage hoặc tài khoản demo.
   * 3. Lưu tạm phone/password vào state và chuyển qua view OTP.
   */
  registerForm.addEventListener('submit', (event) => {
    // Chặn hành vi submit mặc định (load lại trang) để tự xử lý bằng JS
    event.preventDefault();
    hideNotice(registerNotice);

    // Bước 1a: Kiểm tra định dạng số điện thoại
    const phoneResult = validatePhone(registerPhoneInput.value);
    if (!phoneResult.valid) {
      setFieldError(registerPhoneInput, registerPhoneError, phoneResult.message);
      return;
    }
    setFieldError(registerPhoneInput, registerPhoneError, '');

    // Bước 2: Kiểm tra số điện thoại đã được đăng ký trước đó chưa
    if (findAccount(phoneResult.value)) {
      showNotice(registerNotice, 'Số điện thoại đã được đăng ký.');
      return;
    }

    // Bước 1b: Kiểm tra định dạng mật khẩu
    const passwordResult = validatePassword(registerPasswordInput.value);
    if (!passwordResult.valid) {
      setFieldError(registerPasswordInput, registerPasswordError, passwordResult.message);
      return;
    }
    setFieldError(registerPasswordInput, registerPasswordError, '');

    // Bước 1c: Kiểm tra mật khẩu xác nhận có khớp với mật khẩu đã nhập không
    if (registerConfirmInput.value.trim() !== passwordResult.value) {
      setFieldError(registerConfirmInput, registerConfirmError, 'Mật khẩu xác nhận không khớp.');
      return;
    }
    setFieldError(registerConfirmInput, registerConfirmError, '');

    // Bước 3: Mọi thứ hợp lệ -> lưu tạm vào state và chuyển sang bước nhập OTP
    state.phone = phoneResult.value;
    state.password = passwordResult.value;
    enterOtpView();
  });

  // Nút "Quay lại": hủy timer đang chạy và trở về view đăng ký
  otpBackBtn.addEventListener('click', () => {
    stopTimer();
    hideNotice(otpNotice);
    showView('register');
  });

  /**
   * ĐIỀU KHIỂN 6 Ô NHẬP OTP:
   * - Chỉ nhận ký tự số.
   * - Tự động chuyển focus sang ô tiếp theo khi nhập xong 1 ô.
   * - Nhấn Backspace ở ô rỗng sẽ quay về ô trước đó.
   * - Dán (paste) một chuỗi số sẽ tự động điền đầy đủ vào các ô.
   */
  otpBoxes.forEach((box, index) => {
    // Xử lý khi người dùng gõ vào từng ô
    box.addEventListener('input', () => {
      const digitsOnly = box.value.replace(/\D/g, ''); // Loại bỏ mọi ký tự không phải số
      box.value = digitsOnly.slice(-1); // Chỉ giữ lại ký tự số cuối cùng vừa gõ
      box.classList.toggle('filled', box.value !== '');
      box.classList.remove('error');
      otpGroupError.classList.remove('show');
      hideNotice(otpNotice);

      // Nếu ô hiện tại đã có giá trị và chưa phải ô cuối -> nhảy sang ô kế tiếp
      if (box.value && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }
    });

    // Xử lý phím Backspace để quay về ô trước khi ô hiện tại đang rỗng
    box.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !box.value && index > 0) {
        otpBoxes[index - 1].focus();
        otpBoxes[index - 1].value = '';
        otpBoxes[index - 1].classList.remove('filled');
      }
    });

    // Xử lý sự kiện dán (paste) toàn bộ mã OTP cùng lúc
    box.addEventListener('paste', (event) => {
      event.preventDefault(); // Chặn hành vi dán mặc định của trình duyệt

      const pasted = (event.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      if (!pasted) return;

      clearOtpBoxes();
      hideNotice(otpNotice);

      const digits = pasted.slice(0, OTP_LENGTH).split('');
      digits.forEach((digit, digitIndex) => {
        otpBoxes[digitIndex].value = digit;
        otpBoxes[digitIndex].classList.add('filled');
      });

      const nextIndex = Math.min(digits.length, OTP_LENGTH) - 1;
      otpBoxes[nextIndex].focus();
    });
  });

  /**
   * LUỒNG XÁC THỰC OTP:
   * 1. Chặn nếu OTP đã hết hạn.
   * 2. Chặn nếu chưa nhập đủ 6 số.
   * 3. So sánh với DEMO_OTP.
   * 4. Nếu đúng thì lưu tài khoản vào localStorage và quay về trang đăng nhập.
   */
  otpForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Chặn submit mặc định để tự xử lý xác thực bằng JS

    const value = getOtpValue();

    // Bước 1: Kiểm tra OTP còn hiệu lực hay không
    if (state.remaining <= 0) {
      showNotice(otpNotice, 'Mã OTP đã hết hiệu lực. Vui lòng gửi lại mã mới.');
      otpTimerWrap.style.display = 'none';
      otpResendBtn.hidden = false;
      otpBoxes.forEach((box) => box.classList.add('error'));
      otpBoxes[0].focus();
      return;
    }

    // Bước 2: Kiểm tra đã nhập đủ số lượng chữ số OTP chưa
    if (value.length < OTP_LENGTH) {
      showNotice(otpNotice, `Vui lòng nhập đầy đủ ${OTP_LENGTH} chữ số OTP.`);
      otpBoxes.forEach((box) => {
        if (!box.value) box.classList.add('error');
      });
      return;
    }

    // Bước 3: So sánh mã đã nhập với mã OTP demo
    if (value !== DEMO_OTP) {
      showNotice(otpNotice, 'Mã OTP không đúng. Vui lòng thử lại.');
      otpBoxes.forEach((box) => {
        box.classList.add('error');
        box.value = '';
        box.classList.remove('filled');
      });
      otpBoxes[0].focus();
      return;
    }

    // Bước 4: OTP đúng -> lưu tài khoản chính thức và chuyển hướng về trang đăng nhập
    hideNotice(otpNotice);
    stopTimer();
    saveAccount(state.phone, state.password);

    showNotice(otpNotice, 'Xác thực thành công! Vui lòng đăng nhập lại.', 'success');
    otpConfirmBtn.disabled = true;

    registerPhoneInput.value = '';
    registerPasswordInput.value = '';
    registerConfirmInput.value = '';
    clearOtpBoxes();

    // Trì hoãn 700ms để người dùng kịp thấy thông báo thành công trước khi chuyển trang
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 700);
  });

  // Giả lập chức năng gửi lại OTP: reset ô nhập, hiện thông báo và chạy lại timer từ đầu
  otpResendBtn.addEventListener('click', () => {
    hideNotice(otpNotice);
    clearOtpBoxes();
    showNotice(otpNotice, `Đã gửi lại mã OTP đến ${state.phone}.`, 'success');
    startTimer();
    otpBoxes[0].focus();
  });
})();