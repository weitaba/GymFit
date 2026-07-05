import { useState, useEffect, useMemo } from 'react'
import type { CalorieEntry } from '../types/detection'
import { EMOJI_EXPORT, EMOJI_ADD, EMOJI_CALORIE } from '../emoji'
import { estimateFood } from '../api/detection'

const KEY = 'gymfit_calorie_logs'
const MEALS = ['早餐', '午餐', '晚餐', '加餐', '零食']
const MEAL_CLASS: Record<string, string> = {
  '早餐': 'meal--breakfast', '午餐': 'meal--lunch', '晚餐': 'meal--dinner',
  '加餐': 'meal--snack', '零食': 'meal--other',
}

function today() { return new Date().toISOString().slice(0, 10) }
function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }
function save(d: Record<string, CalorieEntry[]>) { localStorage.setItem(KEY, JSON.stringify(d)) }

export default function CalorieTrackerPage() {
  const [date, setDate] = useState(today())
  const [logs, setLogs] = useState<Record<string, CalorieEntry[]>>(load)
  const [showForm, setShowForm] = useState(false)
  const [mealFilter, setMealFilter] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', amount: '', calories: '', protein: '', carbs: '', fat: '', meal_type: '午餐' })
  const [editForm, setEditForm] = useState({ name: '', amount: '', calories: '', protein: '', carbs: '', fat: '', meal_type: '午餐' })
  const [estimating, setEstimating] = useState(false)

  async function aiEstimate() {
    if (!form.name || !form.amount) return
    setEstimating(true)
    try {
      const est = await estimateFood(form.name, form.amount)
      setForm((p) => ({ ...p,
        calories: String(est.calories ?? ''),
        protein: String(est.protein ?? ''),
        carbs: String(est.carbs ?? ''),
        fat: String(est.fat ?? ''),
      }))
    } catch { /* ignore */ }
    finally { setEstimating(false) }
  }

  const entries = logs[date] || []
  useEffect(() => { save(logs) }, [logs])

  const { totals, filtered, mealCounts } = useMemo(() => {
    const totals = entries.reduce((a, e) => ({
      calories: a.calories + e.calories, protein: a.protein + e.protein,
      carbs: a.carbs + e.carbs, fat: a.fat + e.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    const mealCounts: Record<string, number> = {}
    entries.forEach((e) => { mealCounts[e.meal_type] = (mealCounts[e.meal_type] || 0) + 1 })
    return { totals, filtered: mealFilter ? entries.filter((e) => e.meal_type === mealFilter) : entries, mealCounts }
  }, [entries, mealFilter])

  function shift(d: number) {
    const dt = new Date(date); dt.setDate(dt.getDate() + d)
    setDate(dt.toISOString().slice(0, 10)); setMealFilter(null)
  }

  function toggleEdit(entry: CalorieEntry) {
    if (editingId === entry.id) { setEditingId(null); return }
    setEditingId(entry.id)
    setEditForm({ name: entry.name, amount: '', calories: String(entry.calories), protein: String(entry.protein), carbs: String(entry.carbs), fat: String(entry.fat), meal_type: entry.meal_type })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const entry: CalorieEntry = {
      id: Date.now().toString(), name: form.name,
      calories: +form.calories || 0, protein: +form.protein || 0,
      carbs: +form.carbs || 0, fat: +form.fat || 0,
      meal_type: form.meal_type,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    setLogs((p) => ({ ...p, [date]: [...(p[date] || []), entry] }))
    setForm({ name: '', amount: '', calories: '', protein: '', carbs: '', fat: '', meal_type: '午餐' })
    setShowForm(false)
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setLogs((p) => ({
      ...p, [date]: (p[date] || []).map((x) =>
        x.id === editingId ? { ...x, name: editForm.name, calories: +editForm.calories || 0, protein: +editForm.protein || 0, carbs: +editForm.carbs || 0, fat: +editForm.fat || 0, meal_type: editForm.meal_type } : x)
    }))
    setEditingId(null)
    setEditForm({ name: '', amount: '', calories: '', protein: '', carbs: '', fat: '', meal_type: '午餐' })
  }

  async function aiEstimateEdit() {
    if (!editForm.name || !editForm.amount) return
    setEstimating(true)
    try {
      const est = await estimateFood(editForm.name, editForm.amount)
      setEditForm((p) => ({ ...p,
        calories: String(est.calories ?? ''), protein: String(est.protein ?? ''),
        carbs: String(est.carbs ?? ''), fat: String(est.fat ?? ''),
      }))
    } catch { /* ignore */ }
    finally { setEstimating(false) }
  }

  function del(id: string) {
    setLogs((p) => ({ ...p, [date]: (p[date] || []).filter((x) => x.id !== id) }))
  }

  function export_() {
    const b = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const u = URL.createObjectURL(b)
    const a = document.createElement('a'); a.href = u; a.download = `gymfit_export_${date}.json`; a.click()
    URL.revokeObjectURL(u)
  }

  const isToday_ = date === today()

  return (
    <div>
      <div className="calorie-header">
        <div className="calorie-date">
          <button className="calorie-date__btn" onClick={() => shift(-1)}>◀</button>
          <span className="calorie-date__text">
            {date}
            {isToday_ && <span className="calorie-date__today">今天</span>}
          </span>
          <button className="calorie-date__btn" onClick={() => shift(1)}>▶</button>
          {!isToday_ && <button className="calorie-date__today" onClick={() => { setDate(today()); setMealFilter(null) }}>今天</button>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={export_}>{EMOJI_EXPORT}</button>
          <button className="btn btn-primary btn-sm" onClick={() => { if (showForm) { setForm({ name: '', amount: '', calories: '', protein: '', carbs: '', fat: '', meal_type: '午餐' }) } setShowForm(!showForm) }}>
            {showForm ? '取消' : '+ 添加'}
          </button>
        </div>
      </div>

      <div className="calorie-summary">
        {[
          ['热量', totals.calories, 'kcal', 'summary-item--cal'],
          ['蛋白质', totals.protein, 'g', 'summary-item--pro'],
          ['碳水', totals.carbs, 'g', 'summary-item--carb'],
          ['脂肪', totals.fat, 'g', 'summary-item--fat'],
          ['记录', entries.length, '条', ''],
        ].map(([l, v, u, cls]) => (
          <div key={l as string} className={`summary-item ${cls}`}>
            <div className="summary-item__label">{l}</div>
            <div className="summary-item__value">{v as number}</div>
            <div className="summary-item__unit">{u}</div>
          </div>
        ))}
      </div>

      {entries.length > 0 && (
        <div className="meal-tabs">
          <button className={`meal-tab ${!mealFilter ? 'active' : ''}`} onClick={() => setMealFilter(null)}>
            全部<span className="meal-tab-count">{entries.length}</span>
          </button>
          {MEALS.map((m) => (
            <button key={m} className={`meal-tab ${mealFilter === m ? 'active' : ''}`}
              onClick={() => setMealFilter(mealFilter === m ? null : m)}>
              {m}{mealCounts[m] ? <span className="meal-tab-count">{mealCounts[m]}</span> : null}
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <form className="add-food-form" onSubmit={submit}>
          <h3>添加食物</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">食物</label>
              <input className="form-input" required placeholder="鸡胸肉" value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">份量</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="form-input" placeholder="200g / 一个拳头大 / 半碗" value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
                <button type="button" className="btn btn-sm btn-secondary" onClick={aiEstimate} disabled={estimating}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {estimating ? '⏳ 估算中...' : '🤖 AI 估算'}
                </button>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">餐别</label>
              <select className="form-select" value={form.meal_type}
                onChange={(e) => setForm((p) => ({ ...p, meal_type: e.target.value }))}>
                {MEALS.map((t) => (<option key={t}>{t}</option>))}
              </select>
            </div>
          </div>
          <div className="form-row form-row-4">
            {['calories','protein','carbs','fat'].map((k) => (
              <div className="form-group" key={k}>
                <label className="form-label">{k === 'calories' ? '热量' : k === 'protein' ? '蛋白质' : k === 'carbs' ? '碳水' : '脂肪'}</label>
                <input className="form-input" type="number" required={k === 'calories'}
                  placeholder={k === 'calories' ? 'kcal' : 'g'}
                  value={(form as any)[k]}
                  onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit">{EMOJI_ADD} 添加记录</button>
            <button className="btn btn-secondary" type="button" onClick={() => { setEditingId(null); setForm({ name: '', amount: '', calories: '', protein: '', carbs: '', fat: '', meal_type: '午餐' }); setShowForm(false) }}>取消</button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">{EMOJI_CALORIE}</div>
          <div className="empty-state__title">{entries.length === 0 ? '今天还没有记录' : '该餐别暂无记录'}</div>
          <div className="empty-state__desc">{entries.length === 0 ? '点击右上角"+ 添加"开始记录饮食' : '切换餐别筛选试试'}</div>
        </div>
      ) : (
        <div className="calorie-entries">
          {filtered.map((e) => (
            <div key={e.id}>
              <div className="calorie-entry"
                onClick={() => toggleEdit(e)}
                style={{ cursor: 'pointer', background: editingId === e.id ? 'var(--brand-50)' : undefined, borderColor: editingId === e.id ? 'var(--brand-400)' : undefined }}>
                <div className="calorie-entry__info">
                  <div className="calorie-entry__name">
                    {e.name}
                    <span className={`calorie-entry__meal ${MEAL_CLASS[e.meal_type] || 'meal--other'}`}>{e.meal_type}</span>
                  </div>
                  <div className="calorie-entry__detail">
                    <span>{e.time}</span>
                    {e.protein > 0 && <span>蛋白质 {e.protein}g</span>}
                    {e.carbs > 0 && <span>碳水 {e.carbs}g</span>}
                    {e.fat > 0 && <span>脂肪 {e.fat}g</span>}
                  </div>
                </div>
                <span className="calorie-entry__kcal">{e.calories} kcal</span>
                <button className="calorie-entry__del" onClick={(ev) => { ev.stopPropagation(); del(e.id) }}>✕</button>
              </div>

              {editingId === e.id && (
                <form className="add-food-form" onSubmit={saveEdit} style={{ marginTop: 6, marginBottom: 6 }}>
                  <h3>编辑食物</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">食物</label>
                      <input className="form-input" required value={editForm.name} onChange={(ev) => setEditForm((p) => ({ ...p, name: ev.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">份量</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input className="form-input" placeholder="200g" value={editForm.amount} onChange={(ev) => setEditForm((p) => ({ ...p, amount: ev.target.value }))} />
                        <button type="button" className="btn btn-sm btn-secondary" onClick={aiEstimateEdit} disabled={estimating} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {estimating ? '⏳ 估算中...' : '🤖 AI 估算'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">餐别</label>
                      <select className="form-select" value={editForm.meal_type} onChange={(ev) => setEditForm((p) => ({ ...p, meal_type: ev.target.value }))}>
                        {MEALS.map((t) => (<option key={t}>{t}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row form-row-4">
                    {['calories','protein','carbs','fat'].map((k) => (
                      <div className="form-group" key={k}>
                        <label className="form-label">{k === 'calories' ? '热量' : k === 'protein' ? '蛋白质' : k === 'carbs' ? '碳水' : '脂肪'}</label>
                        <input className="form-input" type="number" required={k === 'calories'} placeholder={k === 'calories' ? 'kcal' : 'g'}
                          value={(editForm as any)[k]} onChange={(ev) => setEditForm((p) => ({ ...p, [k]: ev.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" type="submit">{EMOJI_EXPORT} 保存修改</button>
                    <button className="btn btn-secondary" type="button" onClick={() => setEditingId(null)}>取消</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
