import { useState } from "react"

interface LoginProps {
  onLogin: (email: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [msg, setMsg] = useState("")
  const [msgType, setMsgType] = useState<"error" | "success">("error")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"login" | "register">("login")

  async function handleAuth() {
    if (!email || !password) {
      setMsgType("error")
      setMsg("กรุณากรอก email และ password")
      return
    }

    setLoading(true)
    setMsg("")

    try {
      // ✅ แก้จาก /api/auth → /api/user ให้ตรงกับไฟล์ api/user.ts
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, action: mode })
      })

      const data = await res.json()

      if (data.ok) {
        localStorage.setItem("user", data.email)
        setMsgType("success")
        setMsg(mode === "register" ? "สมัครสมาชิกสำเร็จ! 🎉" : "เข้าสู่ระบบสำเร็จ! 🚀")
        setTimeout(() => onLogin(data.email), 600)
      } else {
        setMsgType("error")
        setMsg(data.error || "เกิดข้อผิดพลาด")
      }
    } catch {
      setMsgType("error")
      setMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAuth()
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* LOGO */}
        <div style={styles.logo}>🎮</div>
        <div style={styles.appName}>
          Learn<span style={{ color: "#4d96ff" }}>2</span>Unlock
        </div>
        <div style={styles.tagline}>ยิ่งเรียน → ยิ่งปลดล็อก → ยิ่งสนุก</div>

        {/* MODE TOGGLE */}
        <div style={styles.modeToggle}>
          <button
            style={{ ...styles.modeBtn, ...(mode === "login" ? styles.modeBtnActive : {}) }}
            onClick={() => { setMode("login"); setMsg("") }}
          >
            เข้าสู่ระบบ
          </button>
          <button
            style={{ ...styles.modeBtn, ...(mode === "register" ? styles.modeBtnActive : {}) }}
            onClick={() => { setMode("register"); setMsg("") }}
          >
            สมัครสมาชิก
          </button>
        </div>

        {/* INPUTS */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>📧 Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>🔒 Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="อย่างน้อย 6 ตัวอักษร"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>

        {/* MESSAGE */}
        {msg && (
          <div style={{
            ...styles.msg,
            background: msgType === "success" ? "#1a3a1a" : "#3a1a1a",
            borderColor: msgType === "success" ? "#6bcb77" : "#ff6b6b",
            color: msgType === "success" ? "#6bcb77" : "#ff6b6b",
          }}>
            {msg}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleAuth}
          disabled={loading}
        >
          {loading
            ? "⏳ กำลังดำเนินการ..."
            : mode === "login" ? "🚀 เข้าสู่ระบบ" : "✨ สมัครสมาชิก"
          }
        </button>

        <div style={styles.footer}>
          {mode === "login" ? "ยังไม่มีบัญชี? " : "มีบัญชีแล้ว? "}
          <span
            style={styles.link}
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setMsg("") }}
          >
            {mode === "login" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </span>
        </div>
      </div>
    </div>
  )
}

// ===== STYLES =====
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
    padding: "20px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px",
    padding: "40px 32px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  logo: {
    fontSize: "52px",
    textAlign: "center",
    lineHeight: 1,
  },
  appName: {
    fontSize: "28px",
    fontWeight: 800,
    textAlign: "center",
    color: "#fff",
    letterSpacing: "-0.5px",
  },
  tagline: {
    fontSize: "13px",
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    marginTop: "-8px",
  },
  modeToggle: {
    display: "flex",
    background: "rgba(0,0,0,0.3)",
    borderRadius: "12px",
    padding: "4px",
    gap: "4px",
  },
  modeBtn: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    background: "transparent",
    color: "rgba(255,255,255,0.5)",
    transition: "all 0.2s",
  },
  modeBtnActive: {
    background: "linear-gradient(135deg, #4d96ff, #c77dff)",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(77,150,255,0.3)",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.6)",
  },
  input: {
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
    transition: "border 0.2s",
  },
  msg: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid",
    fontSize: "13px",
    fontWeight: 600,
    textAlign: "center",
  },
  btn: {
    padding: "16px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #4d96ff, #c77dff)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 4px 20px rgba(77,150,255,0.35)",
    marginTop: "4px",
  },
  footer: {
    textAlign: "center",
    fontSize: "13px",
    color: "rgba(255,255,255,0.4)",
  },
  link: {
    color: "#4d96ff",
    cursor: "pointer",
    fontWeight: 600,
  },
}