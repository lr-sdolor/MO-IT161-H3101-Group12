# ShawarmHug: Backend Feature Testing (Milestone 2)

**Feature tested:** online ordering backed by the Express.js server. Checkout sends the order to the server, which checks it, calculates the totals, saves it in `orders.json` and returns an order number. Sign up and log in also go through the server, and order history is loaded from it.

**How we tested:**
- **Automated API tests:** `cd Backend && npm test` runs 16 tests with Node's built-in test runner, using a temporary data folder.
- **Manual browser walkthrough:** the full order flow, tried both through `http://localhost:3000` (`npm start`) and through Live Server on another port.

---

## 1. Problems found while reviewing the Homework 7 version

| # | What we tried | What happened | Fix |
|---|---|---|---|
| 1 | Sent an order with a ₱100 item and `total: 1` | Saved with a total of ₱1. The server trusted the browser's prices | Server keeps its own price list (`Backend/menu.js`) and recalculates subtotal, delivery fee and total |
| 2 | Sent `items: "abc"` | Accepted and saved as an order with no items | Items must be a list of real menu items with whole-number quantities from 1 to 99 |
| 3 | Sent an invalid phone, email, order type or payment method | Accepted | Every field is checked; errors come back per field and show under the matching input |
| 4 | Placed a Cash on Delivery order | Confirmation said "Online Payment" and status stayed Pending (the code checked for `"COD"` but the form sends `"Cash on Delivery"`) | Status is set by the server (COD = Confirmed, Online = Pending); the page shows the saved payment method |
| 5 | Placed an order with the server stopped | The site showed a confirmation anyway, but the restaurant never got the order | Checkout now says "Can't reach the ShawarmHug server… Your order has not been placed yet", keeps the cart and lets the user retry |
| 6 | Signed up / logged in and read the server console | The plain-text password was printed in the log | Only the method and path are logged now |
| 7 | Opened `GET /users` | Listed every customer's name, email and phone | Route removed |
| 8 | Logged in on a second browser | Order history was empty (it was read from `localStorage`) | New `GET /users/:email/orders`; the Account page loads history from the server |
| 9 | Damaged `orders.json` | The server reset the file to `[]`, deleting all orders | The file is never overwritten when it can't be read; saves go to a temp file first, then rename |
| 10 | Opened a Pickup order's confirmation | The "Address" row still showed (`.detail-row { display: flex }` overrode `hidden`) | Added `[hidden] { display: none !important; }` |
| 11 | Opened the site on Linux / served by Express | Pages had no styling (`Css/` vs `css/` folder) | Fixed the paths to `css/` |
| 12 | Logged out after signing up | The page stayed on the Sign Up tab with the Log In form hidden | Logging out always returns to the Log In tab |

---

## 2. Automated test results (`npm test`): 16 passed, 0 failed

| Scenario | Input | Expected | Result |
|---|---|---|---|
| Sign up, valid | name, email in capitals, phone, password | 201, email saved in lowercase, password hashed, no password in response | ✅ Pass |
| Sign up, same email twice (different letter case) | `ana@EXAMPLE.com` | 409 "already exists" | ✅ Pass |
| Sign up, invalid | missing name / bad email / 3-character password / letters as phone | 400 with a clear message | ✅ Pass |
| Log in | right password / wrong password / unknown email / empty | 200 / 401 / 401 (same message) / 400 | ✅ Pass |
| List of users | `GET /users` | 404 (no longer exposed) | ✅ Pass |
| Valid delivery order, COD | 2× Large Wrap + 1 Nachos | subtotal ₱380, fee ₱49, total ₱429, status Confirmed, `SHW-YYYY-NNNNN` | ✅ Pass |
| Tampered price | `unitPrice: 1, total: 1` | server uses ₱85 and total ₱134 | ✅ Pass |
| Pickup + Online Payment | pickup with an address typed in | fee ₱0, address dropped, status Pending | ✅ Pass |
| Invalid orders (13 cases) | blank name, bad phone/email, unknown order type, delivery with no address, unknown payment, empty / non-list items, unknown item, unknown size, qty 0, 1.5, −3 | 400 with a per-field error; nothing saved | ✅ Pass |
| Broken JSON | `{"name": ` | 400 JSON error, server keeps running | ✅ Pass |
| Repeated submissions | 10 identical orders at once | 10 saved orders, all with different order numbers | ✅ Pass |
| Look up order | existing / unknown number | 200 / 404 | ✅ Pass |
| Order history | two customers' orders | only that customer's, newest first | ✅ Pass |
| Server restart | reload the server modules | same orders and accounts still there, login still works | ✅ Pass |
| Damaged `orders.json` | cut the file in half | 500 "Something went wrong", file not overwritten | ✅ Pass |
| Website served by Express | `GET /checkout.html` | 200 | ✅ Pass |

## 3. Browser walkthrough results

| Steps | Result |
|---|---|
| Menu → add 2× Large Wrap and 1 Nachos | Cart badge shows 3 ✅ |
| Change a price to ₱1 in the browser's storage, then check out | Server total ₱429 (correct prices) ✅ |
| Click Place Order with an empty form | Four inline errors (name, contact number, email, address) ✅ |
| Fill in the form, **double-click** Place Order | One order saved, confirmation `SHW-2026-…`, Confirmed, Cash on Delivery, ₱429.00 ✅ |
| Sign up with a 3-character password | "Password must be at least 6 characters." ✅ |
| Sign up properly | Profile shows; nav shows first name; order history shows the earlier order (matched by email) ✅ |
| Log out, log in with the wrong password | "Incorrect email or password." ✅ |
| Log in again | Profile shows ✅ |
| Pickup + Online Payment from Live Server (port 5500 → API on 3000) | Pending, Online Payment, ₱99.00, address row hidden ✅ |
| **Stop the server**, try to place an order | Red message "Can't reach the ShawarmHug server… Your order has not been placed yet."; still on checkout; button enabled again; cart kept ✅ |
| **Restart the server**, click Place Order again | Order placed ✅ |
| Log in after the restart | Order history shows all 3 orders ✅ |
| Server console during all of the above | No passwords printed ✅ |
| Browser console | No JavaScript errors ✅ |

## 4. Known limitations (kept in scope for later)

- There are no real sessions or tokens yet. The logged-in user is remembered in `localStorage`, and the order-history route does not check who is asking.
- Menu prices exist both in the HTML and in `Backend/menu.js`, so they must be updated together.
- Online Payment is simulated; there is no live payment gateway.
