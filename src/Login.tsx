import { useState } from "react"
import './assets/auth.css'

interface LoginProps {
  onLogin: (email: string) => void
  onGoRegister: () => void
}

export default function Login({ onLogin, onGoRegister }: LoginProps) {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [msg, setMsg]           = useState("")
  const [msgType, setMsgType]   = useState<"error" | "success">("error")
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      setMsgType("error"); setMsg("กรุณากรอก email และ password"); return
    }
    setLoading(true); setMsg("")
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, action: "login" })
      })
      const data = await res.json()
      if (data.ok) {
        localStorage.setItem("user", data.email)
        setMsgType("success")
        setMsg("เข้าสู่ระบบสำเร็จ! 🚀")
        setTimeout(() => onLogin(data.email), 600)
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
    if (e.key === "Enter") handleLogin()
  }

  return (
    <div className="auth-bg">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-card">
        <div className="auth-logo-wrap">
          <div className="auth-logo">🎮</div>
          <div className="auth-app-name">Learn<span>2</span>Unlock</div>
          <div className="auth-tagline">ยิ่งเรียน → ยิ่งปลดล็อก → ยิ่งสนุก</div>
        </div>

        <div className="auth-welcome-badge">👋 ยินดีต้อนรับกลับ!</div>

        <div className="auth-fields">
          <div className="auth-field-group">
            <label className="auth-label">📧 Email</label>
            <div className="auth-input-wrap">
              <input className="auth-input" type="email" placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKey} disabled={loading} autoComplete="email" />
            </div>
          </div>
          <div className="auth-field-group">
            <label className="auth-label">🔒 Password</label>
            <div className="auth-input-wrap">
              <input className="auth-input" type={showPass ? "text" : "password"}
                placeholder="กรอก password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey} disabled={loading} autoComplete="current-password" />
              <button className="auth-eye" onClick={() => setShowPass(p => !p)} type="button">
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
        </div>

        {msg && (
          <div className={`auth-msg ${msgType}`}>
            {msgType === "success" ? "✅" : "⚠️"} {msg}
          </div>
        )}

        <button className="auth-btn" onClick={handleLogin} disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? <span className="auth-spinner" /> : null}
          {loading ? "กำลังเข้าสู่ระบบ..." : "🚀 เข้าสู่ระบบ"}
        </button>

        <div className="auth-divider"><span>ยังไม่มีบัญชี?</span></div>

        <button className="auth-secondary-btn auth-register-btn" onClick={onGoRegister} disabled={loading}>
          ✨ สมัครสมาชิกฟรี
        </button>

        <div className="auth-teaser">
          <div className="teaser-item"><span>🏆</span> ระบบ Level</div>
          <div className="teaser-item"><span>🎯</span> Daily Mission</div>
          <div className="teaser-item"><span>🔓</span> Unlockables</div>
        </div>
      </div>
    </div>
  )
}