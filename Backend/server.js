const path = require('path')
const express = require('express')
const bcrypt = require('bcrypt')
const cors = require('cors')

const { findUserByEmail, addUser, toPublicUser } = require('./users')
const { getOrders, findOrder, getOrdersByEmail, validateOrder, createOrder } = require('./orders')

const PORT = process.env.PORT || 3000
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/

const app = express()

// --- Middleware ---
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
  })
)
app.use(express.json({ limit: '100kb' }))

// Short request log. Request bodies are NOT printed because they contain passwords.
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') console.log(`${req.method} ${req.path}`)
  next()
})

// Serve the website itself, so `npm start` runs the frontend and the API together
// at http://localhost:3000
app.use(express.static(path.join(__dirname, '..', 'frontend')))

// --- Accounts ---

// Registration
app.post('/users', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!name) {
    return res.status(400).json({ ok: false, field: 'name', message: 'Name is required.' })
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ ok: false, field: 'email', message: 'Enter a valid email address.' })
  }
  if (phone && !PHONE_PATTERN.test(phone)) {
    return res.status(400).json({ ok: false, field: 'phone', message: 'Enter a valid contact number.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ ok: false, field: 'password', message: 'Password must be at least 6 characters.' })
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ ok: false, field: 'email', message: 'An account with that email already exists.' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = addUser({ name, email, phone, password: hashedPassword, createdAt: new Date().toISOString() })

  return res.status(201).json({ ok: true, message: 'Account created successfully.', user: toPublicUser(user) })
})

// Login
app.post('/users/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: 'Email and password are required.' })
  }

  const user = findUserByEmail(email)
  const isPasswordValid = user ? await bcrypt.compare(password, user.password) : false
  if (!isPasswordValid) {
    // Same message for "no account" and "wrong password" so emails can't be guessed
    return res.status(401).json({ ok: false, message: 'Incorrect email or password.' })
  }

  return res.status(200).json({ ok: true, user: toPublicUser(user) })
})

// Order history for one customer (used by the Account page)
app.get('/users/:email/orders', (req, res) => {
  const email = req.params.email.trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ ok: false, message: 'Enter a valid email address.' })
  }
  return res.status(200).json({ ok: true, orders: getOrdersByEmail(email) })
})

// --- Orders ---

// All orders, newest first (restaurant view)
app.get('/orders', (req, res) => {
  return res.status(200).json({ ok: true, orders: getOrders() })
})

// One order by its order number
app.get('/orders/:orderNumber', (req, res) => {
  const order = findOrder(req.params.orderNumber)
  if (!order) {
    return res.status(404).json({ ok: false, message: 'Order not found.' })
  }
  return res.status(200).json({ ok: true, order })
})

// Place an order (sent by checkout.js).
// The server checks every field and recalculates prices and totals itself.
app.post('/orders', (req, res) => {
  const { errors, order } = validateOrder(req.body)
  if (errors) {
    const firstMessage = Object.values(errors)[0]
    return res.status(400).json({ ok: false, message: firstMessage, errors })
  }

  const createdOrder = createOrder(order)
  return res.status(201).json({ ok: true, message: 'Order placed successfully.', order: createdOrder })
})

// --- Errors ---

// Unknown API route
app.use((req, res) => {
  res.status(404).json({ ok: false, message: 'Not found.' })
})

// Bad JSON or any unexpected error: always answer with JSON so the frontend can show a message
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, message: 'The request could not be read (invalid JSON).' })
  }
  console.error('Server error:', err)
  return res.status(500).json({ ok: false, message: 'Something went wrong on the server. Please try again.' })
})

// Start the server only when this file is run directly (not when the tests import it)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ShawarmHug server running at http://localhost:${PORT}`)
  })
}

module.exports = app
