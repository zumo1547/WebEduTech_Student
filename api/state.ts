// api/state.ts
// Vercel Serverless Function — จัดการ Game State ต่อ user
// GET  /api/state?email=xxx  → โหลด state
// POST /api/state?email=xxx  → บันทึก state

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MongoClient } from 'mongodb'

const uri = process.env.EDUTECH_MONGODB_URI || ''
let client: MongoClient | null = null

async function getClient() {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
  }
  return client
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const email = req.query.email as string
  if (!email) return res.status(400).json({ error: 'missing email' })

  try {
    const db  = (await getClient()).db('EDUTECH')
    const col = db.collection('game_states')

    // ===== GET: โหลด state =====
    if (req.method === 'GET') {
      const doc = await col.findOne({ email })
      if (!doc) return res.status(200).json({ state: null })
      const { _id, email: _e, updatedAt: _u, ...state } = doc
      void _id; void _e; void _u
      return res.status(200).json({ state })
    }

    // ===== POST: บันทึก state =====
    if (req.method === 'POST') {
      const { state } = req.body
      if (!state) return res.status(400).json({ error: 'missing state' })

      await col.updateOne(
        { email },
        { $set: { email, ...state, updatedAt: new Date() } },
        { upsert: true }
      )
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'method not allowed' })

  } catch (err) {
    console.error('State DB Error:', err)
    client = null
    return res.status(500).json({ error: 'server error' })
  }
}
