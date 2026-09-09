# Shawarma Website

A website for a shawarma restaurant: customers can browse the menu, add items to a cart, and check out.

**Current phase:** Static site (HTML, CSS, JavaScript). Backend and React come in later phases.

---

## Tech Stack (Phase 1)

- HTML
- CSS + Bootstrap
- JavaScript

---

## Project Structure

```
shawarma-website/
├── index.html          # Landing page
├── menu.html
├── cart.html
├── checkout.html
├── confirmation.html
├── account.html
├── about.html
│
├── css/
│   ├── style.css        # shared styles
│   └── ...               # page-specific styles
│
├── js/
│   ├── main.js           # shared logic
│   └── ...                # page-specific logic
│
├── images/
```

Each page links its own CSS/JS:
```html
<link rel="stylesheet" href="css/style.css">
<script src="js/main.js"></script>
```

---

## How to Run It

No installs needed. Pick one:

**Option A — VS Code Live Server (easiest)**
Install the "Live Server" extension → right-click `index.html` → "Open with Live Server."

**Option B — Terminal**
```bash
npx http-server .
```
Then open the local URL it prints.

---

## Pages

| Page | File |
|---|---|
| Landing | `index.html` |
| Menu | `menu.html` |
| Cart | `cart.html` |
| Checkout | `checkout.html` |
| Order Confirmation | `confirmation.html` |
| Account | `account.html` |
| About / Contact | `about.html` |
