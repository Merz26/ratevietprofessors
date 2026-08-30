import React, { createContext, useContext, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@figma/astraui'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import '@figma/astraui/styles.css'
import './index.css'

type AppTheme = 'light' | 'dark' | 'system'

interface ThemeCtx {
  theme: AppTheme
  setTheme: (t: AppTheme) => void
  resolvedTheme: 'light' | 'dark'
}

export const ThemeContext = createContext<ThemeCtx>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'dark',
})

export const useAppTheme = () => useContext(ThemeContext)

function Root() {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const stored = localStorage.getItem('astra-theme')
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored as AppTheme
    } catch { /* ignore */ }
    return 'system'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const updateResolved = () => {
      if (theme === 'system') {
        setResolvedTheme(media.matches ? 'dark' : 'light')
      } else {
        setResolvedTheme(theme)
      }
    }
    updateResolved()
    
    // Add event listener for media query
    media.addEventListener('change', updateResolved)
    return () => media.removeEventListener('change', updateResolved)
  }, [theme])

  const setTheme = (t: AppTheme) => {
    setThemeState(t)
    try { localStorage.setItem('astra-theme', t) } catch { /* ignore */ }
  }

  useEffect(() => {
    const root = document.documentElement
    if (root.classList.contains(resolvedTheme) && root.getAttribute('data-theme') === resolvedTheme) return
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
    root.setAttribute('data-theme', resolvedTheme)
  }, [resolvedTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
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
