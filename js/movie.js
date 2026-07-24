// Lê Vũ Đình Khiêm - b2404993
const heroSection = document.querySelector('.hero-section');
const slides = document.querySelectorAll('.hero-slide-item');
const btnLeft = document.querySelector('.btn-left');
const btnRight = document.querySelector('.btn-right');

// Khởi tạo biến lưu trữ vị trí slide hiện tại (bắt đầu từ 0 - Black Panther)
let currentSlide = 0;
const totalSlides = slides.length; // Tổng số lượng slide (ở đây là 3)

// Hàm kích hoạt lại hiệu ứng chữ rơi (Reset Animation)
function resetAnimation(slideIndex) {
    // Tìm tất cả các phần tử có chứa hiệu ứng hoạt họa trong slide hiện tại
    const animatedElements = slides[slideIndex].querySelectorAll('.animate-slide-down');
    
    animatedElements.forEach((element) => {
        // Tạm thời gỡ bỏ class hiệu ứng
        element.classList.remove('animate-slide-down');
        
        // Mẹo nhỏ (Trigger Reflow): Ép trình duyệt tính toán lại layout để nhận biết class đã bị xóa
        void element.offsetWidth;
        
        // Thêm lại class để kích hoạt hiệu ứng chạy lại từ đầu
        element.classList.add('animate-slide-down');
    });
}

//Hàm điều khiển việc dịch chuyển slide
function updateSlider() {
    // Di chuyển các slide sang trái bằng cách thay đổi thuộc tính transform của từng slide item
    // Ví dụ: slide 0 dịch 0%, slide 1 dịch -100%, slide 2 dịch -200%
    slides.forEach((slide) => {
        slide.style.transform = `translateX(-${currentSlide * 100}%)`;
        slide.style.transition = 'transform 0.5s ease-in-out'; // Tạo độ mượt khi trượt ảnh
    });

    // Sau khi trượt sang ảnh mới, gọi hàm chạy lại hiệu ứng chữ rơi cho slide đó
    resetAnimation(currentSlide);
}

//Lắng nghe sự kiện khi click vào nút RIGHT (Qua phải)
btnRight.addEventListener('click', () => {
    // Tăng vị trí slide lên 1. Nếu đang ở slide cuối cùng thì quay về slide đầu tiên (0)
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
    } else {
        currentSlide = 0; 
    }
    updateSlider(); // Cập nhật lại giao diện slider
});

// 6. Lắng nghe sự kiện khi click vào nút LEFT (Qua trái)
btnLeft.addEventListener('click', () => {
    // Giảm vị trí slide xuống 1. Nếu đang ở slide đầu tiên thì nhảy sang slide cuối cùng
    if (currentSlide > 0) {
        currentSlide--;
    } else {
        currentSlide = totalSlides - 1;
    }
    updateSlider(); // Cập nhật lại giao diện slider
});

// đợi giao diện HTML tải xong
document.addEventListener("DOMContentLoaded", function () {
    const menuBtn = document.querySelector('.sub-nav__menu');
    const navHeader = document.querySelector('.nav_header');

    // lấy ra tất cả các danh sách có tên là navheader,toggle có vai trò như công tắc kiểm tra active có đc thêm
    // vào navHeader hay ko nếu ko có thì thêm và ngc lại
    menuBtn.addEventListener('click', function () {
        navHeader.classList.toggle('active');
    });
});

//kiểm tra trạng thái đăng nhập của người dùng
// bắt event cây dom được tải xong 
document.addEventListener('DOMContentLoaded', function () {
    const requireLoginElements = document.querySelectorAll('.js-check-login');
    requireLoginElements.forEach(function (element) {
        element.addEventListener('click', function (event) {
            // kiểm tra trạng thái login của bộ nhớ browser bằng localstorage coi đã login chưa
            const isLoggedIn = localStorage.getItem('flix_is_logged_in') === 'true';
            //nếu chưa đăng nhập thì 
            if (!isLoggedIn) {
                // chặn quyền truy cập trang store của thẻ a
                event.preventDefault();
                event.stopPropagation();
                alert('Vui lòng đăng ký hoặc đăng nhập tài khoản để tiếp tục!');
                //chuyển sang trang đăng nhập
                window.location.href = 'login_page/login/login.html'; 
            }
        });
    });

    // Thay đổi nút Sign in thành Logout thuần DOM khi đã đăng nhập
    const isLoggedIn = localStorage.getItem('flix_is_logged_in') === 'true';
    const navLoginLink = document.querySelector('.nav_menu_btn[href*="login"]');
    
    if (navLoginLink && isLoggedIn) {
        let spanText = navLoginLink.querySelector('span');
        if (spanText) {
            while (spanText.firstChild) {
                spanText.removeChild(spanText.firstChild);
            }
            const logoutText = document.createTextNode('LOG OUT');
            spanText.appendChild(logoutText);
        }

        navLoginLink.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('flix_is_logged_in');
            localStorage.removeItem('flix_user_phone');
            alert('Đã đăng xuất tài khoản!');
            window.location.reload();
        });
    }
});

// Đoạn code khi người dùng bấm nút Login và nhập đúng tài khoản/mật khẩu:
function handleLoginSuccess() {
    // 1. Dòng quan trọng nhất: Lưu trạng thái đăng nhập
    localStorage.setItem('flix_is_logged_in', 'true');

    // 2. Thông báo hoặc chuyển hướng
    alert('Đăng nhập thành công!');
    window.location.href = 'store_page/store.html'; // Hoặc đường dẫn về trang chủ/store của bạn
}