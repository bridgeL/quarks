import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { autoRegister } from '../api/authApi'
import { useAuth } from '../contexts/AuthContext'

export default function AutoRegisterPage() {
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    void handleAutoRegister()
  }, [])

  async function handleAutoRegister() {
    setError('')
    try {
      const data = await autoRegister()
      login(data.access_token, data.username, data.nickname)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '自动注册失败')
    }
  }

  return (
    <main className="page">
      <section className="panel auth-panel">
        <div className="auth-header">
          <p className="eyebrow">Quarks</p>
          <h1>自动注册中...</h1>
          <p className="subtitle">正在创建您的账号</p>
        </div>
        {error ? <div className="error">{error}</div> : null}
      </section>
    </main>
  )
}
