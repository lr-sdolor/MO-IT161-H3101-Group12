document.addEventListener("DOMContentLoaded", function () {
  const cart = ShawarmHugStore.getCart();

  if (cart.length === 0) {
    document.getElementById("checkout-empty-msg").hidden = false;
    document.getElementById("checkout-form").hidden = true;
    return;
  }

  prefillFromAccount();
  renderOrderSummary();
  wireOrderTypeToggle();
  wireFormSubmit();
});

function prefillFromAccount() {
  const user = ShawarmHugStore.getCurrentUser();
  if (!user) return;
  document.getElementById("cust-name").value = user.name || "";
  document.getElementById("cust-email").value = user.email || "";
  document.getElementById("cust-phone").value = user.phone || "";
}

function currentOrderType() {
  return document.querySelector('input[name="orderType"]:checked').value;
}

function renderOrderSummary() {
  const cart = ShawarmHugStore.getCart();
  const list = document.getElementById("checkout-items-list");
  list.innerHTML = "";

  cart.forEach((line) => {
    const li = document.createElement("li");
    li.textContent =
      line.qty + "x " + line.name + " (" + line.option + ") — " +
      ShawarmHugStore.formatPeso(line.unitPrice * line.qty);
    list.appendChild(li);
  });

  const subtotal = ShawarmHugStore.getCartSubtotal();
  const deliveryFee = ShawarmHugStore.getDeliveryFee(currentOrderType());
  document.getElementById("checkout-subtotal").textContent = ShawarmHugStore.formatPeso(subtotal);
  document.getElementById("checkout-delivery").textContent = ShawarmHugStore.formatPeso(deliveryFee);
  document.getElementById("checkout-total").textContent = ShawarmHugStore.formatPeso(subtotal + deliveryFee);
}

function wireOrderTypeToggle() {
  const deliveryRadio = document.getElementById("type-delivery");
  const pickupRadio = document.getElementById("type-pickup");
  const deliveryDetails = document.getElementById("delivery-details");
  const pickupDetails = document.getElementById("pickup-details");

  function toggle() {
    const isDelivery = deliveryRadio.checked;
    deliveryDetails.hidden = !isDelivery;
    pickupDetails.hidden = isDelivery;
    renderOrderSummary();
  }

  deliveryRadio.addEventListener("change", toggle);
  pickupRadio.addEventListener("change", toggle);
  toggle();
}

function clearFieldErrors() {
  document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
}

function setFieldError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

// Validation rules from design doc section 4.4
function validateForm() {
  clearFieldErrors();
  let isValid = true;

  const name = document.getElementById("cust-name").value.trim();
  if (!name) {
    setFieldError("err-cust-name", "Name is required.");
    isValid = false;
  }

  const phone = document.getElementById("cust-phone").value.trim();
  const phonePattern = /^[0-9+()\-\s]{7,20}$/;
  if (!phone) {
    setFieldError("err-cust-phone", "Contact number is required.");
    isValid = false;
  } else if (!phonePattern.test(phone)) {
    setFieldError("err-cust-phone", "Enter a valid contact number.");
    isValid = false;
  }

  const email = document.getElementById("cust-email").value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    setFieldError("err-cust-email", "Email is required.");
    isValid = false;
  } else if (!emailPattern.test(email)) {
    setFieldError("err-cust-email", "Enter a valid email address.");
    isValid = false;
  }

  const orderType = currentOrderType();
  const address = document.getElementById("cust-address").value.trim();
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

function wireFormSubmit() {
  const form = document.getElementById("checkout-form");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!validateForm()) return;

    const orderType = currentOrderType();
    const details = {
      custName: document.getElementById("cust-name").value.trim(),
      custPhone: document.getElementById("cust-phone").value.trim(),
      custEmail: document.getElementById("cust-email").value.trim(),
      orderType: orderType,
      custAddress: orderType === "Delivery" ? document.getElementById("cust-address").value.trim() : "",
      paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
    };

    ShawarmHugStore.saveOrder(details);
    window.location.href = "confirmation.html";
  });
}
