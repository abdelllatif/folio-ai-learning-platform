import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { TimerProvider } from '@/context/TimerContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppRoutes } from '@/routes'

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <TimerProvider>
              <AppRoutes />
            </TimerProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
