//  Nguyễn Thiên Tân - b24048879
console.log("js loaded");

// ==========================================
// 1. popup giỏ hàng modal
// ==========================================
let modalCart = [];

// dom các element chính
const cartIconBtn = document.getElementById("cart-icon-btn");
const cartBadge = document.getElementById("cart-count");
const cartModal = document.getElementById("cart-modal");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartModalBody = document.getElementById("cart-modal-body");

// nút thêm "+" vào giỏ
const allAddButtons = document.querySelectorAll(".add-btn");

// bắt sự kiện bấm nút "+" trên từng phim
allAddButtons.forEach(function (buttonItem) {
    buttonItem.addEventListener("click", function (event) {
        // ngăn sự kiện click lan ra thẻ cha (.cart_item)
        event.stopPropagation();

        const itemCard = buttonItem.closest(".cart_item");
        if (!itemCard) {
            return;
        }

        // lấy data phim từ dom
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
        
        // lấy mã phim chuẩn từ id
        let movieCode = "không xác định";
        if (movieId) {
            movieCode = movieId.toUpperCase();
        }

        // lấy đường dẫn ảnh phim
        const imageElement = itemCard.querySelector(".movie_image img");
        let imageSource = null;
        if (imageElement) {
            imageSource = imageElement.getAttribute("src");
        }

        // check xem phim đã có trong giỏ chưa
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

        // render lại modal giỏ hàng
        updateModalCartUI();
        
        // thông báo
        successMessage('Đã thêm "' + movieTitle + '" vào giỏ hàng!');
        alert('Đã thêm sản phẩm có mã [' + movieCode + '] vào giỏ hàng!');
    });
});

// hàm render lại danh sách phim bằng dom
function updateModalCartUI() {
    // tính tổng số lượng
    const totalItems = modalCart.reduce(function (sum, item) {
        return sum + item.quantity;
    }, 0);

    if (cartBadge) {
        cartBadge.textContent = totalItems;
    }

    if (!cartModalBody) {
        return;
    }

    // clear các thẻ con cũ trong modal body
    while (cartModalBody.firstChild) {
        cartModalBody.removeChild(cartModalBody.firstChild);
    }

    // nếu giỏ hàng trống
    if (modalCart.length === 0) {
        const emptyMessageElement = document.createElement("p");
        emptyMessageElement.className = "modal-empty-msg";
        emptyMessageElement.textContent = "Chưa có phim nào trong giỏ hàng.";
        cartModalBody.appendChild(emptyMessageElement);
        return;
    }

    // render lại từng item
    modalCart.forEach(function (item) {
        const itemRow = document.createElement("div");
        itemRow.className = "modal-cart-item";

        const leftBox = document.createElement("div");
        leftBox.className = "modal-item-left";

        // thêm hình ảnh hoặc icon vip
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

        // info phim
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

        // nút xóa item
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

// hàm xóa item khỏi giỏ
function removeFromModalCart(id) {
    modalCart = modalCart.filter(function (item) {
        return item.id !== id;
    });
    updateModalCartUI();
}

// đóng mở modal giỏ hàng
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
// 2. tính tổng tiền & phiếu giảm giá
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

// chọn card ngoài danh sách
cartItems.forEach(function (item) {
    item.addEventListener("click", function () {
        item.classList.toggle("selected");
        updatePrice();
    });
});

// ngăn nút detail kích hoạt sự kiện chọn thẻ
const detailLinks = document.querySelectorAll(".detail-link");
detailLinks.forEach(function (linkItem) {
    linkItem.addEventListener("click", function (event) {
        event.stopPropagation();
    });
});

// áp mã promo
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

// xử lý nút checkout
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

// toggle menu responsive
document.addEventListener("DOMContentLoaded", function () {
    const menuBtn = document.querySelector('.sub-nav__menu');
    const navHeader = document.querySelector('.nav_header');

    if (menuBtn && navHeader) {
        menuBtn.addEventListener('click', function () {
            navHeader.classList.toggle('active');
        });
    }
});