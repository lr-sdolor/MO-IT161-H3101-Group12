const { readList, writeList } = require('./storage')

const FILE = 'users.json'

function getUsers() {
  return readList(FILE)
}

// Find user by email (case-insensitive)
function findUserByEmail(email) {
  if (!email) return null
  const target = String(email).trim().toLowerCase()
  return getUsers().find((u) => u.email && u.email.toLowerCase() === target) || null
}

// Save a new user to users.json
function addUser(newUser) {
  const users = getUsers()
  users.push(newUser)
  writeList(FILE, users)
  return newUser
}

// Removes the password hash before a user is sent back to the browser
function toPublicUser(user) {
  const { password, ...publicUser } = user
  return publicUser
}

module.exports = {
  getUsers,
  findUserByEmail,
  addUser,
  toPublicUser
}
