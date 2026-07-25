console.log("JS Loaded");

// ==========================================
// 1. QUẢN LÝ POPUP GIỎ HÀNG MODAL (THUẦN DOM)
// ==========================================
let modalCart = [];

// Các phần tử DOM chính của trang web
const cartIconBtn = document.getElementById("cart-icon-btn");
const cartBadge = document.getElementById("cart-count");
const cartModal = document.getElementById("cart-modal");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartModalBody = document.getElementById("cart-modal-body");

// Tìm tất cả các nút Thêm "+" vào giỏ hàng
const allAddButtons = document.querySelectorAll(".add-btn");

// Lắng nghe sự kiện bấm nút "+" trên từng phim
allAddButtons.forEach(function (buttonItem) {
    buttonItem.addEventListener("click", function (event) {
        // Ngăn sự kiện click lan ra thẻ cha (.cart_item)
        event.stopPropagation();

        const itemCard = buttonItem.closest(".cart_item");
        if (!itemCard) {
            return;
        }

        // Lấy thông tin phim từ thuộc tính và DOM
        const movieId = itemCard.getAttribute("id");
        
        let movieTitle = "Phim";
        const titleHeader = itemCard.querySelector("h2");
        if (titleHeader) {
            movieTitle = titleHeader.textContent;
        }

        let moviePrice = "0";
        if (itemCard.dataset.price) {
            moviePrice = itemCard.dataset.price;
        }
        
        // Lấy mã phim chuẩn từ id
        let movieCode = "Không xác định";
        if (movieId) {
            movieCode = movieId.toUpperCase();
        }

        // Lấy đường dẫn ảnh phim
        const imageElement = itemCard.querySelector(".movie_image img");
        let imageSource = null;
        if (imageElement) {
            imageSource = imageElement.getAttribute("src");
        }

        // Kiểm tra xem phim đã có trong giỏ hàng chưa
        const existingItem = modalCart.find(function (item) {
            return item.id === movieId;
        });

        if (existingItem) {
            existingItem.quantity = existingItem.quantity + 1;
        } else {
            modalCart.push({
                id: movieId,
                title: movieTitle,
                price: moviePrice,
                img: imageSource,
                quantity: 1
            });
        }

        // Cập nhật giao diện giỏ hàng Modal bằng DOM
        updateModalCartUI();
        
        // Thông báo
        successMessage('Đã thêm "' + movieTitle + '" vào giỏ hàng!');
        alert('Đã thêm sản phẩm có mã [' + movieCode + '] vào giỏ hàng!');
    });
});

// Hàm vẽ lại danh sách phim bằng DOM
function updateModalCartUI() {
    // Tính tổng số lượng phim trong giỏ
    const totalItems = modalCart.reduce(function (sum, item) {
        return sum + item.quantity;
    }, 0);

    if (cartBadge) {
        cartBadge.textContent = totalItems;
    }

    if (!cartModalBody) {
        return;
    }

    // Xóa sạch các thẻ con cũ trong modal body bằng DOM method (không sài innerHTML)
    while (cartModalBody.firstChild) {
        cartModalBody.removeChild(cartModalBody.firstChild);
    }

    // Nếu giỏ hàng trống
    if (modalCart.length === 0) {
        const emptyMessageElement = document.createElement("p");
        emptyMessageElement.className = "modal-empty-msg";
        emptyMessageElement.textContent = "Chưa có phim nào trong giỏ hàng.";
        cartModalBody.appendChild(emptyMessageElement);
        return;
    }

    // Tạo lại các element cho từng item bằng DOM
    modalCart.forEach(function (item) {
        const itemRow = document.createElement("div");
        itemRow.className = "modal-cart-item";

        const leftBox = document.createElement("div");
        leftBox.className = "modal-item-left";

        // Thêm hình ảnh hoặc icon VIP
        if (item.img) {
            const imageNode = document.createElement("img");
            imageNode.src = item.img;
            imageNode.className = "modal-item-img";
            leftBox.appendChild(imageNode);
        } else {
            const vipBox = document.createElement("div");
            vipBox.className = "modal-item-vip";

            const crownIcon = document.createElement("i");
            crownIcon.className = "fa-solid fa-crown";
            vipBox.appendChild(crownIcon);
            leftBox.appendChild(vipBox);
        }

        // Khối thông tin phim
        const infoBox = document.createElement("div");

        const titleElement = document.createElement("h4");
        titleElement.className = "modal-item-title";
        titleElement.textContent = item.title;

        const codeElement = document.createElement("p");
        codeElement.className = "modal-item-code";
        codeElement.textContent = "Mã: ";
        
        const codeStrong = document.createElement("strong");
        if (item.id) {
            codeStrong.textContent = item.id.toUpperCase();
        } else {
            codeStrong.textContent = "";
        }
        codeElement.appendChild(codeStrong);

        const priceElement = document.createElement("p");
        priceElement.className = "modal-item-price";
        priceElement.textContent = "$" + item.price + " x " + item.quantity;

        infoBox.appendChild(titleElement);
        infoBox.appendChild(codeElement);
        infoBox.appendChild(priceElement);
        leftBox.appendChild(infoBox);

        // Nút Xóa item trong Modal
        const deleteButton = document.createElement("button");
        deleteButton.className = "modal-delete-btn";

        const trashIcon = document.createElement("i");
        trashIcon.className = "fa-regular fa-trash-can";
        deleteButton.appendChild(trashIcon);

        deleteButton.addEventListener("click", function () {
            removeFromModalCart(item.id);
        });

        itemRow.appendChild(leftBox);
        itemRow.appendChild(deleteButton);
        cartModalBody.appendChild(itemRow);
    });
}

