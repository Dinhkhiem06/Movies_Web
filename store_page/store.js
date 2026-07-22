console.log("JS Loaded");
const cartItems = document.querySelectorAll(".cart_item");
const subtotalEl = document.getElementById("subtotal");
const discountEl = document.getElementById("discount");
const totalEl = document.getElementById("total");

const promoInput = document.getElementById("promoInput");
const applyBtn = document.getElementById("applyBtn");
console.log(applyBtn);

const checkoutBtn = document.getElementById("checkoutBtn");
console.log(checkoutBtn);

const message = document.getElementById("message");

let discount = 0;
let promoApplied = false;

function successMessage(text){

    message.style.color="#1f83ed";

    message.textContent=text;

}

function failureMessage(text){

    message.style.color="#ff4444";

    message.textContent=text;

}

function updatePrice(){

    let subtotal = 0;

    document.querySelectorAll(".cart_item.selected").forEach(item=>{

        subtotal += Number(item.dataset.price);

    });

    let total = subtotal;

    if(promoApplied){

        discount = subtotal*0.05;

        total = subtotal-discount;

    }
    else{

        discount = 0;

    }

    subtotalEl.textContent="$"+subtotal.toFixed(2);

    discountEl.textContent="-$"+discount.toFixed(2);

    totalEl.textContent="$"+total.toFixed(2);

}

cartItems.forEach(item=>{

    item.addEventListener("click",()=>{

        item.classList.toggle("selected");

        updatePrice();

    });

});

document.querySelectorAll(".fa-trash-can").forEach(icon=>{

    icon.addEventListener("click",(e)=>{

        e.stopPropagation();

        icon.closest(".cart_item").remove();

        successMessage("Movie removed.");

        updatePrice();

    });

});

applyBtn.addEventListener("click",()=>{

    if(promoApplied){

        failureMessage("Promo code has already been used.");

        return;

    }

    if(promoInput.value.trim().toUpperCase()=="NMLTWEB"){

        promoApplied=true;

        successMessage("Promo code applied successfully.");

    }
    else{

        failureMessage("Invalid promo code.");

    }

    updatePrice();

});

checkoutBtn.addEventListener("click",()=>{

    if(document.querySelectorAll(".cart_item.selected").length==0){

        failureMessage("Please select at least one movie.");

        return;

    }

    successMessage("Checkout successful. Thank you for choosing Flix!");

});