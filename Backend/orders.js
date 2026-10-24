const fs = require('fs')
const path = require('path')

const ORDERS_FILE = path.join(__dirname, 'orders.json')

// Safely reads all existing orders from orders.json
function getOrders() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf8')
      return []
    }
    const data = fs.readFileSync(ORDERS_FILE, 'utf8')
    return data.trim() ? JSON.parse(data) : []
  } catch (err) {
    console.error('⚠️ Warning: Failed to parse orders.json. Resetting file to [] to prevent server crash.', err.message)
    saveOrders([]) // Auto-reset invalid file
    return []
  }
}

// Safely writes orders array to orders.json
function saveOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8')
  } catch (err) {
    console.error('Error writing to orders.json:', err)
  }
}

// Creates a new order using the payload sent from checkout.js
function createOrder(orderData) {
  const orders = getOrders()

  const newOrder = {
    orderNumber: orderData.orderNumber || `SH-${Date.now()}`,
    name: (orderData.name || orderData.custName || '').trim(),
    phone: (orderData.phone || orderData.custPhone || '').trim(),
    email: (orderData.email || orderData.custEmail || '').trim().toLowerCase(),
    orderType: orderData.orderType || 'Delivery',
    deliveryAddress: (orderData.deliveryAddress || orderData.custAddress || 'N/A').trim(),
    custAddress: (orderData.custAddress || orderData.deliveryAddress || 'N/A').trim(),
    paymentMethod: orderData.paymentMethod || 'Cash on Delivery',
    items: Array.isArray(orderData.items) ? orderData.items : [],
    subtotal: Number(orderData.subtotal) || 0,
    deliveryFee: Number(orderData.deliveryFee) || 0,
    total: Number(orderData.total) || 0,
    orderStatus: orderData.orderStatus || 'Pending',
    createdAt: new Date().toISOString()
  }

  orders.unshift(newOrder)
  saveOrders(orders)
  return newOrder
}

module.exports = {
  getOrders,
  createOrder
}