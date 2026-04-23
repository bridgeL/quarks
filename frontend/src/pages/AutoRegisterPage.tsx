import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { autoRegister } from '../api/authApi'
import { useAuth } from '../contexts/AuthContext'

export default function AutoRegisterPage() {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const trimmedNickname = nickname.trim()
      const data = await autoRegister(trimmedNickname ? { nickname: trimmedNickname } : {})
      login(data.access_token, data.username, data.nickname)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '游客账号创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <section className="panel auth-panel">
        <div className="auth-header">
          <p className="eyebrow">Quarks</p>
          <h1>进入游客模式</h1>
          <p className="subtitle">输入昵称后即可创建游客账号并进入主页面</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error ? <div className="error">{error}</div> : null}

          <div className="form-field">
            <label htmlFor="nickname">昵称</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="输入昵称（可选）"
              autoComplete="nickname"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? '创建中...' : '创建并进入'}
          </button>
        </form>
      </section>
    </main>
  )
}
