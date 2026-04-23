import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getMe } from '../api/authApi'
import { createTest, deleteTest, listTests, updateTest } from '../api/testApi'
import type { TestItem } from '../types'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const [tests, setTests] = useState<TestItem[]>([])
  const [createName, setCreateName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { logout, nickname } = useAuth()
  const navigate = useNavigate()

  const sortedTests = useMemo(() => [...tests].sort((a, b) => b.id.localeCompare(a.id)), [tests])

  async function loadTests() {
    setLoading(true)
    try {
      const data = await listTests()
      setTests(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTests()
  }, [])

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!createName.trim()) {
      return
    }

    setSubmitting(true)
    try {
      await createTest({ name: createName.trim() })
      setCreateName('')
      await loadTests()
    } catch (err) {
      setError(err instanceof Error ? err.message : '新增失败')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(item: TestItem) {
    setEditingId(item.id)
    setEditingName(item.name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingName('')
  }

  async function handleUpdate(id: string) {
    if (!editingName.trim()) {
      return
    }

    setSubmitting(true)
    try {
      await updateTest({ id, name: editingName.trim() })
      cancelEdit()
      await loadTests()
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setSubmitting(true)
    try {
      await deleteTest({ id })
      if (editingId === id) {
        cancelEdit()
      }
      await loadTests()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    try {
      const currentUser = await getMe()
      if (currentUser.is_auto_registered) {
        const confirmed = window.confirm('当前是游客账号，退出登录后将无法找回该账号，确定继续退出吗？')
        if (!confirmed) {
          return
        }
      }
    } finally {
      logout()
      navigate('/login')
    }
  }

  function handleOpenProfile() {
    navigate('/profile')
  }

  return (
    <main className="page">
      <section className="panel hero">
        <div className="hero-content">
          <div>
            <p className="eyebrow">Quarks</p>
            <h1>Test 管理台</h1>
            <p className="subtitle">连接本地 FastAPI 服务，完成 test 的增删改查。</p>
          </div>
          <div className="user-info">
            <span className="username">{nickname}</span>
            <button type="button" className="secondary" onClick={handleOpenProfile}>
              个人信息
            </button>
            <button type="button" className="logout-btn" onClick={() => void handleLogout()}>
              退出登录
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>新增 Test</h2>
        <form className="create-form" onSubmit={handleCreate}>
          <input
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            placeholder="输入 name"
          />
          <button type="submit" disabled={submitting}>
            新增
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="section-header">
          <h2>Test 列表</h2>
          <button
            type="button"
            className="secondary"
            onClick={() => void loadTests()}
            disabled={loading || submitting}
          >
            刷新
          </button>
        </div>

        {error ? <div className="error">{error}</div> : null}
        {loading ? <div className="empty">加载中...</div> : null}
        {!loading && sortedTests.length === 0 ? <div className="empty">暂无数据</div> : null}

        <div className="list">
          {sortedTests.map((item) => {
            const isEditing = editingId === item.id

            return (
              <article key={item.id} className="list-item">
                <div className="item-meta">
                  <span className="item-id">ID: {item.id}</span>
                </div>

                {isEditing ? (
                  <div className="item-edit">
                    <input
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                    />
                    <div className="item-actions">
                      <button
                        type="button"
                        onClick={() => void handleUpdate(item.id)}
                        disabled={submitting}
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={cancelEdit}
                        disabled={submitting}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="item-name">{item.name}</div>
                    <div className="item-actions">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        disabled={submitting}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => void handleDelete(item.id)}
                        disabled={submitting}
                      >
                        删除
                      </button>
                    </div>
                  </>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
