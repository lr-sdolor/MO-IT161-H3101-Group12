document.addEventListener("DOMContentLoaded", function () {
  wireAddToCartButtons();
  wireCategoryFilters();
});

function wireAddToCartButtons() {
  const buttons = document.querySelectorAll(".add-to-cart-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      const name = button.dataset.name;
      const sizeSelect = document.getElementById(button.dataset.sizeSelect);
      const qtyInput = document.getElementById(button.dataset.qtyInput);

      const unitPrice = Number(sizeSelect.value);
      const option = sizeSelect.options[sizeSelect.selectedIndex].text.split(" - ")[0];
      let qty = parseInt(qtyInput.value, 10);
      if (isNaN(qty) || qty < 1) qty = 1;

      ShawarmHugStore.addToCart({ name, option, unitPrice, qty });
      updateCartBadge();

      // Quick visual confirmation without an intrusive alert()
      const original = button.textContent;
      button.textContent = "Added ✓";
      button.disabled = true;
      setTimeout(function () {
        button.textContent = original;
        button.disabled = false;
      }, 900);

      // Reset quantity back to 1 for the next add
      qtyInput.value = 1;
    });
  });
}

function wireCategoryFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  if (filterButtons.length === 0) return;

  const dishCards = document.querySelectorAll(".dish-card");
  const noResultsMsg = document.getElementById("no-results-msg");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const category = btn.dataset.category;
      let visibleCount = 0;

      dishCards.forEach((card) => {
        const matches = category === "all" || card.dataset.category === category;
        card.hidden = !matches;
        if (matches) visibleCount++;
      });

      if (noResultsMsg) noResultsMsg.hidden = visibleCount !== 0;
    });
  });
}
