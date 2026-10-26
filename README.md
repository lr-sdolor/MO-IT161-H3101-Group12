# ShawarmHug: Shawarma Restaurant Ordering Website

**MO-IT161 Web Systems and Technology · H3101 · Group 12**

ShawarmHug (Blessy: Shawarmhug) is a browser-based ordering website for a shawarma restaurant on Maginhawa St., Diliman, Quezon City. Customers can browse the menu, add items to a cart, check out for delivery or pickup, and create an account to see their order history.

**Current phase:** Phase 2, a multi-page HTML/CSS/JavaScript frontend connected to an **Express.js backend**. Accounts and orders are now sent to the server and saved in JSON files, so they stay available after the browser is closed or the server restarts. React comes later.

See [`docs/Shawarma Store Technical Design Document.docx`](docs/) for the full design: site map, data model, and API.

---

## Features

- **Landing page**: animated banner slider showing featured dishes, featured menu cards, and current promotions
- **Menu**: dish cards with size/option and quantity selectors, filtered by category (All, Shawarma, Rice Meals, Appetizers)
- **Cart**: edit quantities, remove items, or clear the cart; subtotal, delivery fee, and total update immediately. The item count badge in the navigation appears on every page
- **Checkout (backend-supported)**: customer info, Delivery or Pickup, Cash on Delivery or Online Payment. The order is sent to `POST /orders`; the server checks every field, **recalculates prices and totals from its own menu** (₱49 delivery fee, ₱0 for pickup), creates the order number and saves the order. Errors from the server are shown next to the right field
- **Order confirmation**: order number (e.g. `SHW-2026-12345`), status, items, and totals as saved by the server. COD orders are *Confirmed*; Online Payment orders are *Pending* (payment is simulated)
- **Account (backend-supported)**: sign up and log in through the server with bcrypt-hashed passwords; order history is loaded from the server (`GET /users/:email/orders`); checkout details are filled in automatically for logged-in users
- **About / Contact**: store story, location, contact number, and opening hours

> **Note:** Online Payment is simulated. The logged-in user is remembered in the browser (`localStorage`) and there are no real sessions/tokens yet, so do not use real passwords.

---

## Tech Stack

| Part | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript (`fetch` for API calls) |
| Backend | Node.js, Express.js 5, bcrypt, cors |
| Storage | JSON files (`Backend/users.json`, `Backend/orders.json`) |
| Planned | Bootstrap (responsive layout), React (frontend), SQLite if the data grows |

---

## Project Structure

```
MO-IT161-H3101-Group12/
├── frontend/
│   ├── index.html, menu.html, cart.html, checkout.html,
│   │   confirmation.html, account.html, about.html
│   ├── css/
│   │   ├── style.css         # Base page styles: body, navbar, logo, buttons
│   │   ├── general.css       # Shared section spacing, headings, text, lists, footer
│   │   ├── pages.css         # Menu cards and filters, cart, checkout, confirmation, account UI
│   │   └── slider.css        # Landing page banner slider animation
│   ├── js/
│   │   ├── cart-store.js     # Shared data layer: cart (browser) + API calls to the backend — load first
│   │   ├── main.js           # Shared: cart badge and account link in the navbar
│   │   ├── menu.js           # Add to Cart and category filters (index + menu)
│   │   ├── cart.js           # Cart rendering and line-item edits
│   │   ├── checkout.js       # Order-type toggle, validation, and sending the order to the server
│   │   ├── confirmation.js   # Displays the last placed order
│   │   └── account.js        # Sign up, log in, profile, and order history (from the server)
│   └── images/               # Logo and dish photos
│
├── Backend/
│   ├── server.js             # Express app: routes, static frontend, error handling
│   ├── users.js              # Read/save users
│   ├── orders.js             # Order validation, totals, order numbers, read/save orders
│   ├── menu.js               # Server-side menu prices and delivery fee
│   ├── storage.js            # Safe JSON-file reading/writing
│   ├── users.json            # Saved accounts (password hashes only)
│   ├── orders.json           # Saved orders, newest first
│   ├── test/api.test.js      # Automated API tests (npm test)
│   └── package.json
│
├── docs/                     # Technical Design Document, testing notes
└── .github/CODEOWNERS
```

`cart-store.js` provides the global `ShawarmHugStore` object, which every other script uses. All `fetch` calls to the backend go through it.

