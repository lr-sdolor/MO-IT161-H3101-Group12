const { readList, writeList } = require('./storage')
const { DELIVERY_FEE, getPrice } = require('./menu')

const FILE = 'orders.json'

const ORDER_TYPES = ['Delivery', 'Pickup']
const PAYMENT_METHODS = ['Cash on Delivery', 'Online Payment']
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/
const MAX_QTY = 99
const MAX_LINES = 30

function getOrders() {
  return readList(FILE)
}

function findOrder(orderNumber) {
  return getOrders().find((o) => o.orderNumber === orderNumber) || null
}

function getOrdersByEmail(email) {
  const target = String(email || '').trim().toLowerCase()
  if (!target) return []
  return getOrders().filter((o) => (o.email || '').toLowerCase() === target)
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

// Checks the order sent by checkout.js.
// Returns { errors } when something is wrong, or { order } with the cleaned
// values and totals calculated from the server's own menu prices.
function validateOrder(body) {
  const errors = {}
  const data = body && typeof body === 'object' ? body : {}

  const name = text(data.name)
  const phone = text(data.phone)
  const email = text(data.email).toLowerCase()
  const orderType = text(data.orderType)
  const paymentMethod = text(data.paymentMethod)
  const deliveryAddress = text(data.deliveryAddress)

  if (!name) errors.name = 'Name is required.'
  else if (name.length > 100) errors.name = 'Name is too long.'

  if (!phone) errors.phone = 'Contact number is required.'
  else if (!PHONE_PATTERN.test(phone)) errors.phone = 'Enter a valid contact number.'

  if (!email) errors.email = 'Email is required.'
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.'

  if (!ORDER_TYPES.includes(orderType)) errors.orderType = 'Choose Delivery or Pickup.'
  if (orderType === 'Delivery' && !deliveryAddress) {
    errors.deliveryAddress = 'Address is required for delivery orders.'
  }

  if (!PAYMENT_METHODS.includes(paymentMethod)) errors.paymentMethod = 'Select a payment method.'

  // Items: must be a non-empty list of known menu items with a whole-number quantity
  const items = []
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.items = 'Your cart is empty.'
  } else if (data.items.length > MAX_LINES) {
    errors.items = 'Too many items in one order.'
  } else {
    for (const line of data.items) {
      const itemName = text(line && line.name)
      const option = text(line && line.option)
      const qty = Number(line && line.qty)
      const unitPrice = getPrice(itemName, option)

      if (unitPrice === null) {
        errors.items = `"${itemName || 'Unknown item'}${option ? ' (' + option + ')' : ''}" is not on the menu. Please remove it from your cart.`
        break
      }
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
        errors.items = `Quantity for ${itemName} must be a whole number from 1 to ${MAX_QTY}.`
        break
      }
      items.push({ name: itemName, option, unitPrice, qty, lineTotal: unitPrice * qty })
    }
  }

  if (Object.keys(errors).length > 0) return { errors }

  const subtotal = items.reduce((sum, line) => sum + line.lineTotal, 0)
  const deliveryFee = orderType === 'Delivery' ? DELIVERY_FEE : 0

  return {
    order: {
      name,
      phone,
      email,
      orderType,
      deliveryAddress: orderType === 'Delivery' ? deliveryAddress : '',
      paymentMethod,
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee
    }
  }
}

// Order numbers look like SHW-2026-12345 and are checked to be unique
function generateOrderNumber(existingOrders) {
  const year = new Date().getFullYear()
  const used = new Set(existingOrders.map((o) => o.orderNumber))
  let orderNumber
  do {
    orderNumber = `SHW-${year}-${Math.floor(10000 + Math.random() * 90000)}`
  } while (used.has(orderNumber))
  return orderNumber
}

// Saves a validated order (from validateOrder) and returns the stored copy
function createOrder(validOrder) {
  const orders = getOrders()

  const newOrder = {
    orderNumber: generateOrderNumber(orders),
    ...validOrder,
    // Online Payment is only simulated, so those orders wait for payment
    orderStatus: validOrder.paymentMethod === 'Cash on Delivery' ? 'Confirmed' : 'Pending',
    createdAt: new Date().toISOString()
  }

  orders.unshift(newOrder)
  writeList(FILE, orders)
  return newOrder
}

module.exports = {
  getOrders,
  findOrder,
  getOrdersByEmail,
  validateOrder,
  createOrder
}
