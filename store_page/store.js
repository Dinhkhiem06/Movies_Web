console.log("JS Loaded");

// ==========================================
// 1. QUẢN LÝ POPUP GIỎ HÀNG MODAL
// ==========================================
let modalCart = [];

// DOM Elements cho Giỏ Hàng Modal
const cartIconBtn = document.getElementById("cart-icon-btn");
const cartBadge = document.getElementById("cart-count");
const cartModal = document.getElementById("cart-modal");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartModalBody = document.getElementById("cart-modal-body");

// Xử lý khi bấm nút "+" để thêm phim vào Giỏ hàng
document.querySelectorAll(".add-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
        // Ngăn sự kiện click lan ra thẻ cha (.cart_item)
        e.stopPropagation();

        const itemCard = btn.closest(".cart_item");
        if (!itemCard) return;

        // Lấy thông tin phim từ HTML
        const movieId = itemCard.getAttribute("id");
        const movieTitle = itemCard.querySelector("h2") ? itemCard.querySelector("h2").textContent : "Phim";
        const moviePrice = itemCard.dataset.price || "0";
        
        // Lấy mã phim chuẩn từ thuộc tính id hoặc văn bản mã phim
        const movieCode = movieId ? movieId.toUpperCase() : "Không xác định";

        // Lấy ảnh phim hoặc icon VIP
        const imgEl = itemCard.querySelector(".movie_image img");
        const imgSrc = imgEl ? imgEl.getAttribute("src") : null;

        // Kiểm tra phim đã có trong giỏ hàng chưa
        const existingItem = modalCart.find((item) => item.id === movieId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            modalCart.push({
                id: movieId,
                title: movieTitle,
                price: moviePrice,
                img: imgSrc,
                quantity: 1
            });
        }

        // Cập nhật giao diện Popup & Badge đếm số
        updateModalCartUI();
        
        // Cập nhật thông báo dưới giao diện
        successMessage(`Đã thêm "${movieTitle}" vào giỏ hàng!`);

        // BẬT BẢNG ALERT THÔNG BÁO MÃ PHIM
        alert(`Đã thêm sản phẩm có mã [${movieCode}] vào giỏ hàng!`);
    });
});

// Hàm vẽ lại danh sách phim bằng DOM Node + Gắn Class CSS
function updateModalCartUI() {
    // Cập nhật số trên Badge đỏ
    const totalItems = modalCart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartBadge) {
        cartBadge.textContent = totalItems;
    }

    if (!cartModalBody) return;

    // Xóa sạch DOM cũ không dùng innerHTML
    while (cartModalBody.firstChild) {
        cartModalBody.removeChild(cartModalBody.firstChild);
    }

    // Nếu giỏ hàng trống
    if (modalCart.length === 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.className = "modal-empty-msg";
        emptyMsg.textContent = "Chưa có phim nào trong giỏ hàng.";
        cartModalBody.appendChild(emptyMsg);
        return;
    }

    // Duyệt danh sách và tạo DOM Elements
    modalCart.forEach((item) => {
        // Thẻ bao item row
        const itemRow = document.createElement("div");
        itemRow.className = "modal-cart-item";

        // Khối bên trái (Ảnh + Chữ)
        const leftBox = document.createElement("div");
        leftBox.className = "modal-item-left";

        // Hiển thị ảnh hoặc Icon VIP
        if (item.img) {
            const imgNode = document.createElement("img");
            imgNode.src = item.img;
            imgNode.className = "modal-item-img";
            leftBox.appendChild(imgNode);
        } else {
            const vipBox = document.createElement("div");
            vipBox.className = "modal-item-vip";

            const crownIcon = document.createElement("i");
            crownIcon.className = "fa-solid fa-crown";
            vipBox.appendChild(crownIcon);
            leftBox.appendChild(vipBox);
        }

        // Khối thông tin văn bản
        const infoBox = document.createElement("div");

        const titleEl = document.createElement("h4");
        titleEl.className = "modal-item-title";
        titleEl.textContent = item.title;

        const codeEl = document.createElement("p");
        codeEl.className = "modal-item-code";
        codeEl.textContent = "Mã: ";
        
        const codeStrong = document.createElement("strong");
        codeStrong.textContent = item.id ? item.id.toUpperCase() : "";
        codeEl.appendChild(codeStrong);

        const priceEl = document.createElement("p");
        priceEl.className = "modal-item-price";
        priceEl.textContent = `$${item.price} x ${item.quantity}`;

        infoBox.appendChild(titleEl);
        infoBox.appendChild(codeEl);
        infoBox.appendChild(priceEl);
        leftBox.appendChild(infoBox);

        // Nút Xóa
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "modal-delete-btn";

        const trashIcon = document.createElement("i");
        trashIcon.className = "fa-regular fa-trash-can";
        deleteBtn.appendChild(trashIcon);

        // Bắt sự kiện xóa
        deleteBtn.addEventListener("click", () => {
            removeFromModalCart(item.id);
        });

        // Ghép vào thẻ cha
        itemRow.appendChild(leftBox);
        itemRow.appendChild(deleteBtn);
        cartModalBody.appendChild(itemRow);
    });
}