// Hàm xóa item khỏi giỏ
function removeFromModalCart(id) {
    modalCart = modalCart.filter(function (item) {
        return item.id !== id;
    });
    updateModalCartUI();
}

// Bật / Tắt Modal giỏ hàng
if (cartIconBtn) {
    cartIconBtn.addEventListener("click", function () {
        if (cartModal) {
            cartModal.classList.add("active");
        }
    });
}

if (closeCartBtn) {
    closeCartBtn.addEventListener("click", function () {
        if (cartModal) {
            cartModal.classList.remove("active");
        }
    });
}

window.addEventListener("click", function (event) {
    if (event.target === cartModal) {
        cartModal.classList.remove("active");
    }
});


// ==========================================
// 2. LOGIC TÍNH TIỀN & MÃ GIẢM GIÁ
// ==========================================
const cartItems = document.querySelectorAll(".cart_item");
const subtotalElement = document.getElementById("subtotal");
const discountElement = document.getElementById("discount");
const totalElement = document.getElementById("total");

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

    const selectedItems = document.querySelectorAll(".cart_item.selected");
    selectedItems.forEach(function (item) {
        subtotal = subtotal + Number(item.dataset.price);
    });

    let total = subtotal;

    if (promoApplied) {
        discount = subtotal * 0.05;
        total = subtotal - discount;
    } else {
        discount = 0;
    }

    if (subtotalElement) {
        subtotalElement.textContent = "$" + subtotal.toFixed(2);
    }
    if (discountElement) {
        discountElement.textContent = "-$" + discount.toFixed(2);
    }
    if (totalElement) {
        totalElement.textContent = "$" + total.toFixed(2);
    }
}

// Chọn card ngoài danh sách
cartItems.forEach(function (item) {
    item.addEventListener("click", function () {
        item.classList.toggle("selected");
        updatePrice();
    });
});

// Ngăn nút DETAIL kích hoạt sự kiện chọn thẻ
const detailLinks = document.querySelectorAll(".detail-link");
detailLinks.forEach(function (linkItem) {
    linkItem.addEventListener("click", function (event) {
        event.stopPropagation();
    });
});

// Áp dụng mã giảm giá Promo
if (applyBtn) {
    applyBtn.addEventListener("click", function () {
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

// Thanh toán Checkout
if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
        const selectedCount = document.querySelectorAll(".cart_item.selected").length;
        if (selectedCount === 0) {
            failureMessage("Please select at least one movie.");
            return;
        }

        successMessage("Checkout successful. Thank you for choosing Flix!");
    });
}

// Responsive Nav Menu
document.addEventListener("DOMContentLoaded", function () {
    const menuBtn = document.querySelector('.sub-nav__menu');
    const navHeader = document.querySelector('.nav_header');

    if (menuBtn && navHeader) {
        menuBtn.addEventListener('click', function () {
            navHeader.classList.toggle('active');
        });
    }
});