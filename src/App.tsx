import { useState, useEffect, useRef, useCallback } from 'react'
import './assets/App.css'   // <-- แก้ตรงนี้

// ===== TYPES =====
interface Mission {
  id: number
  name: string
  desc: string
  icon: string
  time: number
  xp: number
  colorA: string
  colorB: string
}

interface UnlockItem {
  id: number
  icon: string
  name: string
  type: string
  req: number
}

interface HistoryEntry {
  name: string
  xp: number
  time: number
}

interface AppState {
  exp: number
  level: number
  streak: number
  totalMissions: number
  totalMinutes: number
  completedToday: number[]
  history: HistoryEntry[]
  lastDate: string | null
  phoneUseful: number
}

type TabType = 'home' | 'mission' | 'dashboard'

// ===== STATIC DATA =====
const MISSIONS: Mission[] = [
  { id: 1, name: 'อ่านบทความ',       desc: 'อ่านบทความความรู้สั้นๆ แล้วจำใจความสำคัญ 3 ข้อ',   icon: '📖', time: 300, xp: 20, colorA: '#4d96ff', colorB: '#c77dff' },
  { id: 2, name: 'Quiz 3 ข้อ',       desc: 'ตอบคำถามทดสอบความรู้ 3 ข้อ ทำได้เลย!',              icon: '🧩', time: 180, xp: 15, colorA: '#ffd93d', colorB: '#ff9a3c' },
  { id: 3, name: 'ดูคลิปความรู้',    desc: 'ดูคลิปสั้น 5 นาที แล้วสรุป 1 สิ่งที่ได้เรียนรู้',  icon: '🎬', time: 300, xp: 20, colorA: '#6bcb77', colorB: '#4d96ff' },
  { id: 4, name: 'ฝึกโจทย์คณิต',    desc: 'ทำโจทย์คณิตศาสตร์ง่ายๆ 5 ข้อ ฝึกสมองให้แล่น',    icon: '🔢', time: 360, xp: 25, colorA: '#ff6b6b', colorB: '#ffd93d' },
  { id: 5, name: 'เขียน Journal',    desc: 'เขียนสิ่งที่เรียนรู้วันนี้ 3–5 ประโยค',             icon: '✏️', time: 240, xp: 18, colorA: '#c77dff', colorB: '#ff6b6b' },
  { id: 6, name: 'ฝึกภาษาอังกฤษ',  desc: 'เรียนคำศัพท์ใหม่ 5 คำ + ประโยคตัวอย่าง',           icon: '🌍', time: 300, xp: 22, colorA: '#4d96ff', colorB: '#6bcb77' },
]

const UNLOCKS: UnlockItem[] = [
  { id: 1, icon: '🦸', name: 'Hero',     type: 'avatar', req: 1 },
  { id: 2, icon: '🧙', name: 'Wizard',   type: 'avatar', req: 3 },
  { id: 3, icon: '🦊', name: 'Fox',      type: 'avatar', req: 5 },
  { id: 4, icon: '⭐', name: 'Star',     type: 'badge',  req: 2 },
  { id: 5, icon: '🔥', name: 'Fire',     type: 'badge',  req: 4 },
  { id: 6, icon: '💎', name: 'Diamond',  type: 'badge',  req: 7 },
  { id: 7, icon: '🌊', name: 'Ocean',    type: 'theme',  req: 3 },
  { id: 8, icon: '🌸', name: 'Sakura',   type: 'theme',  req: 5 },
  { id: 9, icon: '🌙', name: 'Midnight', type: 'theme',  req: 8 },
]

const TITLES = [
  { min: 1,  title: '🌱 มือใหม่' },
  { min: 3,  title: '📚 นักเรียน' },
  { min: 5,  title: '⚡ ผู้กล้า' },
  { min: 8,  title: '🔥 นักสำรวจ' },
  { min: 12, title: '🌟 ผู้เชี่ยวชาญ' },
  { min: 20, title: '💎 ตำนาน' },
]

const DOT_COLORS = ['#4d96ff','#6bcb77','#ffd93d','#c77dff','#ff6b6b']
const STORAGE_KEY = 'learn2unlock_v2'

// ===== HELPERS =====
function xpForLevel(level: number) { return level * 100 }

