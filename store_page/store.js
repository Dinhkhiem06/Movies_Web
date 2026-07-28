// Nguyễn Thiên Tân - b24048879
// Đồ án Môn Học - Web bán vé / phim
console.log("js loaded - web chay ngon lanh");

// ==========================================
// 1. POPUP GIỎ HÀNG MODAL & DỮ LIỆU
// ==========================================
let modalCart = [];

// Khôi phục dữ liệu từ localStorage (dùng split chuỗi, không xài JSON)
try {
    const savedCart = localStorage.getItem("modalCart");
    if (savedCart) {
        const items = savedCart.split(";");
        items.forEach(function (itemStr) {
            if (itemStr && itemStr.indexOf("|") !== -1) {
                const parts = itemStr.split("|");
                
                let imagePath = parts[3];
                if (imagePath === "null" || !imagePath) {
                    imagePath = null;
                }

                let parsedQty = Number(parts[4]);
                if (isNaN(parsedQty) || parsedQty <= 0) {
                    parsedQty = 1;
                }

                if (parts[0]) {
                    modalCart.push({
                        id: parts[0],
                        title: parts[1] || "Phim",
                        price: parts[2] || "0",
                        img: imagePath,
                        quantity: parsedQty
                    });
                }
            }
        });
    }
} catch (error) {
    console.error("Lỗi đọc localStorage rồi, xóa bộ nhớ tạm để tránh đơ:", error);
    localStorage.removeItem("modalCart");
    modalCart = [];
}

// Lưu dữ liệu giỏ hàng vào localStorage dưới dạng chuỗi (không xài JSON)
function saveCartToStorage() {
    try {
        const strList = modalCart.map(function (item) {
            let imgSrc = "null";
            if (item.img) {
                imgSrc = item.img;
            }

            let currentQty = Number(item.quantity);
            if (isNaN(currentQty)) {
                currentQty = 1;
            }

            // Định dạng chuỗi: id|title|price|img|quantity
            return item.id + "|" + item.title + "|" + item.price + "|" + imgSrc + "|" + currentQty;
        });

        localStorage.setItem("modalCart", strList.join(";"));
    } catch (e) {
        console.error("Lỗi lưu localStorage:", e);
    }
}

// DOM các element chính
const cartIconBtn = document.getElementById("cart-icon-btn");
const cartBadge = document.getElementById("cart-count");
const cartModal = document.getElementById("cart-modal");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartModalBody = document.getElementById("cart-modal-body");

// Lấy danh sách các nút "+" thêm phim
const allAddButtons = document.querySelectorAll(".add-btn");

// Bắt sự kiện bấm nút "+" trên từng thẻ phim
allAddButtons.forEach(function (buttonItem) {
    buttonItem.addEventListener("click", function (event) {
        event.stopPropagation();

        const itemCard = buttonItem.closest(".cart_item");
        if (!itemCard) return;

        const movieId = itemCard.getAttribute("id");
        if (!movieId) return;
        
        let movieTitle = "Phim";
        const titleHeader = itemCard.querySelector("h2");
        if (titleHeader) {
            movieTitle = titleHeader.textContent.trim();
        }

        let moviePrice = "0";
        if (itemCard.dataset.price) {
            moviePrice = itemCard.dataset.price;
        }

        let movieCode = movieId.toUpperCase();

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
            let qty = Number(existingItem.quantity) + 1;
            if (isNaN(qty)) qty = 1;
            existingItem.quantity = qty;
        } else {
            modalCart.push({
                id: movieId,
                title: movieTitle,
                price: moviePrice,
                img: imageSource,
                quantity: 1
            });
        }

        saveCartToStorage();
        updateModalCartUI();
        updatePrice();
        
        // Hiện alert theo yêu cầu
        alert('Đã thêm sản phẩm có mã [' + movieCode + '] vào giỏ hàng!');
        successMessage('Đã thêm "' + movieTitle + '" vào giỏ hàng!');
    });
});

