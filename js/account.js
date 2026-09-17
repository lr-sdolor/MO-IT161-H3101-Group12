document.addEventListener("DOMContentLoaded", function () {
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

function wireTabs() {
  const loginTabBtn = document.getElementById("tab-login-btn");
  const signupTabBtn = document.getElementById("tab-signup-btn");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

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

function wireSignupForm() {
  const form = document.getElementById("signup-form");
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const phone = document.getElementById("signup-phone").value.trim();
    const password = document.getElementById("signup-password").value;
    const msg = document.getElementById("signup-msg");
    msg.textContent = "";
    msg.classList.remove("form-msg-error");

    let isValid = true;
    document.getElementById("err-signup-name").textContent = "";
    document.getElementById("err-signup-email").textContent = "";
    document.getElementById("err-signup-password").textContent = "";

    if (!name) {
      document.getElementById("err-signup-name").textContent = "Name is required.";
      isValid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById("err-signup-email").textContent = "Enter a valid email address.";
      isValid = false;
    }
    if (password.length < 6) {
      document.getElementById("err-signup-password").textContent = "Password must be at least 6 characters.";
      isValid = false;
    }
    if (!isValid) return;

    const result = ShawarmHugStore.signUp({ name, email, phone, password });
    if (!result.ok) {
      msg.textContent = result.message;
      msg.classList.add("form-msg-error");
      return;
    }

    updateAccountLink();
    showProfileView(ShawarmHugStore.getCurrentUser());
  });
}

function wireLoginForm() {
  const form = document.getElementById("login-form");
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const msg = document.getElementById("login-msg");
    msg.textContent = "";
    msg.classList.remove("form-msg-error");

    const result = ShawarmHugStore.logIn(email, password);
    if (!result.ok) {
      msg.textContent = result.message;
      msg.classList.add("form-msg-error");
      return;
    }

    updateAccountLink();
    showProfileView(ShawarmHugStore.getCurrentUser());
  });
}

function showAuthView() {
  document.getElementById("auth-section").hidden = false;
  document.getElementById("profile-section").hidden = true;
}

function showProfileView(user) {
  document.getElementById("auth-section").hidden = true;
  document.getElementById("profile-section").hidden = false;

  document.getElementById("profile-name").textContent = user.name.split(" ")[0];
  document.getElementById("profile-full-name").textContent = user.name;
  document.getElementById("profile-email").textContent = user.email;
  document.getElementById("profile-phone").textContent = user.phone || "—";

  document.getElementById("logout-btn").addEventListener("click", function () {
    ShawarmHugStore.logOut();
    updateAccountLink();
    showAuthView();
  });

  renderOrderHistory();
}

function renderOrderHistory() {
  const orders = ShawarmHugStore.getOrdersForCurrentUser();
  const list = document.getElementById("order-history-list");
  const emptyMsg = document.getElementById("order-history-empty");
  list.innerHTML = "";

  if (orders.length === 0) {
    emptyMsg.hidden = false;
    return;
  }
  emptyMsg.hidden = true;

  orders.forEach((order) => {
    const li = document.createElement("li");
    li.className = "order-history-item";
    li.innerHTML =
      "<strong>" + order.orderNumber + "</strong> — " + order.orderStatus +
      "<br>" + new Date(order.createdAt).toLocaleDateString() +
      " · " + ShawarmHugStore.formatPeso(order.total);
    list.appendChild(li);
  });
}
