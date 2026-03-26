import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || process.env.EDUTECH_URL || ''
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

  const userId = (req.query.userId as string) || 'default'

  try {
    const db = (await getClient()).db('EDUTECH')
    const col = db.collection('users')

    if (req.method === 'GET') {
      const doc = await col.findOne({ userId })
      if (!doc) return res.status(200).json(null)
      const { _id, ...data } = doc
      void _id
      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
      const body = req.body
      await col.updateOne(
        { userId },
        { $set: { userId, ...body, updatedAt: new Date() } },
        { upsert: true }
      )
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('MongoDB error:', err)
    return res.status(500).json({ error: 'DB error' })
  }
}