// Hàm render lại Popup giỏ hàng (dùng DOM node hoàn toàn, KHÔNG DÙNG innerHTML)
function updateModalCartUI() {
    // Tính tổng số lượng hiển thị trên badge
    const totalItems = modalCart.reduce(function (sum, item) {
        let itemQty = Number(item.quantity);
        if (isNaN(itemQty)) itemQty = 0;
        return sum + itemQty;
    }, 0);

    if (cartBadge) {
        cartBadge.textContent = totalItems;
    }

    if (!cartModalBody) return;

    // Xóa sạch nội dung cũ bằng vòng lặp removeChild (tránh xài innerHTML = "")
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

    // Render danh sách sản phẩm bằng DOM node
    modalCart.forEach(function (item) {
        const itemRow = document.createElement("div");
        itemRow.className = "modal-cart-item";

        const leftBox = document.createElement("div");
        leftBox.className = "modal-item-left";

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

        const infoBox = document.createElement("div");

        const titleElement = document.createElement("h4");
        titleElement.className = "modal-item-title";
        titleElement.textContent = item.title || "Phim";

        const codeElement = document.createElement("p");
        codeElement.className = "modal-item-code";
        codeElement.textContent = "Mã: ";
        
        const codeStrong = document.createElement("strong");
        codeStrong.textContent = item.id ? item.id.toUpperCase() : "";
        codeElement.appendChild(codeStrong);

        let displayPrice = item.price || "0";
        let displayQuantity = Number(item.quantity) || 0;

        const priceElement = document.createElement("p");
        priceElement.className = "modal-item-price";
        priceElement.textContent = "$" + displayPrice + " x " + displayQuantity;

        infoBox.appendChild(titleElement);
        infoBox.appendChild(codeElement);
        infoBox.appendChild(priceElement);
        leftBox.appendChild(infoBox);

        // Nút xóa từng item
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

    // Tạo thanh nút bấm Footer độc lập ở dưới popup
    const footerBox = document.createElement("div");
    footerBox.className = "cart-modal-footer";

    const clearAllBtn = document.createElement("button");
    clearAllBtn.className = "modal-clear-btn";
    clearAllBtn.textContent = "Xóa tất cả";
    clearAllBtn.addEventListener("click", function () {
        clearAllModalCart();
    });

    const modalCheckoutBtn = document.createElement("button");
    modalCheckoutBtn.className = "modal-checkout-btn";
    modalCheckoutBtn.textContent = "Thanh toán tất cả";
    modalCheckoutBtn.addEventListener("click", function () {
        handleCheckoutModal();
    });

    footerBox.appendChild(clearAllBtn);
    footerBox.appendChild(modalCheckoutBtn);
    cartModalBody.appendChild(footerBox);
}

// Xóa 1 item
function removeFromModalCart(id) {
    modalCart = modalCart.filter(function (item) {
        return item.id !== id;
    });
    saveCartToStorage();
    updateModalCartUI();
    updatePrice();
}

// Xóa tất cả item
function clearAllModalCart() {
    modalCart = [];
    saveCartToStorage();
    updateModalCartUI();
    updatePrice();
    successMessage("Đã xóa toàn bộ sản phẩm trong giỏ hàng!");
}

// Xử lý thanh toán từ Modal
function handleCheckoutModal() {
    if (modalCart.length === 0) {
        failureMessage("Giỏ hàng đang trống!");
        return;
    }
    
    if (cartModal) {
        cartModal.classList.remove("active");
    }

    successMessage("Thanh toán thành công. Cảm ơn bạn đã mua hàng!");
    
    modalCart = [];
    saveCartToStorage();
    updateModalCartUI();
    updatePrice();
}

// Bắt sự kiện Mở / Đóng Popup
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
// 2. TÍNH TỔNG TIỀN SUBTOTAL & MÃ GIẢM GIÁ
// ==========================================
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

// Hàm tính Subtotal tự động theo mảng giỏ hàng
function updatePrice() {
    let subtotal = 0;

    modalCart.forEach(function (item) {
        let itemPrice = Number(item.price);
        let itemQty = Number(item.quantity);

        if (isNaN(itemPrice)) itemPrice = 0;
        if (isNaN(itemQty)) itemQty = 0;

        subtotal = subtotal + (itemPrice * itemQty);
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

// Khởi chạy giao diện khi load trang
updateModalCartUI();
updatePrice();

// Chặn sự kiện click link chi tiết
const detailLinks = document.querySelectorAll(".detail-link");
detailLinks.forEach(function (linkItem) {
    linkItem.addEventListener("click", function (event) {
        event.stopPropagation();
    });
});

// Nút áp dụng promo code
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

// Nút Checkout ngoài màn hình
if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
        if (modalCart.length === 0) {
            failureMessage("Please add at least one movie to your cart.");
            return;
        }

        handleCheckoutModal();
    });
}

// Menu Mobile Responsive
document.addEventListener("DOMContentLoaded", function () {
    const menuBtn = document.querySelector('.sub-nav__menu');
    const navHeader = document.querySelector('.nav_header');

    if (menuBtn && navHeader) {
        menuBtn.addEventListener('click', function () {
            navHeader.classList.toggle('active');
        });
    }
});