> **Menu prices live in two places:** the `<option>` values in `menu.html`/`index.html` (shown to customers) and `Backend/menu.js` (used for the real totals). When a price or item changes, update both.

### Browser storage keys

| Key | Contents |
|---|---|
| `shawarmhug_cart` | Current cart lines `{ name, option, unitPrice, qty }` (sent to the server at checkout) |
| `shawarmhug_lastOrder` | The order returned by the server, read by the confirmation page |
| `shawarmhug_currentUser` | The logged-in user (name, email, phone — never the password) |

---

## How to Run It

You need [Node.js](https://nodejs.org/) 18 or newer.

```bash
cd Backend
npm install      # first time only
npm start
```

Then open **http://localhost:3000** — the server shows the website and answers the API on the same address.

You can still open the pages with VS Code Live Server; they will call the API at `http://localhost:3000`, so keep `npm start` running. If the server is not running, checkout and the account page show a clear "Can't reach the ShawarmHug server" message and nothing is lost from the cart.

To start with no data, replace the contents of `Backend/users.json` and `Backend/orders.json` with `[]`.

### Run the tests

```bash
cd Backend
npm test
```

16 automated tests cover sign up, log in, valid and invalid orders, tampered prices, repeated submissions, order history, restarts and a damaged data file. They use a temporary folder, so your saved data is not touched. See [`docs/TESTING.md`](docs/TESTING.md) for the full test results.

---

## API

All responses are JSON with `ok: true/false`. Errors also include a `message` (and `errors` per field for orders).

| Method | Endpoint | What it does |
|---|---|---|
| `POST` | `/users` | Sign up `{ name, email, phone?, password }` → `201 { user }`; `400` invalid input; `409` email already used |
| `POST` | `/users/login` | Log in `{ email, password }` → `200 { user }`; `401` wrong email or password |
| `GET` | `/users/:email/orders` | That customer's orders, newest first |
| `POST` | `/orders` | Place an order `{ name, phone, email, orderType, deliveryAddress, paymentMethod, items: [{ name, option, qty }] }` → `201 { order }`; `400 { errors }` |
| `GET` | `/orders` | All orders, newest first (restaurant view) |
| `GET` | `/orders/:orderNumber` | One order; `404` if not found |

## Pages

| Page | File | Script |
|---|---|---|
| Landing | `index.html` | `menu.js` |
| Menu | `menu.html` | `menu.js` |
| Cart | `cart.html` | `cart.js` |
| Checkout | `checkout.html` | `checkout.js` |
| Order Confirmation | `confirmation.html` | `confirmation.js` |
| Account | `account.html` | `account.js` |
| About / Contact | `about.html` | — |

User flow: **Home → Menu → Cart → Checkout → Confirmation**. The Account and About pages can be reached from the navigation bar on every page.

---

## Contributing

- Work on a branch and open a pull request into `main`. `@lr-sdolor` is the code owner and reviews PRs.
- Commit messages should follow Conventional Commits: `feat(scope): …`, `fix(scope): …`, `style(css): …`, `chore(assets): …`
- File and folder names are lowercase with hyphens (e.g. `cart-store.js`, `images/`)

---

## Known Issues / Next Up

- [ ] No real sessions or tokens yet: the logged-in user is kept in `localStorage`, and `GET /orders` / `GET /users/:email/orders` do not check who is asking
- [ ] Menu prices are duplicated in the HTML and `Backend/menu.js` (a `GET /menu` endpoint could remove this)
- [ ] No responsive layout yet (no media queries, and Bootstrap is not linked)
- [ ] Landing slider: duplicate `id="slogan-statement"`, slide 4 is titled "Signature Wrap" but shows the Nachos
- [ ] Drinks and Add-ons menu categories (in the design doc, not built yet)
- [ ] Map embed and social media links on the About page

## Roadmap

1. **Phase 1: Static frontend** ✅ All pages and the full order flow work in the browser
2. **Phase 2: Backend** (current) ✅ Express.js API with JSON-file storage, hashed passwords, server-calculated totals and order history. Next: menu and promotions endpoints, sessions
3. **Phase 3: React frontend** connected to the API
4. **Future:** live payment gateway (GCash / PayMaya), email/SMS notifications, real-time order tracking, admin dashboard

## Contributors
- Synen Dolor
- Brixter Colipano
