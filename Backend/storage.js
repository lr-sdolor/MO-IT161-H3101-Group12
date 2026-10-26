const fs = require('fs')
const path = require('path')

// Folder where users.json and orders.json are kept.
// Defaults to the Backend folder; the tests point it at a temporary folder.
function dataDir() {
  return process.env.DATA_DIR || __dirname
}

// Reads a JSON array from a file. Creates the file if it does not exist yet.
// If the file is damaged we throw an error instead of overwriting it,
// so saved users/orders are never lost by accident.
function readList(fileName) {
  const filePath = path.join(dataDir(), fileName)
  if (!fs.existsSync(filePath)) {
    writeList(fileName, [])
    return []
  }
  const raw = fs.readFileSync(filePath, 'utf8')
  if (!raw.trim()) return []
  const data = JSON.parse(raw)
  if (!Array.isArray(data)) throw new Error(`${fileName} does not contain a list`)
  return data
}

// Writes to a temporary file first and then renames it, so a crash in the
// middle of saving cannot leave a half-written JSON file behind.
function writeList(fileName, list) {
  const filePath = path.join(dataDir(), fileName)
  const tmpPath = filePath + '.tmp'
  fs.writeFileSync(tmpPath, JSON.stringify(list, null, 2), 'utf8')
  fs.renameSync(tmpPath, filePath)
}

module.exports = { readList, writeList }
