# ShawarmHug: Shawarma Restaurant Ordering Website

**MO-IT161 Web Systems and Technology · H3101 · Group 12**

ShawarmHug (Blessy: Shawarmhug) is a browser-based ordering website for a shawarma restaurant on Maginhawa St., Diliman, Quezon City. Customers can browse the menu, add items to a cart, check out for delivery or pickup, and create an account to see their order history.

**Current phase:** Phase 1, a static multi-page site built with HTML, CSS, and vanilla JavaScript. The full order flow works in the browser. Cart, order, and account data are saved in `localStorage` for now; the Express.js backend replaces this in a later phase. React comes later too.

See [`docs/Shawarma Store Technical Design Document.docx`](docs/) for the full design: site map, data model, and API.

---

## Features (Phase 1)

- **Landing page**: animated banner slider showing featured dishes, featured menu cards, and current promotions
- **Menu**: dish cards with size/option and quantity selectors, filtered by category (All, Shawarma, Rice Meals, Appetizers)
- **Cart**: edit quantities, remove items, or clear the cart; subtotal, delivery fee, and total update immediately. The item count badge in the navigation appears on every page
- **Checkout**: customer info, Delivery or Pickup (a ₱49 delivery fee is added for Delivery; Pickup is free), Cash on Delivery or Online Payment, with inline validation
- **Order confirmation**: order number (e.g. `SHW-2026-12345`), status, items, and totals
- **Account**: sign up, log in, and log out; a profile showing order history; checkout details filled in automatically for logged-in users
- **About / Contact**: store story, location, contact number, and opening hours

> **Note:** Accounts and payments are placeholders only. Passwords are stored in plain text in `localStorage`, and Online Payment is simulated: COD orders are marked *Confirmed* and online orders *Pending*. Do not use real passwords.

---

## Tech Stack

| Phase | Technology |
|---|---|
| Phase 1 (current) | HTML, CSS, vanilla JavaScript, `localStorage` |
| Planned | Bootstrap (responsive layout), React (frontend), Express.js REST API with JSON-file or SQLite storage (backend) |

---

## Project Structure

```
MO-IT161-H3101-Group12/
├── index.html            # Landing page: banner slider, featured menu, promotions
├── menu.html             # Full menu with category filters
├── cart.html             # Cart table and order summary
├── checkout.html         # Checkout form
├── confirmation.html     # Order confirmation
├── account.html          # Log in / sign up / profile and order history
├── about.html            # About, location, and opening hours
│
├── css/
│   ├── style.css         # Base page styles: body, navbar, logo, buttons
│   ├── general.css       # Shared section spacing, headings, text, lists, footer
│   ├── pages.css         # Menu cards and filters, cart, checkout, confirmation, account UI
│   └── slider.css        # Landing page banner slider animation
│
├── js/
│   ├── cart-store.js     # Shared data layer (cart, orders, users, session) — load first
│   ├── main.js           # Shared: cart badge and account link in the navbar
│   ├── menu.js           # Add to Cart and category filters (index + menu)
│   ├── cart.js           # Cart rendering and line-item edits
│   ├── checkout.js       # Order-type toggle, validation, and order submission
│   ├── confirmation.js   # Displays the last placed order
│   └── account.js        # Sign up, log in, profile, and order history
│
├── images/               # Logo and dish photos
├── docs/                 # Technical Design Document
└── .github/CODEOWNERS
```

### Script load order

Every page loads the shared scripts first, then its own page script:

```html
<script src="js/cart-store.js"></script>
<script src="js/main.js"></script>
<script src="js/cart.js"></script>   <!-- page-specific -->
```

`cart-store.js` provides the global `ShawarmHugStore` object, which every other script uses. When the backend arrives, only this file needs to switch from `localStorage` to API calls.

### Browser storage keys

| Key | Contents |
|---|---|
| `shawarmhug_cart` | Current cart lines `{ name, option, unitPrice, qty }` |
| `shawarmhug_orders` | All placed orders (newest first) |
| `shawarmhug_lastOrder` | The most recent order, read by the confirmation page |
| `shawarmhug_users` | Registered accounts |
| `shawarmhug_currentUser` | The logged-in user (name, email, phone) |

To reset the app, clear the site's data in your browser's developer tools (Application → Local Storage).

---

## How to Run It

No installs or build step needed. Pick one:

**Option A: VS Code Live Server (easiest)**
Install the "Live Server" extension → right-click `index.html` → "Open with Live Server."

**Option B: Terminal**
```bash
npx http-server .
```
Then open the local URL it prints.

---

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

- [ ] Stylesheet links use `Css/…` but the folder is `css/`. This breaks styling on case-sensitive hosts such as GitHub Pages or Linux
- [ ] No responsive layout yet (no media queries, and Bootstrap is not linked)
- [ ] Landing slider: duplicate `id="slogan-statement"`, slide 4 is titled "Signature Wrap" but shows the Nachos, and the hover-pause rule doesn't match the slider's class names
- [ ] Drinks and Add-ons menu categories (in the design doc, not built yet)
- [ ] Map embed and social media links on the About page

## Roadmap

1. **Phase 1: Static frontend** All pages and the full order flow work in the browser
2. **Phase 2: Backend:** Express.js REST API (`/api/menu`, `/api/orders`, `/api/auth/*`, `/api/users/:id/orders`) with JSON-file storage (SQLite as a fallback), hashed passwords, and totals calculated on the server
3. **Phase 3: React frontend** connected to the API
4. **Future:** live payment gateway (GCash / PayMaya), email/SMS notifications, real-time order tracking, admin dashboard

## Contributors
- Synen Dolor
- Brixter Colipano
