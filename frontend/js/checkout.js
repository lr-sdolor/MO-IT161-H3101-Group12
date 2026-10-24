const API_BASE_URL = "http://127.0.0.1:3000";

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

function wireFormSubmit() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!validateForm()) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const orderType = currentOrderType();
    const cart = (typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.getCart) ? ShawarmHugStore.getCart() : [];
    const subtotal = (typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.getCartSubtotal) ? ShawarmHugStore.getCartSubtotal() : 0;
    const deliveryFee = (typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.getDeliveryFee) ? ShawarmHugStore.getDeliveryFee(orderType) : 0;
    const total = subtotal + deliveryFee;

    const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');
    const custAddress = orderType === "Delivery" ? (document.getElementById("cust-address")?.value.trim() || "") : "";

    const orderPayload = {
      name: document.getElementById("cust-name")?.value.trim() || "",
      phone: document.getElementById("cust-phone")?.value.trim() || "",
      email: document.getElementById("cust-email")?.value.trim() || "",
      custName: document.getElementById("cust-name")?.value.trim() || "",
      custPhone: document.getElementById("cust-phone")?.value.trim() || "",
      custEmail: document.getElementById("cust-email")?.value.trim() || "",
      orderType: orderType,
      deliveryAddress: custAddress,
      custAddress: custAddress,
      paymentMethod: paymentMethodEl ? paymentMethodEl.value : "COD",
      items: cart,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: total
    };

    let savedOrder = null;

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        savedOrder = result.order;
      }
    } catch (err) {
      console.warn("Server offline or unreachable, proceeding with local store fallback:", err);
    }

    // Save order locally for confirmation page and user order history
    if (typeof ShawarmHugStore !== "undefined" && typeof ShawarmHugStore.saveOrder === "function") {
      ShawarmHugStore.saveOrder(savedOrder || orderPayload);
    }

    // Clear cart
    if (typeof ShawarmHugStore !== "undefined" && typeof ShawarmHugStore.clearCart === "function") {
      ShawarmHugStore.clearCart();
    }

    // Redirect to confirmation page
    window.location.href = "confirmation.html";
  });
}