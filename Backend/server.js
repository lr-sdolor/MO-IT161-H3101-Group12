const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const cors = require('cors')

app.use(cors())
app.use(express.json())

const users = []

app.get('/users', (req, res) => {
  res.json(users)
})

// Registration Endpoint
app.post('/users', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    // Check if user already exists
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      return res.status(400).json({ ok: false, message: 'Email already registered.' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = { name, email, phone, password: hashedPassword }
    users.push(user)

    res.status(201).json({ ok: true, message: 'Account created successfully.' })
  } catch {
    res.status(500).json({ ok: false, message: 'Server error during registration.' })
  }
})

// Login Endpoint
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body
  const user = users.find(user => user.email === email)

  if (user == null) {
    return res.status(400).json({ ok: false, message: 'Cannot find user.' })
  }

  try {
    if (await bcrypt.compare(password, user.password)) {
      // Exclude password before sending back to frontend
      const { password, ...userWithoutPassword } = user
      res.json({ ok: true, user: userWithoutPassword })
    } else {
      res.status(401).json({ ok: false, message: 'Incorrect password.' })
    }
  } catch {
    res.status(500).json({ ok: false, message: 'Server error during login.' })
  }
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})