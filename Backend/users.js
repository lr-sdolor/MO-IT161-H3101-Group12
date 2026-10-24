const fs = require('fs')
const path = require('path')

const FILE_PATH = path.join(__dirname, 'users.json')

// Helper to safely read users from users.json
function getUsers() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      // Create empty file if it doesn't exist
      fs.writeFileSync(FILE_PATH, JSON.stringify([]), 'utf-8')
      return []
    }
    const data = fs.readFileSync(FILE_PATH, 'utf-8')
    return JSON.parse(data || '[]')
  } catch (err) {
    console.error('Error reading users.json:', err)
    return []
  }
}

// Find user by email (case-insensitive)
function findUserByEmail(email) {
  const users = getUsers()
  if (!email) return null
  return users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase()) || null
}

// Save a new user to users.json
function addUser(newUser) {
  const users = getUsers()
  users.push(newUser)
  fs.writeFileSync(FILE_PATH, JSON.stringify(users, null, 2), 'utf-8')
}

module.exports = {
  getUsers,
  findUserByEmail,
  addUser
}