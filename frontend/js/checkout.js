document.addEventListener("DOMContentLoaded", function () {
  const cart = typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.getCart ? ShawarmHugStore.getCart() : [];

  if (!cart || cart.length === 0) {
    const emptyMsg = document.getElementById("checkout-empty-msg");
    const checkoutForm = document.getElementById("checkout-form");
    if (emptyMsg) emptyMsg.hidden = false;
    if (checkoutForm) checkoutForm.hidden = true;
    return;
  }

  prefillFromAccount();
  renderOrderSummary();
  wireOrderTypeToggle();
  wireFormSubmit();
});

function prefillFromAccount() {
  const user = typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.getCurrentUser ? ShawarmHugStore.getCurrentUser() : null;
  if (!user) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  setVal("cust-name", user.name || "");
  setVal("cust-email", user.email || "");
  setVal("cust-phone", user.phone || "");
}

function currentOrderType() {
  const checked = document.querySelector('input[name="orderType"]:checked');
  return checked ? checked.value : "Delivery";
}

function renderOrderSummary() {
  const cart = typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.getCart ? ShawarmHugStore.getCart() : [];
  const list = document.getElementById("checkout-items-list");
  if (!list) return;

  list.innerHTML = "";

  cart.forEach((line) => {
    const li = document.createElement("li");
    const optionText = line.option ? ` (${line.option})` : "";
    const linePrice = line.unitPrice ? line.unitPrice * line.qty : 0;
    const formattedPrice = (typeof ShawarmHugStore !== "undefined" && typeof ShawarmHugStore.formatPeso === "function") 
      ? ShawarmHugStore.formatPeso(linePrice) 
      : `₱${linePrice.toFixed(2)}`;

    li.textContent = `${line.qty}x ${line.name}${optionText} — ${formattedPrice}`;
    list.appendChild(li);
  });

  const subtotal = (typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.getCartSubtotal) ? ShawarmHugStore.getCartSubtotal() : 0;
  const deliveryFee = (typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.getDeliveryFee) ? ShawarmHugStore.getDeliveryFee(currentOrderType()) : 0;

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  const format = (typeof ShawarmHugStore !== "undefined" && typeof ShawarmHugStore.formatPeso === "function") 
    ? ShawarmHugStore.formatPeso 
    : (v) => `₱${v.toFixed(2)}`;

  setTxt("checkout-subtotal", format(subtotal));
  setTxt("checkout-delivery", format(deliveryFee));
  setTxt("checkout-total", format(subtotal + deliveryFee));
}

function wireOrderTypeToggle() {
  const deliveryRadio = document.getElementById("type-delivery");
  const pickupRadio = document.getElementById("type-pickup");
  const deliveryDetails = document.getElementById("delivery-details");
  const pickupDetails = document.getElementById("pickup-details");

  function toggle() {
    const isDelivery = deliveryRadio ? deliveryRadio.checked : true;
    if (deliveryDetails) deliveryDetails.hidden = !isDelivery;
    if (pickupDetails) pickupDetails.hidden = isDelivery;
    renderOrderSummary();
  }

  if (deliveryRadio) deliveryRadio.addEventListener("change", toggle);
  if (pickupRadio) pickupRadio.addEventListener("change", toggle);
  toggle();
}

function clearFieldErrors() {
  document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
  const globalMsg = document.getElementById("checkout-msg");
  if (globalMsg) {
    globalMsg.textContent = "";
    globalMsg.classList.remove("form-msg-error");
  }
}

function setFieldError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

function validateForm() {
  clearFieldErrors();
  let isValid = true;

  const name = document.getElementById("cust-name")?.value.trim() || "";
  if (!name) {
    setFieldError("err-cust-name", "Name is required.");
    isValid = false;
  }

  const phone = document.getElementById("cust-phone")?.value.trim() || "";
  const phonePattern = /^[0-9+()\-\s]{7,20}$/;
  if (!phone) {
    setFieldError("err-cust-phone", "Contact number is required.");
    isValid = false;
  } else if (!phonePattern.test(phone)) {
    setFieldError("err-cust-phone", "Enter a valid contact number.");
    isValid = false;
  }

  const email = document.getElementById("cust-email")?.value.trim() || "";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    setFieldError("err-cust-email", "Email is required.");
    isValid = false;
  } else if (!emailPattern.test(email)) {
    setFieldError("err-cust-email", "Enter a valid email address.");
    isValid = false;
  }

  const orderType = currentOrderType();
  const address = document.getElementById("cust-address")?.value.trim() || "";
  if (orderType === "Delivery" && !address) {
    setFieldError("err-cust-address", "Address is required for delivery orders.");
    isValid = false;
  }

  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
  if (!paymentMethod) {
    setFieldError("err-payment", "Select a payment method.");
    isValid = false;
  }

  return isValid;
}

// Which error <span> shows each field error sent back by the server
const SERVER_FIELD_ERRORS = {
  name: "err-cust-name",
  phone: "err-cust-phone",
  email: "err-cust-email",
  deliveryAddress: "err-cust-address",
  paymentMethod: "err-payment",
};

function showCheckoutMessage(message) {
  const globalMsg = document.getElementById("checkout-msg");
  if (!globalMsg) return;
  globalMsg.textContent = message;
  globalMsg.classList.add("form-msg-error");
}

function wireFormSubmit() {
  const form = document.getElementById("checkout-form");
  if (!form) return;
  const submitBtn = document.getElementById("place-order-btn") || form.querySelector('button[type="submit"]');
  let submitting = false;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (submitting) return; // ignore double clicks while the order is being sent
    if (!validateForm()) return;

    submitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Placing order…";
    }

    const orderType = currentOrderType();
    const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');

    const result = await ShawarmHugStore.placeOrder({
      name: document.getElementById("cust-name").value.trim(),
      phone: document.getElementById("cust-phone").value.trim(),
      email: document.getElementById("cust-email").value.trim(),
      orderType: orderType,
      deliveryAddress: orderType === "Delivery" ? document.getElementById("cust-address").value.trim() : "",
      paymentMethod: paymentMethodEl ? paymentMethodEl.value : "",
    });

    if (result.ok) {
      window.location.href = "confirmation.html";
      return;
    }

    // Order was NOT saved: show the server's message and let the customer try again
    const fieldErrors = (result.data && result.data.errors) || {};
    let shownInline = false;
    Object.keys(fieldErrors).forEach((field) => {
      if (SERVER_FIELD_ERRORS[field]) {
        setFieldError(SERVER_FIELD_ERRORS[field], fieldErrors[field]);
        shownInline = true;
      }
    });

    const message = (result.data && result.data.message) || "Your order could not be placed. Please try again.";
    showCheckoutMessage(
      result.status === 0
        ? message + " Your order has not been placed yet."
        : shownInline && !fieldErrors.items
          ? "Please fix the highlighted fields."
          : message
    );

    submitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Place Order";
    }
  });
}
