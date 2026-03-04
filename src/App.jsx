import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Collections from './pages/Collections'
import CollectionDetail from './pages/CollectionDetail'
import ItemPage from './pages/ItemPage'
import PlayLog from './pages/PlayLog'
import Statistics from './pages/Statistics'

function AuthRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-fm-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-fm-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-fm-text-muted font-heading">Laden...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected app routes */}
      <Route
        element={
          <AuthRoute>
            <AppLayout />
          </AuthRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="collections" element={<Collections />} />
        <Route path="collections/:id" element={<CollectionDetail />} />
        <Route path="items/:id" element={<ItemPage />} />
        <Route path="playlog" element={<PlayLog />} />
        <Route path="statistics" element={<Statistics />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />
}
