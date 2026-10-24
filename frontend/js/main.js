function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  const count = ShawarmHugStore.getCartCount();
  badge.textContent = count;
  badge.hidden = count === 0;
}

function updateAccountLink() {
  const link = document.getElementById("nav-account-link");
  if (!link) return;
  const user = ShawarmHugStore.getCurrentUser();
  if (user) {
    link.textContent = user.name.split(" ")[0];
  } else {
    link.textContent = "Sign In";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  updateCartBadge();
  updateAccountLink();
});
