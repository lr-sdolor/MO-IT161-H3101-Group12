const express = require('express')
const bcrypt = require('bcrypt')
const cors = require('cors')

const { getUsers, findUserByEmail, addUser } = require('./users')
const { getOrders, createOrder } = require('./orders') // <-- Imported orders module

const app = express()

// --- CORS Configuration ---
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

app.use(express.json())

// Get All Users (Stripped of Passwords)
app.get('/users', (req, res) => {
  const safeUsers = getUsers().map(({ password, ...user }) => user)
  return res.status(200).json(safeUsers)
})

// Registration Endpoint
app.post('/users', async (req, res) => {
  console.log('--> REGISTER REQUEST RECEIVED:', req.body)

  try {
    const { name, email, phone, password } = req.body

    // --- Backend Input Validations ---
    if (!name || name.trim() === '') {
      return res.status(400).json({ ok: false, message: 'Name is required.' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ ok: false, message: 'Enter a valid email address.' })
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ ok: false, message: 'Password must be at least 6 characters.' })
    }

    // Check duplicate email
    const existingUser = findUserByEmail(email.trim().toLowerCase())
    if (existingUser) {
      return res.status(400).json({ ok: false, message: 'Email is already registered.' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      password: hashedPassword
    }

    addUser(newUser)

    return res.status(201).json({ ok: true, message: 'Account created successfully.' })
  } catch (err) {
    console.error('Registration route error:', err)
    return res.status(500).json({ ok: false, message: 'Server error during registration.' })
  }
})

// Login Endpoint
app.post('/users/login', async (req, res) => {
  console.log('--> LOGIN REQUEST RECEIVED:', req.body)

  try {
    const { email, password } = req.body

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email and password are required.' })
    }

    // Check if user exists
    const user = findUserByEmail(email.trim().toLowerCase())
    if (!user) {
      return res.status(400).json({ ok: false, message: 'Invalid email or password.' })
    }

    // Verify password match
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({ ok: false, message: 'Invalid email or password.' })
    }

    // Omit password hash from response payload
    const { password: _, ...userWithoutPassword } = user

    // Return explicit 200 OK status with JSON body
    return res.status(200).json({ ok: true, user: userWithoutPassword })
  } catch (err) {
    console.error('Login route error:', err)
    return res.status(500).json({ ok: false, message: 'Server error during login.' })
  }
})

// --- Orders Endpoints ---

// Get All Orders
app.get('/orders', (req, res) => {
  try {
    const orders = getOrders()
    return res.status(200).json({ ok: true, orders })
  } catch (err) {
    console.error('Fetch orders error:', err)
    return res.status(500).json({ ok: false, message: 'Server error fetching orders.' })
  }
})

// Create Order Endpoint (Receives payload from checkout.js)
app.post('/orders', (req, res) => {
  console.log('--> ORDER SUBMISSION RECEIVED:', req.body)

  try {
    const orderData = req.body

    // Input Validations
    if (!orderData.name || !orderData.phone) {
      return res.status(400).json({ ok: false, message: 'Name and contact phone are required.' })
    }

    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ ok: false, message: 'Cart items cannot be empty.' })
    }

    // Save order via refined orders.js module
    const createdOrder = createOrder(orderData)

    return res.status(201).json({
      ok: true,
      message: 'Order placed successfully.',
      order: createdOrder
    })
  } catch (err) {
    console.error('Create order route error:', err)
    return res.status(500).json({ ok: false, message: 'Server error while processing order.' })
  }
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})