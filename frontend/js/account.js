document.addEventListener("DOMContentLoaded", function () {
  // account.js is also loaded on other pages for the nav link; only run the
  // page logic when the account sections exist
  updateAccountLink();
  if (!document.getElementById("auth-section")) return;

  const user = ShawarmHugStore.getCurrentUser();
  if (user) {
    showProfileView(user);
  } else {
    showAuthView();
  }

  wireTabs();
  wireSignupForm();
  wireLoginForm();
});

// Shows the first name in the navigation bar when logged in
function updateAccountLink() {
  const accountLink = document.getElementById("nav-account-link");
  if (!accountLink) return;

  const user = ShawarmHugStore.getCurrentUser();
  accountLink.textContent = user && user.name ? user.name.split(" ")[0] : "Sign In";
}

function wireTabs() {
  const loginTabBtn = document.getElementById("tab-login-btn");
  const signupTabBtn = document.getElementById("tab-signup-btn");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  if (!loginTabBtn || !signupTabBtn || !loginForm || !signupForm) return;

  loginTabBtn.addEventListener("click", function () {
    loginTabBtn.classList.add("active");
    signupTabBtn.classList.remove("active");
    loginForm.hidden = false;
    signupForm.hidden = true;
  });

  signupTabBtn.addEventListener("click", function () {
    signupTabBtn.classList.add("active");
    loginTabBtn.classList.remove("active");
    signupForm.hidden = false;
    loginForm.hidden = true;
  });
}

function setFormMessage(msgEl, text, isError) {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.classList.toggle("form-msg-error", !!isError);
}

// Disables the submit button while a request is running so the form
// cannot be sent twice
function setBusy(form, busy, busyLabel) {
  const btn = form.querySelector('button[type="submit"]');
  if (!btn) return;
  if (!btn.dataset.label) btn.dataset.label = btn.textContent;
  btn.disabled = busy;
  btn.textContent = busy ? busyLabel : btn.dataset.label;
}

function wireSignupForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const phone = document.getElementById("signup-phone").value.trim();
    const password = document.getElementById("signup-password").value;
    const msg = document.getElementById("signup-msg");

    // Quick checks in the browser first (the server checks again)
    if (!name) return setFormMessage(msg, "Name is required.", true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setFormMessage(msg, "Enter a valid email address.", true);
    if (phone && !/^[0-9+()\-\s]{7,20}$/.test(phone)) return setFormMessage(msg, "Enter a valid contact number.", true);
    if (password.length < 6) return setFormMessage(msg, "Password must be at least 6 characters.", true);

    setFormMessage(msg, "", false);
    setBusy(form, true, "Creating account…");
    const result = await ShawarmHugStore.signUp({ name, email, phone, password });
    setBusy(form, false);

    if (!result.ok) {
      setFormMessage(msg, result.data.message || "Registration failed. Please try again.", true);
      return;
    }

    form.reset();
    ShawarmHugStore.setCurrentUser(result.data.user);
    updateAccountLink();
    showProfileView(result.data.user);
  });
}

function wireLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const msg = document.getElementById("login-msg");

    if (!email || !password) return setFormMessage(msg, "Enter your email and password.", true);

    setFormMessage(msg, "", false);
    setBusy(form, true, "Logging in…");
    const result = await ShawarmHugStore.logIn(email, password);
    setBusy(form, false);

    if (!result.ok) {
      setFormMessage(msg, result.data.message || "Incorrect email or password.", true);
      return;
    }

    form.reset();
    ShawarmHugStore.setCurrentUser(result.data.user);
    updateAccountLink();
    showProfileView(result.data.user);
  });
}

function showAuthView() {
  const authSection = document.getElementById("auth-section");
  const profileSection = document.getElementById("profile-section");
  if (authSection) authSection.hidden = false;
  if (profileSection) profileSection.hidden = true;

  // Always come back to the Log In tab (e.g. after logging out)
  const loginTabBtn = document.getElementById("tab-login-btn");
  if (loginTabBtn) loginTabBtn.click();
}

function showProfileView(user) {
  const authSection = document.getElementById("auth-section");
  const profileSection = document.getElementById("profile-section");
  if (authSection) authSection.hidden = true;
  if (profileSection) profileSection.hidden = false;

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setTxt("profile-name", user.name ? user.name.split(" ")[0] : "");
  setTxt("profile-full-name", user.name || "");
  setTxt("profile-email", user.email || "");
  setTxt("profile-phone", user.phone || "—");

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    // Replace the button so the click handler is only attached once
    const freshLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.replaceWith(freshLogoutBtn);
    freshLogoutBtn.addEventListener("click", function () {
      ShawarmHugStore.logOut();
      updateAccountLink();
      showAuthView();
    });
  }

  renderOrderHistory();
}

// Loads the logged-in customer's orders from the server (GET /users/:email/orders)
async function renderOrderHistory() {
  const list = document.getElementById("order-history-list");
  const emptyMsg = document.getElementById("order-history-empty");
  if (!list || !emptyMsg) return;

  list.innerHTML = "<li class=\"order-history-item\">Loading your orders…</li>";
  emptyMsg.hidden = true;

  const result = await ShawarmHugStore.getOrdersForCurrentUser();
  list.innerHTML = "";

  if (!result.ok) {
    const li = document.createElement("li");
    li.className = "order-history-item form-msg-error";
    li.textContent = result.data.message || "Could not load your order history.";
    list.appendChild(li);
    return;
  }

  const orders = result.data.orders || [];
  if (orders.length === 0) {
    emptyMsg.hidden = false;
    return;
  }

  orders.forEach((order) => {
    const li = document.createElement("li");
    li.className = "order-history-item";

    const title = document.createElement("strong");
    title.textContent = order.orderNumber;
    li.appendChild(title);
    li.appendChild(document.createTextNode(" — " + (order.orderStatus || "Pending")));
    li.appendChild(document.createElement("br"));
    li.appendChild(
      document.createTextNode(
        new Date(order.createdAt).toLocaleDateString() +
          " · " + order.orderType +
          " · " + ShawarmHugStore.formatPeso(order.total)
      )
    );
    list.appendChild(li);
  });
}
