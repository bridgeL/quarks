import { Navigate, Outlet, Route, Routes } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import AutoRegisterPage from '../pages/AutoRegisterPage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import ProfilePage from '../pages/ProfilePage'

function ProtectedRoute() {
  const { token } = useAuth()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function GuestRoute() {
  const { token } = useAuth()
  if (token) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auto-register" element={<AutoRegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
