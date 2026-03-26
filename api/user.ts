import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MongoClient } from 'mongodb'
import crypto from 'crypto'

const uri = process.env.EDUTECH_MONGODB_URI || ''
let client: MongoClient | null = null

async function getClient() {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
  }
  return client
}

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })

  try {
    const db = (await getClient()).db('EDUTECH')
    const col = db.collection('accounts')

    const { email, password, action } = req.body

    if (!email || !password)
      return res.status(400).json({ error: 'กรุณากรอก email และ password' })

    // ตรวจสอบรูปแบบ email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'รูปแบบ email ไม่ถูกต้อง' })

    if (password.length < 6)
      return res.status(400).json({ error: 'password ต้องมีอย่างน้อย 6 ตัวอักษร' })

    const hashed = hashPassword(password)

    // ===== REGISTER =====
    if (action === 'register') {
      const exist = await col.findOne({ email })
      if (exist)
        return res.status(400).json({ error: 'email นี้ถูกใช้งานแล้ว' })

      await col.insertOne({
        email,
        password: hashed,
        createdAt: new Date()
      })

      return res.status(200).json({ ok: true, email })
    }

    // ===== LOGIN =====
    if (action === 'login') {
      const user = await col.findOne({ email, password: hashed })

      if (!user)
        return res.status(401).json({ error: 'email หรือ password ไม่ถูกต้อง' })

      return res.status(200).json({ ok: true, email })
    }

    return res.status(400).json({ error: 'invalid action' })

  } catch (err) {
    console.error('DB Error:', err)
    // รีเซ็ต client ถ้า connection หลุด
    client = null
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาลองใหม่' })
  }
}