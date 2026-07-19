const heroSection = document.querySelector('.hero-section');
const slides = document.querySelectorAll('.hero-slide-item');
const btnLeft = document.querySelector('.btn-left');
const btnRight = document.querySelector('.btn-right');

// 2. Khởi tạo biến lưu trữ vị trí slide hiện tại (bắt đầu từ 0 - Black Panther)
let currentSlide = 0;
const totalSlides = slides.length; // Tổng số lượng slide (ở đây là 3)

// 3. Hàm kích hoạt lại hiệu ứng chữ rơi (Reset Animation)
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

// 4. Hàm điều khiển việc dịch chuyển slide
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

// 5. Lắng nghe sự kiện khi click vào nút RIGHT (Qua phải)
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