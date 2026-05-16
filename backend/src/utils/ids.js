import Counter from '../models/Counter.js'

// First-issued ID per collection. Counters are seeded to (initial - 1) so the
// first $inc returns `initial`.
const CONFIG = {
  leads:          { prefix: 'L-',   initial: 1001 },
  projects:       { prefix: 'P-',   initial: 2001 },
  proposals:      { prefix: 'PR-',  initial: 3001 },
  invoices:       { prefix: 'INV-', initial: 4001 },
  quotations:     { prefix: 'Q-',   initial: 5001 },
  calendarEvents: { prefix: 'E-',   initial: 1 },
  documents:      { prefix: 'D-',   initial: 1 },
  team:           { prefix: 'u',    initial: 1 },
  notifications:  { prefix: 'N',    initial: 1 },
  users:          { prefix: 'usr-', initial: 1 },
}

/**
 * Initialise counters on app boot. If a counter already exists (either from
 * a previous boot or from the seed script), the value is left untouched.
 */
export async function initCounters() {
  for (const [name, { initial }] of Object.entries(CONFIG)) {
    await Counter.updateOne(
      { _id: name },
      { $setOnInsert: { seq: initial - 1 } },
      { upsert: true }
    )
  }
}

/** Reseed counters to the max ID currently present in each collection. */
export async function syncCountersTo(maxByName) {
  for (const [name, max] of Object.entries(maxByName)) {
    if (!CONFIG[name]) continue
    await Counter.updateOne(
      { _id: name },
      { $set: { seq: Math.max(max, CONFIG[name].initial - 1) } },
      { upsert: true }
    )
  }
}

/**
 * Atomically allocate the next ID for the named collection.
 * Self-healing: if the Counter doc has been wiped (or never existed),
 * the first allocation returns `cfg.initial` instead of 1.
 */
export async function nextId(name) {
  const cfg = CONFIG[name]
  if (!cfg) throw new Error(`Unknown counter "${name}"`)
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    [{
      $set: {
        seq: {
          $cond: {
            if:   { $eq: [{ $type: '$seq' }, 'missing'] },
            then: cfg.initial,
            else: { $add: ['$seq', 1] },
          }
        }
      }
    }],
    { new: true, upsert: true }
  )
  return `${cfg.prefix}${doc.seq}`
}

/** Generate a short sub-resource ID (task t1, message m1, etc.). */
export function nextSubId(list, prefix = 't') {
  const max = list.reduce((m, row) => {
    const n = parseInt(String(row.id || '').replace(prefix, ''), 10)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `${prefix}${max + 1}`
}
