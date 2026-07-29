// Lê Vũ Đình Khiêm - b2404993
const heroSection = document.querySelector('.hero-section');
const slides = document.querySelectorAll('.hero-slide-item');
const btnLeft = document.querySelector('.btn-left');
const btnRight = document.querySelector('.btn-right');

// slide hiện tại (mặc định = 0)
let currentSlide = 0;
const totalSlides = slides.length; // tổng số slide

// hàm reset lại animation chữ rơi mỗi lần đổi slide
function resetAnimation(slideIndex) {
    // lấy mấy element có animation trong slide này
    const animatedElements = slides[slideIndex].querySelectorAll('.animate-slide-down');
    
    animatedElements.forEach((element) => {
        // gỡ class animation ra trước
        element.classList.remove('animate-slide-down');
        
        // trick trigger reflow để browser nhận biết vừa xóa class
        void element.offsetWidth;
        
        // add lại class để chạy lại animation từ đầu
        element.classList.add('animate-slide-down');
    });
}

// hàm chuyển slide
function updateSlider() {
    // dịch slider sang trái theo vị trí slide
    slides.forEach((slide) => {
        slide.style.transform = `translateX(-${currentSlide * 100}%)`;
        slide.style.transition = 'transform 0.5s ease-in-out';
    });

    // chạy lại animation chữ cho slide mới
    resetAnimation(currentSlide);
}

// bắt sự kiện click nút next
btnRight.addEventListener('click', () => {
    // hết slide thì quay về slide 0
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
    } else {
        currentSlide = 0; 
    }
    updateSlider();
});

// bắt sự kiện click nút prev
btnLeft.addEventListener('click', () => {
    // ở slide 0 mà bấm lùi thì nhảy xuống slide cuối
    if (currentSlide > 0) {
        currentSlide--;
    } else {
        currentSlide = totalSlides - 1;
    }
    updateSlider();
});

// xử lí nút bật và tắt menu trên mobile và tablet
//DOMContentLoaded dùng để thực thi chương trình khi toàn bộ html tải xong, không cần phải chờ hình ảnh,css hoặc irame --> liên quan tới cơ chế bất đồng bộ js
document.addEventListener("DOMContentLoaded", function () {
    const menuBtn = document.querySelector('.sub-nav__menu');
    const navHeader = document.querySelector('.nav_header');
    const menuIcon = document.querySelector('.sub-nav__menu i'); // lấy ra icon bên trong

    if (menuBtn && navHeader && menuIcon) {
        menuBtn.addEventListener('click', function () {
            // toggle đóng vài trò như 1 công tắt để xem tất cả các danh sách navHeader đã có icon menu chưa
            // nếu không có thì thêm vô và ngược lại
            navHeader.classList.toggle('active');

            // khí mà navHeader có active rồi thì xóa icon menu đi và thêm icon dấu X 
            if (navHeader.classList.contains('active')) {
                menuIcon.classList.remove('bx-menu');
                menuIcon.classList.add('bx-x'); 
            } else { // ngược lại 
                menuIcon.classList.remove('bx-x');
                menuIcon.classList.add('bx-menu'); 
            }
        });
    }
});

//kiểm tra trạng thái đăng nhập của người dùng
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

    // đổi nút Sign in thành Log out nếu đã login
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

        // click log out thì xóa data trong storage rồi reload lại trang
        navLoginLink.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('flix_is_logged_in');
            localStorage.removeItem('flix_user_phone');
            alert('Đã đăng xuất tài khoản!');
            window.location.reload();
        });
    }
});

// xử lí khi người dùng bấm vào login nhập đúng mk 
function handleLoginSuccess() {
    // lưu trang thái login vào storage 
    localStorage.setItem('flix_is_logged_in', 'true');
    alert('Đăng nhập thành công!');
    window.location.href = 'store_page/store.html'; // đăng nhập đc thì chuyển sang trang giỏ hàng
}