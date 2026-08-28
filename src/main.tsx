import React, { createContext, useContext, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@figma/astraui'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import '@figma/astraui/styles.css'
import './index.css'

type AppTheme = 'light' | 'dark'

interface ThemeCtx {
  theme: AppTheme
  setTheme: (t: AppTheme) => void
}

export const ThemeContext = createContext<ThemeCtx>({
  theme: 'dark',
  setTheme: () => {},
})

export const useAppTheme = () => useContext(ThemeContext)

function Root() {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const stored = localStorage.getItem('theme-preference')
      if (stored === 'light' || stored === 'dark') return stored
    } catch { /* ignore */ }
    return 'dark'
  })

  const setTheme = (t: AppTheme) => {
    setThemeState(t)
    try { localStorage.setItem('theme-preference', t) } catch { /* ignore */ }
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}

const w = window as Window & { __appRoot?: ReactDOM.Root; __appRootEl?: HTMLElement }
const container = document.getElementById('root')!

if (!w.__appRoot || w.__appRootEl !== container) {
  w.__appRoot = ReactDOM.createRoot(container)
  w.__appRootEl = container
}

// StrictMode's deliberate double-mount triggers AstraUI ThemeProvider's direct
// classList DOM writes twice, desynchronising React's fiber tree from the real
// DOM and producing the removeChild crash. Omit StrictMode in this project.
w.__appRoot.render(<Root />)