function getTitle(level: number) {
  let t = TITLES[0].title
  for (const item of TITLES) { if (level >= item.min) t = item.title }
  return t
}

function getAvatar(level: number) {
  if (level >= 5) return '🦊'
  if (level >= 3) return '🧙'
  return '🦸'
}

function fmtTimer(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function todayStr() { return new Date().toDateString() }

function loadState(): AppState {
  const defaultState: AppState = {
    exp: 0, level: 1, streak: 0, totalMissions: 0,
    totalMinutes: 0, completedToday: [], history: [],
    lastDate: null, phoneUseful: 0,
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState, lastDate: todayStr() }
    const saved: AppState = { ...defaultState, ...JSON.parse(raw) }
    const today = todayStr()
    if (saved.lastDate !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      if (saved.lastDate === yesterday.toDateString()) {
        saved.streak = (saved.streak || 0) + 1
      } else if (saved.lastDate !== null) {
        saved.streak = 0
      }
      saved.completedToday = []
      saved.phoneUseful = 0
      saved.lastDate = today
    }
    return saved
  } catch {
    return { ...defaultState, lastDate: todayStr() }
  }
}

function saveState(s: AppState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

// ===== CONFETTI =====
function runConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width, y: -20,
    vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4 + 2,
    color: DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)],
    size: Math.random() * 8 + 4, rot: Math.random() * 360, rv: (Math.random() - 0.5) * 10,
  }))
  let frame = 0
  const anim = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach(p => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot * Math.PI / 180)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      ctx.restore()
      p.x += p.vx; p.y += p.vy; p.rot += p.rv; p.vy += 0.06
    })
    frame++
    if (frame < 130) requestAnimationFrame(anim)
    else ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  requestAnimationFrame(anim)
}

