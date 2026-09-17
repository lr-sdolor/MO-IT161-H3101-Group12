document.addEventListener("DOMContentLoaded", function () {
  const order = ShawarmHugStore.getLastOrder();

  if (!order) {
    document.getElementById("no-order-msg").hidden = false;
    return;
  }

  document.getElementById("confirmation-card").hidden = false;

  document.getElementById("conf-order-number").textContent = order.orderNumber;
  document.getElementById("conf-order-status").textContent = order.orderStatus;
  document.getElementById("conf-order-type").textContent = order.orderType;
  document.getElementById("conf-payment-method").textContent =
    order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment";

  const addressRow = document.getElementById("conf-address-row");
  if (order.orderType === "Delivery") {
    document.getElementById("conf-order-address").textContent = order.custAddress;
  } else {
    addressRow.hidden = true;
  }

  const itemsList = document.getElementById("conf-items-list");
  itemsList.innerHTML = "";
  order.items.forEach((line) => {
    const li = document.createElement("li");
    li.textContent =
      line.qty + "x " + line.name + " (" + line.option + ") — " +
      ShawarmHugStore.formatPeso(line.unitPrice * line.qty);
    itemsList.appendChild(li);
  });

  document.getElementById("conf-subtotal").textContent = ShawarmHugStore.formatPeso(order.subtotal);
  document.getElementById("conf-delivery").textContent = ShawarmHugStore.formatPeso(order.deliveryFee);
  document.getElementById("conf-total").textContent = ShawarmHugStore.formatPeso(order.total);

  updateCartBadge();
});
