import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu as MenuIcon, Moon, Sun, X } from 'lucide-react'
import { Button, Logo } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { NewsletterForm } from '@/components/public/NewsletterForm'

const NAV = [
  { to: '/fonctionnalites', label: 'Fonctionnalités' },
  { to: '/tarifs', label: 'Tarifs' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
]

export function PublicLayout() {
  const { isAuthenticated } = useAuth()
  const { theme, toggle } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0) }, [pathname])

  return (
    <>
      <a href="#main" className="sr-only">Aller au contenu</a>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="site-header__inner">
          <Logo />
          <nav className={`site-nav ${menuOpen ? 'open' : ''}`} aria-label="Navigation principale">
            {NAV.map((n) => <NavLink key={n.to} to={n.to}>{n.label}</NavLink>)}
          </nav>
          <div className="site-header__actions">
            <Button variant="ghost" size="sm" iconOnly icon={theme === 'dark' ? Sun : Moon} onClick={toggle}
              aria-label={theme === 'dark' ? 'Thème clair' : 'Thème sombre'} />
            {isAuthenticated ? (
              <Button to="/app" size="sm">Ouvrir mon espace</Button>
            ) : (
              <>
                <Button to="/connexion" variant="secondary" size="sm">Se connecter</Button>
                <Button to="/inscription" size="sm">Créer un compte</Button>
              </>
            )}
            <Button variant="ghost" size="sm" iconOnly className="site-menu-toggle" icon={menuOpen ? X : MenuIcon}
              onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen} />
          </div>
        </div>
      </header>

      <main id="main"><Outlet /></main>

      <footer className="site-footer">
        <div className="container">
          <div className="site-footer__grid">
            <div>
              <Logo />
              <p className="muted small" style={{ marginTop: '0.8rem', maxWidth: '34ch' }}>
                Déposez vos cours en PDF. Folio les résume, les explique et vous fait réviser.
              </p>
              <NewsletterForm />
            </div>
            <div>
              <h4>Produit</h4>
              <ul>
                <li><Link to="/fonctionnalites">Fonctionnalités</Link></li>
                <li><Link to="/tarifs">Tarifs</Link></li>
                <li><Link to="/tarifs#etablissements">Pour les établissements</Link></li>
                <li><Link to="/inscription">Créer un compte</Link></li>
              </ul>
            </div>
            <div>
              <h4>Aide</h4>
              <ul>
                <li><Link to="/faq">Questions fréquentes</Link></li>
                <li><Link to="/contact">Nous contacter</Link></li>
                <li><Link to="/contact?sujet=bug">Signaler un problème</Link></li>
              </ul>
            </div>
            <div>
              <h4>Folio</h4>
              <ul>
                <li><Link to="/a-propos">À propos</Link></li>
                <li><Link to="/confidentialite">Confidentialité</Link></li>
                <li><Link to="/conditions">Conditions d’utilisation</Link></li>
              </ul>
            </div>
          </div>
          <div className="site-footer__bottom">
            <span>© {new Date().getFullYear()} Folio. Fait pour les étudiants, à Casablanca.</span>
            <span>Vos documents restent les vôtres : ils ne servent jamais à entraîner un modèle.</span>
          </div>
        </div>
      </footer>
    </>
  )
}