// Xoá phim khỏi Popup
function removeFromModalCart(id) {
    modalCart = modalCart.filter((item) => item.id !== id);
    updateModalCartUI();
}

// Bật / Tắt Modal Popup
if (cartIconBtn) {
    cartIconBtn.addEventListener("click", () => {
        if (cartModal) cartModal.classList.add("active");
    });
}

if (closeCartBtn) {
    closeCartBtn.addEventListener("click", () => {
        if (cartModal) cartModal.classList.remove("active");
    });
}

window.addEventListener("click", (e) => {
    if (e.target === cartModal) {
        cartModal.classList.remove("active");
    }
});


// ==========================================
// 2. LOGIC TÍNH TIỀN & MÃ GIẢM GIÁ
// ==========================================
const cartItems = document.querySelectorAll(".cart_item");
const subtotalEl = document.getElementById("subtotal");
const discountEl = document.getElementById("discount");
const totalEl = document.getElementById("total");

const promoInput = document.getElementById("promoInput");
const applyBtn = document.getElementById("applyBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const message = document.getElementById("message");

let discount = 0;
let promoApplied = false;

function successMessage(text) {
    if (message) {
        message.style.color = "#1f83ed";
        message.textContent = text;
    }
}

function failureMessage(text) {
    if (message) {
        message.style.color = "#ff4444";
        message.textContent = text;
    }
}

function updatePrice() {
    let subtotal = 0;

    document.querySelectorAll(".cart_item.selected").forEach((item) => {
        subtotal += Number(item.dataset.price);
    });

    let total = subtotal;

    if (promoApplied) {
        discount = subtotal * 0.05;
        total = subtotal - discount;
    } else {
        discount = 0;
    }

    if (subtotalEl) subtotalEl.textContent = "$" + subtotal.toFixed(2);
    if (discountEl) discountEl.textContent = "-$" + discount.toFixed(2);
    if (totalEl) totalEl.textContent = "$" + total.toFixed(2);
}

// Chọn card ngoài giao diện chính
cartItems.forEach((item) => {
    item.addEventListener("click", () => {
        item.classList.toggle("selected");
        updatePrice();
    });
});

// Xóa phim ngoài danh sách chính
document.querySelectorAll(".price_actions .remove-btn").forEach((icon) => {
    icon.addEventListener("click", (e) => {
        e.stopPropagation();

        const itemCard = icon.closest(".cart_item");
        if (itemCard) {
            const movieId = itemCard.getAttribute("id");
            itemCard.remove();
            removeFromModalCart(movieId);
            successMessage("Movie removed.");
            updatePrice();
        }
    });
});

// Áp dụng Promo
if (applyBtn) {
    applyBtn.addEventListener("click", () => {
        if (promoApplied) {
            failureMessage("Promo code has already been used.");
            return;
        }

        if (promoInput && promoInput.value.trim().toUpperCase() === "NMLTWEB") {
            promoApplied = true;
            successMessage("Promo code applied successfully.");
        } else {
            failureMessage("Invalid promo code.");
        }

        updatePrice();
    });
}

// Checkout
if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        if (document.querySelectorAll(".cart_item.selected").length === 0) {
            failureMessage("Please select at least one movie.");
            return;
        }

        successMessage("Checkout successful. Thank you for choosing Flix!");
    });
}

//  xử lí nút menu mobile và tablet 
document.addEventListener("DOMContentLoaded", function () {
    const menuBtn = document.querySelector('.sub-nav__menu');
    const navHeader = document.querySelector('.nav_header');

    if (menuBtn && navHeader) {
        menuBtn.addEventListener('click', function () {
            navHeader.classList.toggle('active');
        });
    }
});