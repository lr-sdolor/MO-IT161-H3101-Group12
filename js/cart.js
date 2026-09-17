document.addEventListener("DOMContentLoaded", function () {
  renderCart();

  document.getElementById("clear-cart-btn").addEventListener("click", function () {
    ShawarmHugStore.clearCart();
    renderCart();
    updateCartBadge();
  });
});

function renderCart() {
  const cart = ShawarmHugStore.getCart();
  const emptyMsg = document.getElementById("cart-empty-msg");
  const table = document.getElementById("cart-table");
  const summary = document.getElementById("cart-summary");
  const tbody = document.getElementById("cart-items-body");
  const checkoutBtn = document.getElementById("checkout-btn");

  if (cart.length === 0) {
    emptyMsg.hidden = false;
    table.hidden = true;
    summary.hidden = true;
    return;
  }

  emptyMsg.hidden = true;
  table.hidden = false;
  summary.hidden = false;

  tbody.innerHTML = "";
  cart.forEach((line, index) => {
    const lineTotal = line.unitPrice * line.qty;
    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + escapeHtml(line.name) + "</td>" +
      "<td>" + escapeHtml(line.option) + "</td>" +
      "<td>" + ShawarmHugStore.formatPeso(line.unitPrice) + "</td>" +
      "<td>" +
        '<input type="number" class="qty-input cart-qty-input" min="1" max="20" ' +
        'value="' + line.qty + '" data-index="' + index + '">' +
      "</td>" +
      "<td>" + ShawarmHugStore.formatPeso(lineTotal) + "</td>" +
      "<td>" +
        '<button class="remove-btn" data-index="' + index + '" aria-label="Remove ' +
        escapeHtml(line.name) + '">✕</button>' +
      "</td>";
    tbody.appendChild(row);
  });

  // Quantity changes
  tbody.querySelectorAll(".cart-qty-input").forEach((input) => {
    input.addEventListener("change", function () {
      const index = Number(input.dataset.index);
      let qty = parseInt(input.value, 10);
      if (isNaN(qty) || qty < 1) qty = 1;
      ShawarmHugStore.updateCartQty(index, qty);
      renderCart();
      updateCartBadge();
    });
  });

  // Remove line item
  tbody.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = Number(btn.dataset.index);
      ShawarmHugStore.removeFromCart(index);
      renderCart();
      updateCartBadge();
    });
  });

  const subtotal = ShawarmHugStore.getCartSubtotal();
  const deliveryFee = ShawarmHugStore.getDeliveryFee("Delivery");
  document.getElementById("summary-subtotal").textContent = ShawarmHugStore.formatPeso(subtotal);
  document.getElementById("summary-delivery").textContent = ShawarmHugStore.formatPeso(deliveryFee);
  document.getElementById("summary-total").textContent = ShawarmHugStore.formatPeso(subtotal + deliveryFee);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
