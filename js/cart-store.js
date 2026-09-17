const ShawarmHugStore = (function () {
  const CART_KEY = "shawarmhug_cart";
  const ORDERS_KEY = "shawarmhug_orders";
  const USERS_KEY = "shawarmhug_users";
  const SESSION_KEY = "shawarmhug_currentUser";
  const DELIVERY_FEE = 49;

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
    return "₱" + Number(amount).toFixed(2);
  }

  /* ---------- cart ---------- */

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
    return getCart().reduce((sum, line) => sum + line.qty, 0);
  }

  function getCartSubtotal() {
    return getCart().reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  }

  function getDeliveryFee(orderType) {
    return orderType === "Pickup" ? 0 : DELIVERY_FEE;
  }

  /* ---------- orders ---------- */

  function getOrders() {
    return readJSON(ORDERS_KEY, []);
  }

  function generateOrderNumber() {
    const year = new Date().getFullYear();
    const randomPart = Math.floor(10000 + Math.random() * 90000);
    return "SHW-" + year + "-" + randomPart;
  }

  // details = { custName, custPhone, custEmail, orderType, custAddress, paymentMethod }
  function saveOrder(details) {
    const cart = getCart();
    const subtotal = getCartSubtotal();
    const deliveryFee = getDeliveryFee(details.orderType);
    const order = {
      orderNumber: generateOrderNumber(),
      items: cart,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: subtotal + deliveryFee,
      orderStatus: details.paymentMethod === "COD" ? "Confirmed" : "Pending",
      createdAt: new Date().toISOString(),
      ...details,
    };

    const orders = getOrders();
    orders.unshift(order);
    writeJSON(ORDERS_KEY, orders);
    writeJSON("shawarmhug_lastOrder", order);

    // If a customer is logged in, attach this order to their history
    const currentUser = getCurrentUser();
    if (currentUser) {
      const users = getUsers();
      const user = users.find((u) => u.email === currentUser.email);
      if (user) {
        user.orderNumbers = user.orderNumbers || [];
        user.orderNumbers.push(order.orderNumber);
        writeJSON(USERS_KEY, users);
      }
    }

    clearCart();
    return order;
  }

  function getLastOrder() {
    return readJSON("shawarmhug_lastOrder", null);
  }

  /* ---------- accounts (simplified per design doc section 4.6 / 9) ---------- */

  function getUsers() {
    return readJSON(USERS_KEY, []);
  }

  function findUserByEmail(email) {
    return getUsers().find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  // Note: this is a static-site placeholder, not production auth.
  // Real hashing/session/token management is future scope (design doc, section 9).
  function signUp(user) {
    const users = getUsers();
    if (findUserByEmail(user.email)) {
      return { ok: false, message: "An account with that email already exists." };
    }
    const newUser = {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: user.password,
      orderNumbers: [],
    };
    users.push(newUser);
    writeJSON(USERS_KEY, users);
    setCurrentUser(newUser);
    return { ok: true, user: newUser };
  }

  function logIn(email, password) {
    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      return { ok: false, message: "Incorrect email or password." };
    }
    setCurrentUser(user);
    return { ok: true, user: user };
  }

  function logOut() {
    localStorage.removeItem(SESSION_KEY);
  }

  function setCurrentUser(user) {
    writeJSON(SESSION_KEY, { name: user.name, email: user.email, phone: user.phone });
  }

  function getCurrentUser() {
    return readJSON(SESSION_KEY, null);
  }

  function getOrdersForCurrentUser() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    const user = findUserByEmail(currentUser.email);
    if (!user || !user.orderNumbers) return [];
    const allOrders = getOrders();
    return allOrders.filter((o) => user.orderNumbers.includes(o.orderNumber));
  }

  return {
    formatPeso,
    getCart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    getCartCount,
    getCartSubtotal,
    getDeliveryFee,
    getOrders,
    saveOrder,
    getLastOrder,
    signUp,
    logIn,
    logOut,
    getCurrentUser,
    getOrdersForCurrentUser,
  };
})();
