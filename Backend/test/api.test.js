// Automated tests for the ShawarmHug backend.
// Run with:  npm test   (inside the Backend folder)
// The tests use a temporary data folder, so users.json and orders.json are not touched.

const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')

process.env.NODE_ENV = 'test'
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'shawarmhug-test-'))

const app = require('../server')

let server
let base

before(async () => {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})

after(() => {
  server.close()
  fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true })
})

async function call(method, url, body) {
  const res = await fetch(base + url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
  })
  return { status: res.status, data: await res.json() }
}

const validOrder = () => ({
  name: 'Juan Dela Cruz',
  phone: '0917 123 4567',
  email: 'Juan@Example.com',
  orderType: 'Delivery',
  deliveryAddress: '123 Maginhawa St., Diliman, QC',
  paymentMethod: 'Cash on Delivery',
  items: [
    { name: 'Signature Beef or Chicken Shawarma Wrap', option: 'Large', qty: 2 },
    { name: 'Shawarma Nachos (Beef or Chicken)', option: 'Personal', qty: 1 }
  ]
})

// ---------- Accounts ----------

test('sign up with valid details creates an account without returning the password', async () => {
  const r = await call('POST', '/users', { name: 'Ana Reyes', email: 'ANA@example.com', phone: '09171234567', password: 'secret123' })
  assert.equal(r.status, 201)
  assert.equal(r.data.ok, true)
  assert.equal(r.data.user.email, 'ana@example.com')
  assert.equal(r.data.user.password, undefined)

  const saved = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, 'users.json'), 'utf8'))
  assert.equal(saved.length, 1)
  assert.notEqual(saved[0].password, 'secret123', 'password must be hashed')
  assert.match(saved[0].password, /^\$2[aby]\$/)
})

test('signing up twice with the same email (any letter case) is rejected', async () => {
  const r = await call('POST', '/users', { name: 'Ana Again', email: 'ana@EXAMPLE.com', password: 'another1' })
  assert.equal(r.status, 409)
  assert.match(r.data.message, /already exists/)
})

test('sign up rejects invalid input with a clear message', async () => {
  const cases = [
    [{ email: 'a@b.com', password: 'secret1' }, /Name is required/],
    [{ name: 'X', email: 'not-an-email', password: 'secret1' }, /valid email/],
    [{ name: 'X', email: 'x@b.com', password: '123' }, /at least 6/],
    [{ name: 'X', email: 'x@b.com', phone: 'abc', password: 'secret1' }, /contact number/]
  ]
  for (const [body, message] of cases) {
    const r = await call('POST', '/users', body)
    assert.equal(r.status, 400)
    assert.match(r.data.message, message)
  }
})

test('log in works with the right password and fails with the wrong one', async () => {
  const good = await call('POST', '/users/login', { email: ' Ana@Example.com ', password: 'secret123' })
  assert.equal(good.status, 200)
  assert.equal(good.data.user.name, 'Ana Reyes')
  assert.equal(good.data.user.password, undefined)

  const wrong = await call('POST', '/users/login', { email: 'ana@example.com', password: 'nope123' })
  assert.equal(wrong.status, 401)
  const unknown = await call('POST', '/users/login', { email: 'ghost@example.com', password: 'nope123' })
  assert.equal(unknown.status, 401)
  assert.equal(wrong.data.message, unknown.data.message, 'same message so emails cannot be guessed')

  const empty = await call('POST', '/users/login', {})
  assert.equal(empty.status, 400)
})

test('the list of all users is no longer exposed', async () => {
  const r = await call('GET', '/users')
  assert.equal(r.status, 404)
})

// ---------- Orders ----------

test('placing a valid order saves it with server-calculated totals', async () => {
  const r = await call('POST', '/orders', validOrder())
  assert.equal(r.status, 201)
  const o = r.data.order
  assert.match(o.orderNumber, /^SHW-\d{4}-\d{5}$/)
  assert.equal(o.subtotal, 120 * 2 + 140)
  assert.equal(o.deliveryFee, 49)
  assert.equal(o.total, 120 * 2 + 140 + 49)
  assert.equal(o.email, 'juan@example.com')
  assert.equal(o.orderStatus, 'Confirmed', 'COD orders are confirmed')
})

test('prices and totals sent by the browser are ignored', async () => {
  const body = validOrder()
  body.items = [{ name: 'Signature Beef or Chicken Shawarma Wrap', option: 'Regular', qty: 1, unitPrice: 1 }]
  body.subtotal = 1
  body.total = 1
  const r = await call('POST', '/orders', body)
  assert.equal(r.status, 201)
  assert.equal(r.data.order.items[0].unitPrice, 85)
  assert.equal(r.data.order.total, 85 + 49)
})

test('pickup orders have no delivery fee or address, online payment is pending', async () => {
  const body = { ...validOrder(), orderType: 'Pickup', deliveryAddress: 'should be dropped', paymentMethod: 'Online Payment' }
  const r = await call('POST', '/orders', body)
  assert.equal(r.status, 201)
  assert.equal(r.data.order.deliveryFee, 0)
  assert.equal(r.data.order.deliveryAddress, '')
  assert.equal(r.data.order.orderStatus, 'Pending')
})

