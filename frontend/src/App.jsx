import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  )
}

export default App