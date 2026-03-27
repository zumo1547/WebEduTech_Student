import { useState } from "react"
import './assets/auth.css'

interface RegisterProps {
  onRegister: (email: string) => void
  onGoLogin: () => void
}

export default function Register({ onRegister, onGoLogin }: RegisterProps) {
  const [email, setEmail]         = useState("")
  const [password, setPassword]   = useState("")
  const [confirm, setConfirm]     = useState("")
  const [msg, setMsg]             = useState("")
  const [msgType, setMsgType]     = useState<"error" | "success">("error")
  const [loading, setLoading]     = useState(false)
  const [showPass, setShowPass]   = useState(false)

  async function handleRegister() {
    if (!email || !password || !confirm) {
      setMsgType("error"); setMsg("กรุณากรอกข้อมูลให้ครบ"); return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMsgType("error"); setMsg("รูปแบบ email ไม่ถูกต้อง"); return
    }
    if (password.length < 6) {
      setMsgType("error"); setMsg("password ต้องมีอย่างน้อย 6 ตัวอักษร"); return
    }
    if (password !== confirm) {
      setMsgType("error"); setMsg("password ไม่ตรงกัน ลองอีกครั้ง"); return
    }

    setLoading(true); setMsg("")

    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, action: "register" })
      })
      const data = await res.json()

      if (data.ok) {
        localStorage.setItem("user", data.email)
        setMsgType("success")
        setMsg("สมัครสมาชิกสำเร็จ! 🎉 กำลังเข้าสู่ระบบ...")
        setTimeout(() => onRegister(data.email), 900)
      } else {
        setMsgType("error"); setMsg(data.error || "เกิดข้อผิดพลาด")
      }
    } catch {
      setMsgType("error"); setMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้")
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleRegister()
  }

  const strengthScore = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3

  const strengthLabel = ["", "อ่อนมาก 😬", "พอใช้ได้ 😐", "แข็งแกร่ง 💪", "แข็งแกร่งมาก 🔥"]
  const strengthColor = ["", "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff"]

  return (
    <div className="auth-bg">
      {/* Animated blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo-wrap">
          <div className="auth-logo">🎮</div>
          <div className="auth-app-name">Learn<span>2</span>Unlock</div>
          <div className="auth-tagline">สร้างบัญชีแล้วเริ่มผจญภัย!</div>
        </div>

        {/* Steps indicator */}
        <div className="auth-steps">
          <div className="auth-step done">1</div>
          <div className="auth-step-line" />
          <div className="auth-step active">2</div>
          <div className="auth-step-line" />
          <div className="auth-step">3</div>
        </div>
        <div className="auth-steps-label">
          <span>กรอกข้อมูล</span><span>ตั้ง Password</span><span>เริ่มเลย!</span>
        </div>

        {/* Form */}
        <div className="auth-fields">
          <div className="auth-field-group">
            <label className="auth-label">📧 Email</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label className="auth-label">🔒 Password</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                type={showPass ? "text" : "password"}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                autoComplete="new-password"
              />
              <button className="auth-eye" onClick={() => setShowPass(p => !p)} type="button">
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {/* Password strength */}
            {password.length > 0 && (
              <div className="strength-wrap">
                <div className="strength-bars">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="strength-bar"
                      style={{ background: i <= strengthScore ? strengthColor[strengthScore] : 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
                <span className="strength-label" style={{ color: strengthColor[strengthScore] }}>
                  {strengthLabel[strengthScore]}
                </span>
              </div>
            )}
          </div>

          <div className="auth-field-group">
            <label className="auth-label">🔑 ยืนยัน Password</label>
            <div className="auth-input-wrap">
              <input
                className={`auth-input ${confirm && confirm !== password ? 'input-error' : confirm && confirm === password ? 'input-ok' : ''}`}
                type={showPass ? "text" : "password"}
                placeholder="พิมพ์ password อีกครั้ง"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                autoComplete="new-password"
              />
              {confirm && (
                <span className="input-check">
                  {confirm === password ? "✅" : "❌"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        {msg && (
          <div className={`auth-msg ${msgType}`}>
            {msgType === "success" ? "✅" : "⚠️"} {msg}
          </div>
        )}

        {/* Submit */}
        <button
          className="auth-btn"
          onClick={handleRegister}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <span className="auth-spinner" /> : null}
          {loading ? "กำลังสมัคร..." : "✨ สมัครสมาชิก"}
        </button>

        {/* Divider */}
        <div className="auth-divider"><span>หรือ</span></div>

        {/* Back to login */}
        <button className="auth-secondary-btn" onClick={onGoLogin} disabled={loading}>
          🔑 มีบัญชีแล้ว? เข้าสู่ระบบ
        </button>

        <p className="auth-terms">
          การสมัครถือว่ายอมรับ <span>นโยบายความเป็นส่วนตัว</span>
        </p>
      </div>
    </div>
  )
}
