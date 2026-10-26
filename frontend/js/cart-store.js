const ShawarmHugStore = (function () {
  const CART_KEY = "shawarmhug_cart";
  const LAST_ORDER_KEY = "shawarmhug_lastOrder";
  const SESSION_KEY = "shawarmhug_currentUser";
  const DELIVERY_FEE = 49;

  // Where the Express server is.
  // When the site is opened through the server itself (npm start → http://localhost:3000)
  // we use the same address. Otherwise (Live Server, opening the file directly)
  // we call the server on port 3000.
  const API_BASE_URL =
    location.protocol.startsWith("http") && location.port === "3000"
      ? ""
      : "http://localhost:3000";

  /* ---------- small helpers ---------- */

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn("ShawarmHugStore: could not read " + key, err);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn("ShawarmHugStore: could not save " + key, err);
    }
  }

  function formatPeso(amount) {
    return "₱" + Number(amount || 0).toFixed(2);
  }

  /* ---------- talking to the backend ---------- */

  // Sends a request to the Express API and always resolves to
  // { ok, status, data } so pages can show a clear message.
  async function api(path, options) {
    const opts = options || {};
    let response;
    try {
      response = await fetch(API_BASE_URL + path, {
        method: opts.method || "GET",
        headers: opts.body ? { "Content-Type": "application/json" } : undefined,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });
    } catch (err) {
      return {
        ok: false,
        status: 0,
        data: {
          message:
            "Can't reach the ShawarmHug server. Please check that it is running and try again.",
        },
      };
    }

    let data = {};
    try {
      data = await response.json();
    } catch (err) {
      data = { message: "The server sent an unexpected response." };
    }
    return { ok: response.ok && data.ok !== false, status: response.status, data: data };
  }

  /* ---------- cart (kept in the browser until checkout) ---------- */

  function getCart() {
    return readJSON(CART_KEY, []);
  }

  function saveCart(cart) {
    writeJSON(CART_KEY, cart);
  }

  // item = { name, option, unitPrice, qty }
  function addToCart(item) {
    const cart = getCart();
    const existing = cart.find(
      (line) => line.name === item.name && line.option === item.option
    );
    if (existing) {
      existing.qty += item.qty;
    } else {
      cart.push(item);
    }
    saveCart(cart);
    return cart;
  }

  function updateCartQty(index, qty) {
    const cart = getCart();
    if (!cart[index]) return cart;
    if (qty <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].qty = qty;
    }
    saveCart(cart);
    return cart;
  }

  function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    saveCart([]);
  }

  function getCartCount() {
    return getCart().reduce((sum, line) => sum + (line.qty || 0), 0);
  }

  function getCartSubtotal() {
    return getCart().reduce((sum, line) => sum + ((line.unitPrice || 0) * (line.qty || 0)), 0);
  }

  // Shown as a preview only; the server calculates the real fee and total
  function getDeliveryFee(orderType) {
    return orderType === "Pickup" ? 0 : DELIVERY_FEE;
  }

  /* ---------- orders (stored on the server) ---------- */

  // Sends the order to POST /orders. The server checks it, recalculates the
  // totals and returns the saved order with its order number.
  async function placeOrder(details) {
    const payload = {
      name: details.name,
      phone: details.phone,
      email: details.email,
      orderType: details.orderType,
      deliveryAddress: details.deliveryAddress,
      paymentMethod: details.paymentMethod,
      items: getCart().map((line) => ({ name: line.name, option: line.option, qty: line.qty })),
    };

    const result = await api("/orders", { method: "POST", body: payload });
    if (result.ok) {
      // Keep a copy so the confirmation page can show it, then empty the cart
      writeJSON(LAST_ORDER_KEY, result.data.order);
      clearCart();
    }
    return result;
  }

  function getLastOrder() {
    return readJSON(LAST_ORDER_KEY, null);
  }

  /* ---------- accounts & session ---------- */

  function signUp(user) {
    return api("/users", { method: "POST", body: user });
  }

  function logIn(email, password) {
    return api("/users/login", { method: "POST", body: { email: email, password: password } });
  }

  async function getOrdersForCurrentUser() {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.email) return { ok: true, data: { orders: [] } };
    return api("/users/" + encodeURIComponent(currentUser.email) + "/orders");
  }

  function logOut() {
    localStorage.removeItem(SESSION_KEY);
  }

  // Only name, email and phone are kept in the browser (never the password)
  function setCurrentUser(user) {
    if (!user) return;
    writeJSON(SESSION_KEY, { name: user.name, email: user.email, phone: user.phone });
  }

  function getCurrentUser() {
    return readJSON(SESSION_KEY, null);
  }

  return {
    API_BASE_URL,
    formatPeso,
    getCart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    getCartCount,
    getCartSubtotal,
    getDeliveryFee,
    placeOrder,
    getLastOrder,
    signUp,
    logIn,
    logOut,
    setCurrentUser,
    getCurrentUser,
    getOrdersForCurrentUser,
  };
})();
