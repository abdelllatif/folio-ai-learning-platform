import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { UploadModal } from '@/components/documents/UploadModal'

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => { setNavOpen(false) }, [pathname])
  useEffect(() => {
    const open = () => setUploadOpen(true)
    window.addEventListener('folio:upload', open)
    return () => window.removeEventListener('folio:upload', open)
  }, [])

  return (
    <div className="app">
      <a href="#app-main" className="sr-only">Aller au contenu</a>
      <Sidebar open={navOpen} />
      <div className={`backdrop ${navOpen ? 'open' : ''}`} onClick={() => setNavOpen(false)} />
      <div className="main">
        <Topbar onMenu={() => setNavOpen(true)} onUpload={() => setUploadOpen(true)} />
        <main id="app-main" className="content"><Outlet /></main>
      </div>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}

/** Any component can open the upload dialog without prop drilling. */
export const openUpload = () => window.dispatchEvent(new Event('folio:upload'))
