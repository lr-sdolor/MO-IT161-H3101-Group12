const API_BASE_URL = "http://127.0.0.1:3000";

document.addEventListener("DOMContentLoaded", function () {
  // Update nav account link on page load based on current session
  updateAccountLink();

  const user = typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.getCurrentUser ? ShawarmHugStore.getCurrentUser() : null;
  if (user) {
    showProfileView(user);
  } else {
    showAuthView();
  }

  wireTabs();
  wireSignupForm();
  wireLoginForm();
});

// Helper function to update the top navigation account link text dynamically
function updateAccountLink() {
  const accountLink = document.getElementById("nav-account-link");
  if (!accountLink) return;

  const user = typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.getCurrentUser ? ShawarmHugStore.getCurrentUser() : null;
  if (user && user.name) {
    // Show first name in navigation bar when logged in
    accountLink.textContent = user.name.split(" ")[0];
  } else {
    // Default label when logged out
    accountLink.textContent = "Sign In";
  }
}

function wireTabs() {
  const loginTabBtn = document.getElementById("tab-login-btn");
  const signupTabBtn = document.getElementById("tab-signup-btn");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

  if (loginTabBtn && signupTabBtn && loginForm && signupForm) {
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
}

function wireSignupForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("signup-name")?.value || "";
    const email = document.getElementById("signup-email")?.value || "";
    const phone = document.getElementById("signup-phone")?.value || "";
    const password = document.getElementById("signup-password")?.value || "";
    const msg = document.getElementById("signup-msg");

    if (msg) {
      msg.textContent = "";
      msg.classList.remove("form-msg-error");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        if (msg) {
          msg.textContent = result.message || "Registration failed.";
          msg.classList.add("form-msg-error");
        }
        return;
      }

      const currentUser = { name: name.trim(), email: email.trim(), phone: phone.trim() };
      if (typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.setCurrentUser) {
        ShawarmHugStore.setCurrentUser(currentUser);
      }

      updateAccountLink();
      showProfileView(currentUser);
    } catch (err) {
      console.error("Signup error:", err);
      if (msg) {
        msg.textContent = "Unable to connect to the server. Please try again.";
        msg.classList.add("form-msg-error");
      }
    }
  });
}

function wireLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("login-email")?.value || "";
    const password = document.getElementById("login-password")?.value || "";
    const msg = document.getElementById("login-msg");

    if (msg) {
      msg.textContent = "";
      msg.classList.remove("form-msg-error");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        if (msg) {
          msg.textContent = result.message || "Invalid credentials.";
          msg.classList.add("form-msg-error");
        }
        return;
      }

      if (typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.setCurrentUser) {
        ShawarmHugStore.setCurrentUser(result.user);
      }

      updateAccountLink();
      showProfileView(result.user);
    } catch (err) {
      console.error("Login execution error:", err);
      if (msg) {
        msg.textContent = "Unable to connect to the server. Please try again.";
        msg.classList.add("form-msg-error");
      }
    }
  });
}

function showAuthView() {
  const authSection = document.getElementById("auth-section");
  const profileSection = document.getElementById("profile-section");

  if (authSection) authSection.hidden = false;
  if (profileSection) profileSection.hidden = true;
}

function showProfileView(user) {
  const authSection = document.getElementById("auth-section");
  const profileSection = document.getElementById("profile-section");

  if (authSection) authSection.hidden = true;
  if (profileSection) profileSection.hidden = false;

  const profileName = document.getElementById("profile-name");
  const profileFullName = document.getElementById("profile-full-name");
  const profileEmail = document.getElementById("profile-email");
  const profilePhone = document.getElementById("profile-phone");

  if (profileName) profileName.textContent = user.name ? user.name.split(" ")[0] : "";
  if (profileFullName) profileFullName.textContent = user.name || "";
  if (profileEmail) profileEmail.textContent = user.email || "";
  if (profilePhone) profilePhone.textContent = user.phone || "—";

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    const freshLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.replaceWith(freshLogoutBtn);

    freshLogoutBtn.addEventListener("click", function () {
      if (typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.logOut) {
        ShawarmHugStore.logOut();
      }
      updateAccountLink();
      showAuthView();
    });
  }

  renderOrderHistory();
}

function renderOrderHistory() {
  const list = document.getElementById("order-history-list");
  const emptyMsg = document.getElementById("order-history-empty");

  if (!list || !emptyMsg) return;

  const orders = (typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.getOrdersForCurrentUser)
    ? ShawarmHugStore.getOrdersForCurrentUser()
    : [];

  list.innerHTML = "";

  if (!orders || orders.length === 0) {
    emptyMsg.hidden = false;
    return;
  }
  emptyMsg.hidden = true;

  orders.forEach((order) => {
    const li = document.createElement("li");
    li.className = "order-history-item";
    const formattedTotal = (typeof ShawarmHugStore !== "undefined" && ShawarmHugStore.formatPeso) 
      ? ShawarmHugStore.formatPeso(order.total) 
      : "₱" + order.total;

    li.innerHTML =
      "<strong>" + (order.orderNumber || "Order") + "</strong> — " + (order.orderStatus || "Pending") +
      "<br>" + new Date(order.createdAt || Date.now()).toLocaleDateString() +
      " · " + formattedTotal;

    list.appendChild(li);
  });
}