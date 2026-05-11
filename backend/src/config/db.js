import mongoose from 'mongoose'

mongoose.set('strictQuery', true)

const DEFAULT_DB = 'odoocrm'

/**
 * If the URI doesn't include an explicit database name in its path, inject
 * `DEFAULT_DB`. Without this, Mongoose silently connects to a database literally
 * named "test" — confusing and easy to miss.
 */
function ensureDbName(uri) {
  try {
    // mongodb+srv URIs may have query strings; URL handles both shapes
    const u = new URL(uri)
    const path = u.pathname.replace(/^\//, '')   // '' or 'mydb'
    if (!path) {
      u.pathname = `/${DEFAULT_DB}`
      return { uri: u.toString(), dbName: DEFAULT_DB, injected: true }
    }
    return { uri, dbName: path, injected: false }
  } catch {
    // If it's not a parseable URL, hand it back unchanged and let Mongoose error out
    return { uri, dbName: null, injected: false }
  }
}

export async function connectDb() {
  const raw = process.env.MONGODB_URI
  if (!raw) {
    console.error('\n[fatal] MONGODB_URI is not set.')
    console.error('  Create a .env file at backend/.env (see .env.example) with:')
    console.error('  MONGODB_URI=mongodb://127.0.0.1:27017/absolute_crm\n')
    process.exit(1)
  }

  const { uri, dbName, injected } = ensureDbName(raw)
  if (injected) {
    console.warn(`[mongo] no database name in URI — defaulting to "${dbName}"`)
  }

  mongoose.connection.on('error',        (e) => console.error('[mongo] connection error:', e.message))
  mongoose.connection.on('disconnected', () => console.warn ('[mongo] disconnected'))

  // Retry briefly — Atlas SRV lookups + initial handshake can be flaky.
  const MAX_ATTEMPTS = 3
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 })
      console.log(`[mongo] connected to "${mongoose.connection.name}"`)
      return
    } catch (err) {
      const isLast = attempt === MAX_ATTEMPTS
      console.error(`[mongo] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err.message.split('\n')[0]}`)
      if (isLast) {
        console.error('\n[fatal] could not connect to MongoDB after retries.')
        if (/whitelist|IP address|ECONNREFUSED|ENOTFOUND|querySrv/i.test(err.message)) {
          console.error('  Likely cause: your current IP isn\'t allowed by MongoDB Atlas.')
          console.error('  Atlas → Network Access → Add IP Address → Allow Access From Anywhere (0.0.0.0/0) for dev.')
        }
        console.error('  Double-check MONGODB_URI in backend/.env and that the cluster is reachable.\n')
        process.exit(1)
      }
      await new Promise(r => setTimeout(r, 2000))
    }
  }
}

export async function disconnectDb() {
  await mongoose.disconnect()
}
