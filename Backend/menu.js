// Server-side copy of the menu prices.
// The server uses these prices (not the prices sent by the browser) to
// calculate every order total, so totals cannot be changed by editing the page.
// Keep this in sync with the options in frontend/menu.html and frontend/index.html.

const MENU = {
  'Signature Beef or Chicken Shawarma Wrap': {
    Regular: 85,
    Large: 120,
    'Buy 2': 160,
    'Buy 3': 235
  },
  'Signature Beef or Chicken Shawarma Rice': {
    'Regular Rice': 99,
    'Garlic Butter Rice': 115
  },
  'Shawarma Nachos (Beef or Chicken)': {
    Personal: 140,
    'Party Tray': 380
  }
}

const DELIVERY_FEE = 49

// Returns the price for an item + option, or null if it is not on the menu
function getPrice(name, option) {
  const item = MENU[name]
  if (!item || !Object.prototype.hasOwnProperty.call(item, option)) return null
  return item[option]
}

module.exports = { MENU, DELIVERY_FEE, getPrice }
