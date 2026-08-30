import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add mainRef and scroll logic
# We need to find where to add `mainRef` and `scrollPositions`
state_vars = """  const [activeSideNav, setActiveSideNav] = useState('home')"""
replacement = """  const [activeSideNav, setActiveSideNav] = useState('home')

  const mainRef = useRef<HTMLElement>(null)
  const scrollPositions = useRef<Record<string, number>>({})
  const lastPathname = useRef(location.pathname)

  useEffect(() => {
    if (!mainRef.current) return
    const prevParts = lastPathname.current.split('/').filter(Boolean)
    const currentParts = location.pathname.split('/').filter(Boolean)
    
    // We navigate to a lower level page if current parts is greater than prev parts
    if (currentParts.length >= prevParts.length) {
      // scroll to top
      mainRef.current.scrollTo({ top: 0, behavior: 'auto' })
    } else {
      // returned to a higher level page, restore scroll
      const savedScroll = scrollPositions.current[location.pathname] || 0
      mainRef.current.scrollTo({ top: savedScroll, behavior: 'auto' })
    }
    
    lastPathname.current = location.pathname
  }, [location.pathname, isLoadingData])
"""
content = content.replace(state_vars, replacement)

# 2. Add onScroll and ref to <main>
content = content.replace('<main className="flex-1 overflow-y-auto bg-transparent flex flex-col relative z-10">', 
                          '<main ref={mainRef} onScroll={(e) => { scrollPositions.current[location.pathname] = e.currentTarget.scrollTop }} className="flex-1 overflow-y-auto bg-transparent flex flex-col relative z-10">')

# 3. Fix the state clearing in the route parsing
route_parsing_old = """        if (parts[1]) {
          setSelectedDept(decodeURIComponent(parts[1]))
          if (parts[2]) {
            const prof = professors.find(p => p.id.toString() === parts[2])
            if (prof) {
              setSelectedProf(prof)
              setCurrentView('professor')
            } else {
              setCurrentView('department')
            }
          } else {
            setCurrentView('department')
          }
        } else {
          setCurrentView('institution')
        }"""
route_parsing_new = """        if (parts[1]) {
          setSelectedDept(decodeURIComponent(parts[1]))
          if (parts[2]) {
            const prof = professors.find(p => p.id.toString() === parts[2])
            if (prof) {
              setSelectedProf(prof)
              setCurrentView('professor')
            } else {
              setSelectedProf(null)
              setCurrentView('department')
            }
          } else {
            setSelectedProf(null)
            setCurrentView('department')
          }
        } else {
          setSelectedDept(null)
          setSelectedProf(null)
          setCurrentView('institution')
        }"""
content = content.replace(route_parsing_old, route_parsing_new)

with open('src/App.tsx', 'w') as f:
    f.write(content)