// ===== MAIN APP =====
export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [tab, setTab] = useState<TabType>('home')
  const [activeMission, setActiveMission] = useState<Mission | null>(null)
  const [missionRunning, setMissionRunning] = useState(false)
  const [timerSec, setTimerSec] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const [showWarn, setShowWarn] = useState(false)
  const [pendingTab, setPendingTab] = useState<TabType | null>(null)
  const [warnForClose, setWarnForClose] = useState(false)
  const [showReward, setShowReward] = useState(false)
  const [rewardMission, setRewardMission] = useState<Mission | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpNum, setLevelUpNum] = useState(1)
  const [failedMission, setFailedMission] = useState<Mission | null>(null)
  const [showFailed, setShowFailed] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeMissionRef = useRef<Mission | null>(null)

  // keep ref in sync for use inside interval
  useEffect(() => { activeMissionRef.current = activeMission }, [activeMission])

  // Persist state
  useEffect(() => { saveState(state) }, [state])

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }, [])

  const triggerConfetti = useCallback(() => {
    if (canvasRef.current) runConfetti(canvasRef.current)
  }, [])

  const handleComplete = useCallback(() => {
    const m = activeMissionRef.current
    if (!m) return
    clearInterval(timerRef.current!)
    setMissionRunning(false)
    setActiveMission(null)

    setState(prev => {
      let { exp, level, completedToday, totalMissions, totalMinutes, phoneUseful, history } = prev
      exp += m.xp
      completedToday = [...completedToday, m.id]
      totalMissions += 1
      totalMinutes += Math.round(m.time / 60)
      phoneUseful = Math.min(100, phoneUseful + Math.round(m.time / 60) * 5)
      history = [...(history || []), { name: m.name, xp: m.xp, time: Date.now() }]
      const prevLevel = level
      while (exp >= xpForLevel(level)) { exp -= xpForLevel(level); level++ }
      if (level > prevLevel) {
        setTimeout(() => { setLevelUpNum(level); setShowLevelUp(true); triggerConfetti() }, 300)
      } else {
        setTimeout(() => { setRewardMission(m); setShowReward(true) }, 200)
        setTimeout(() => triggerConfetti(), 100)
      }
      return { ...prev, exp, level, completedToday, totalMissions, totalMinutes, phoneUseful, history }
    })
  }, [triggerConfetti])

  // Timer countdown
  useEffect(() => {
    if (!missionRunning) return
    timerRef.current = setInterval(() => {
      setTimerSec(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [missionRunning, handleComplete])

  // ===== TAB SWITCH =====
  const handleTabClick = (t: TabType) => {
    if (missionRunning) {
      setPendingTab(t)
      setWarnForClose(false)
      setShowWarn(true)
      return
    }
    setTab(t)
  }

  // ===== MODAL =====
  const openMission = (m: Mission) => {
    setActiveMission(m)
    setTimerSec(m.time)
    setTimerTotal(m.time)
    setMissionRunning(false)
    clearInterval(timerRef.current!)
  }

  const closeMissionModal = () => {
    if (missionRunning) {
      setWarnForClose(true)
      setPendingTab(null)
      setShowWarn(true)
      return
    }
    setActiveMission(null)
  }

  const startMission = () => {
    if (missionRunning || !activeMission) return
    setMissionRunning(true)
  }

  // ===== WARN ACTIONS =====
  const continueWarn = () => {
    setShowWarn(false)
    setPendingTab(null)
    setWarnForClose(false)
  }

  const confirmLeave = () => {
    clearInterval(timerRef.current!)
    setMissionRunning(false)
    const m = activeMission
    setActiveMission(null)
    setShowWarn(false)
    setFailedMission(m)
    setShowFailed(true)
    setWarnForClose(false)
    if (pendingTab) { setTab(pendingTab); setPendingTab(null) }
    else setTab('mission')
  }

  // Ignore unused warning for warnForClose
  void warnForClose

  // Ignore unused showToastMsg (kept for future use)
  void showToastMsg

  // ===== COMPUTED =====
  const goodPct = Math.min(100, state.phoneUseful)
  const badPct = 100 - goodPct
  const xpPct = Math.min(100, (state.exp / xpForLevel(state.level)) * 100)
  const timerPct = timerTotal > 0 ? (timerSec / timerTotal) * 100 : 100
  const availableMissions = MISSIONS.filter(m => !state.completedToday.includes(m.id))

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">
          <img
            src="/EduTech.png"
            alt="icon"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          Learn<span>2</span>Unlock
        </div>
        <div className="nav-right">
          <div className="streak-pill">🔥 {state.streak}</div>
          <div className="level-pill">⚡ Lv.{state.level}</div>
        </div>
      </nav>

      {/* TOAST */}
      <div className={`toast ${toastVisible ? 'show' : ''}`}>{toast}</div>

      {/* CONFETTI */}
      <canvas className="confetti-canvas" ref={canvasRef} />

      {/* ===== HOME PAGE ===== */}
      <div className={`page ${tab === 'home' ? 'active' : ''}`}>
        <div className="hero">
          <span className="hero-emoji">🚀</span>
          <div className="hero-title">เริ่มภารกิจวันนี้!</div>
          <div className="hero-sub">ยิ่งเรียน → ยิ่งปลดล็อก → ยิ่งสนุก</div>
        </div>

        <div className="xp-card">
          <div className="xp-header">
            <span className="xp-label">⚡ EXP</span>
            <span className="xp-value">{state.exp} / {xpForLevel(state.level)}</span>
          </div>
          <div className="xp-bar-wrap">
            <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-num">{state.streak}</div>
            <div className="stat-lbl">Streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-num">{state.totalMissions}</div>
            <div className="stat-lbl">ภารกิจ</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-num">{state.totalMinutes}</div>
            <div className="stat-lbl">นาที</div>
          </div>
        </div>

        <div className="phone-meter">
          <div className="phone-meter-title">📱 วันนี้ใช้มือถืออย่างไร?</div>
          <div className="meter-row">
            <span className="meter-label">📵 เล่นเฉยๆ</span>
            <div className="meter-bar-wrap">
              <div className="meter-bad" style={{ width: `${badPct}%` }} />
            </div>
            <span className="meter-pct">{badPct}%</span>
          </div>
          <div className="meter-row">
            <span className="meter-label">📚 มีประโยชน์</span>
            <div className="meter-bar-wrap">
              <div className="meter-good" style={{ width: `${goodPct}%` }} />
            </div>
            <span className="meter-pct">{goodPct}%</span>
          </div>
          <div className="meter-hint">ทำภารกิจเพิ่มเพื่อเพิ่ม % มีประโยชน์! 💪</div>
        </div>

        <div className="section-title">⚡ ภารกิจแนะนำ</div>
        {availableMissions.length === 0 ? (
          <div className="all-done-msg">🎉 ทำภารกิจครบแล้ววันนี้! กลับมาพรุ่งนี้</div>
        ) : (
          availableMissions.slice(0, 2).map(m => (
            <div key={m.id} className="mission-card" style={{ marginBottom: 10 }}
              onClick={() => { handleTabClick('mission'); openMission(m) }}>
              <div className="mission-icon-wrap"
                style={{ background: `linear-gradient(135deg,${m.colorA}30,${m.colorB}30)` }}>
                {m.icon}
              </div>
              <div className="mission-info">
                <div className="mission-name">{m.name}</div>
                <div className="mission-tags">
                  <span className="tag tag-time">⏱ {m.time / 60} นาที</span>
                  <span className="tag tag-xp">+{m.xp} EXP</span>
                </div>
              </div>
              <div className="mission-arrow">›</div>
            </div>
          ))
        )}
      </div>

      {/* ===== MISSION PAGE ===== */}
      <div className={`page ${tab === 'mission' ? 'active' : ''}`}>
        <div className="mission-page-header">
          <div className="section-title">🎯 เลือกภารกิจ</div>
          <div className="mission-sub">ทำภารกิจสั้นๆ 3–10 นาที รับ EXP และปลดล็อกของ!</div>

          {showFailed && (
            <div className="failed-banner">
              <div className="failed-icon">💥</div>
              <div className="failed-text">
                <div className="failed-title">ภารกิจล้มเหลว!</div>
                <div className="failed-sub">
                  ภารกิจ "{failedMission?.name}" ล้มเหลว — ลองใหม่ได้เลย!
                </div>
              </div>
              <button className="failed-close" onClick={() => setShowFailed(false)}>✕</button>
            </div>
          )}

          <div className="mission-grid">
            {MISSIONS.map(m => {
              const done = state.completedToday.includes(m.id)
              return (
                <div key={m.id}
                  className={`mission-card ${done ? 'done' : ''}`}
                  onClick={() => { if (!done) openMission(m) }}
                  style={{ cursor: done ? 'default' : 'pointer' }}>
                  {done && <div className="done-badge">✅ เสร็จแล้ว</div>}
                  <div className="mission-icon-wrap"
                    style={{ background: `linear-gradient(135deg,${m.colorA}30,${m.colorB}30)` }}>
                    {m.icon}
                  </div>
                  <div className="mission-info">
                    <div className="mission-name">{m.name}</div>
                    <div className="mission-desc">{m.desc}</div>
                    <div className="mission-tags">
                      <span className="tag tag-time">⏱ {m.time / 60} นาที</span>
                      <span className="tag tag-xp">+{m.xp} EXP</span>
                    </div>
                  </div>
                  {!done && <div className="mission-arrow">›</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ===== DASHBOARD PAGE ===== */}
      <div className={`page ${tab === 'dashboard' ? 'active' : ''}`}>
        <div className="profile-card">
          <div className="profile-card-bg" />
          <div className="avatar-wrap">
            <div className="avatar">{getAvatar(state.level)}</div>
            <div className="level-badge">Lv.{state.level}</div>
          </div>
          <div className="profile-name">นักเรียนผู้กล้า</div>
          <div className="profile-role">{getTitle(state.level)}</div>
        </div>

        <div className="unlock-section">
          <div className="section-title">🔓 คอลเลกชัน</div>
          <div className="unlock-grid">
            {UNLOCKS.map(u => {
              const unlocked = state.level >= u.req
              return (
                <div key={u.id} className={`unlock-item ${unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="unlock-icon">{unlocked ? u.icon : '🔒'}</div>
                  <div className="unlock-name">{u.name}</div>
                  <div className="unlock-req">
                    {unlocked ? '✅ ปลดแล้ว' : `Lv.${u.req}`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="section-title">📜 ประวัติ</div>
        <div className="history-card">
          {(!state.history || state.history.length === 0) ? (
            <div className="history-empty">ยังไม่มีประวัติ เริ่มทำภารกิจเลย!</div>
          ) : (
            [...state.history].reverse().slice(0, 8).map((h, i) => (
              <div key={i} className="history-row">
                <div className="history-dot"
                  style={{ background: DOT_COLORS[i % DOT_COLORS.length] }} />
                <div className="history-text">{h.name}</div>
                <div className="history-xp">+{h.xp} EXP</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== TABS ===== */}
      <nav className="tabs">
        {([
          ['home', '🏠', 'หน้าหลัก'],
          ['mission', '🎯', 'ภารกิจ'],
          ['dashboard', '📊', 'โปรไฟล์'],
        ] as [TabType, string, string][]).map(([t, icon, label]) => (
          <button key={t}
            className={`tab-btn ${tab === t ? 'active' : ''} ${missionRunning ? 'locked-tab' : ''}`}
            onClick={() => handleTabClick(t)}>
            <span className="tab-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* ===== MISSION MODAL ===== */}
      {activeMission && (
        <div className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) closeMissionModal() }}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-icon">{activeMission.icon}</span>
              <button className="modal-close" onClick={closeMissionModal}>✕</button>
            </div>
            <div className="modal-title">{activeMission.name}</div>
            <div className="modal-desc">{activeMission.desc}</div>
            <div className="modal-timer">
              <div className="timer-num">{fmtTimer(timerSec)}</div>
              <div className="timer-label">
                {missionRunning ? '⏳ กำลังทำภารกิจ...' : 'กดเริ่มเพื่อเริ่มนับเวลา'}
              </div>
              <div className="timer-bar-wrap">
                <div className="timer-bar" style={{ width: `${timerPct}%` }} />
              </div>
            </div>
            <button className="btn-primary" onClick={startMission} disabled={missionRunning}>
              {missionRunning ? '⏳ กำลังทำ...' : '▶ เริ่มภารกิจ'}
            </button>
          </div>
        </div>
      )}

      {/* ===== WARN DIALOG ===== */}
      {showWarn && (
        <div className="warn-overlay">
          <div className="warn-box">
            <div className="warn-emoji">⚠️</div>
            <div className="warn-title">กำลังทำภารกิจอยู่!</div>
            <div className="warn-desc">
              คุณกำลังทำภารกิจ <strong>"{activeMission?.name}"</strong> อยู่<br />
              ถ้าออกไป ภารกิจจะ{' '}
              <span style={{ color: 'var(--accent1)', fontWeight: 800 }}>ล้มเหลว</span>{' '}
              และไม่ได้รับ EXP
            </div>
            <div className="warn-btns">
              <button className="warn-cancel" onClick={continueWarn}>🔙 ทำต่อ</button>
              <button className="warn-confirm" onClick={confirmLeave}>🚪 ออกเลย</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REWARD POPUP ===== */}
      {showReward && rewardMission && (
        <div className="reward-overlay" onClick={() => setShowReward(false)}>
          <div className="reward-popup" onClick={e => e.stopPropagation()}>
            <span className="reward-emoji">{rewardMission.icon}</span>
            <div className="reward-title">ภารกิจสำเร็จ!</div>
            <div className="reward-items">
              <div className="reward-item"><span>⚡</span>+{rewardMission.xp} EXP</div>
              <div className="reward-item"><span>⏱️</span>+{Math.round(rewardMission.time / 60)} นาที</div>
              <div className="reward-item">
                <span>📱</span>มีประโยชน์ขึ้น {Math.round(rewardMission.time / 60) * 5}%
              </div>
            </div>
            <button className="reward-ok" onClick={() => setShowReward(false)}>สุดยอด! 🙌</button>
          </div>
        </div>
      )}

      {/* ===== LEVEL UP ===== */}
      {showLevelUp && (
        <div className="levelup-overlay" onClick={() => setShowLevelUp(false)}>
          <div className="levelup-popup">
            <div className="levelup-stars">⭐✨⭐</div>
            <div className="levelup-text">LEVEL UP!</div>
            <div className="levelup-num">{levelUpNum}</div>
            <div className="levelup-sub">ปลดล็อกของใหม่แล้ว! แตะเพื่อปิด</div>
          </div>
        </div>
      )}
    </>
  )
}