test('invalid orders are rejected with a message and are not saved', async () => {
  const before = (await call('GET', '/orders')).data.orders.length
  const bad = [
    [{ name: '' }, 'name'],
    [{ phone: 'call me' }, 'phone'],
    [{ email: 'juan@' }, 'email'],
    [{ orderType: 'Drone' }, 'orderType'],
    [{ deliveryAddress: '' }, 'deliveryAddress'],
    [{ paymentMethod: 'Bitcoin' }, 'paymentMethod'],
    [{ items: [] }, 'items'],
    [{ items: 'abc' }, 'items'],
    [{ items: [{ name: 'Free Lunch', option: 'Large', qty: 1 }] }, 'items'],
    [{ items: [{ name: 'Signature Beef or Chicken Shawarma Wrap', option: 'Huge', qty: 1 }] }, 'items'],
    [{ items: [{ name: 'Signature Beef or Chicken Shawarma Wrap', option: 'Regular', qty: 0 }] }, 'items'],
    [{ items: [{ name: 'Signature Beef or Chicken Shawarma Wrap', option: 'Regular', qty: 1.5 }] }, 'items'],
    [{ items: [{ name: 'Signature Beef or Chicken Shawarma Wrap', option: 'Regular', qty: -3 }] }, 'items']
  ]
  for (const [change, field] of bad) {
    const r = await call('POST', '/orders', { ...validOrder(), ...change })
    assert.equal(r.status, 400, `expected 400 for ${JSON.stringify(change)}`)
    assert.ok(r.data.errors[field], `expected an error for ${field}`)
    assert.ok(r.data.message.length > 0)
  }
  const afterCount = (await call('GET', '/orders')).data.orders.length
  assert.equal(afterCount, before)
})

test('broken JSON gets a JSON error instead of crashing', async () => {
  const r = await call('POST', '/orders', '{"name": ')
  assert.equal(r.status, 400)
  assert.match(r.data.message, /invalid JSON/)
})

test('repeated submissions each get their own unique order number', async () => {
  const results = await Promise.all(Array.from({ length: 10 }, () => call('POST', '/orders', validOrder())))
  const numbers = results.map((r) => r.data.order.orderNumber)
  assert.equal(new Set(numbers).size, 10)
})

test('an order can be looked up by its number, unknown numbers return 404', async () => {
  const created = (await call('POST', '/orders', validOrder())).data.order
  const found = await call('GET', `/orders/${created.orderNumber}`)
  assert.equal(found.status, 200)
  assert.equal(found.data.order.total, created.total)
  const missing = await call('GET', '/orders/SHW-0000-00000')
  assert.equal(missing.status, 404)
})

test('order history returns only that customer\'s orders, newest first', async () => {
  await call('POST', '/orders', { ...validOrder(), email: 'someone.else@example.com' })
  const r = await call('GET', '/users/JUAN@example.com/orders')
  assert.equal(r.status, 200)
  assert.ok(r.data.orders.length > 0)
  assert.ok(r.data.orders.every((o) => o.email === 'juan@example.com'))
  const times = r.data.orders.map((o) => o.createdAt)
  assert.deepEqual(times, [...times].sort().reverse())
})

test('saved data is still there after the server restarts', async () => {
  const count = (await call('GET', '/orders')).data.orders.length
  // Load a fresh copy of the server modules, like restarting the server
  for (const key of Object.keys(require.cache)) {
    if (key.includes(path.join('Backend', '')) && !key.includes('node_modules') && !key.includes('test')) delete require.cache[key]
  }
  const freshApp = require('../server')
  const s2 = freshApp.listen(0)
  await new Promise((resolve) => s2.once('listening', resolve))
  const res = await fetch(`http://127.0.0.1:${s2.address().port}/orders`)
  const data = await res.json()
  s2.close()
  assert.equal(data.orders.length, count)
  const login = await call('POST', '/users/login', { email: 'ana@example.com', password: 'secret123' })
  assert.equal(login.status, 200)
})

test('a damaged orders.json is not wiped', async () => {
  const file = path.join(process.env.DATA_DIR, 'orders.json')
  const original = fs.readFileSync(file, 'utf8')
  fs.writeFileSync(file, original.slice(0, 50)) // simulate a damaged file
  const r = await call('POST', '/orders', validOrder())
  assert.equal(r.status, 500)
  assert.match(r.data.message, /went wrong/)
  assert.equal(fs.readFileSync(file, 'utf8'), original.slice(0, 50), 'file must not be overwritten')
  fs.writeFileSync(file, original)
})

test('the website pages are served by the same server', async () => {
  const res = await fetch(base + '/checkout.html')
  assert.equal(res.status, 200)
  assert.match(await res.text(), /checkout-form/)
})
