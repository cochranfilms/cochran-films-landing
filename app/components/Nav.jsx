'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href) => pathname === href

  return (
    <nav className="nav-wrapper" role="navigation" aria-label="Main navigation">
      <div className="nav-container">
        <Link href="/home" className="nav-logo">
          <Image src="/CF_Logo_White2025.png" alt="Cochran Films logo" width={96} height={48} priority />
        </Link>

        <ul className={`nav-menu ${open ? 'show' : ''}`}>
          <li className="nav-item">
            <Link href="/home" className="nav-link">Home</Link>
          </li>
          <li className="nav-item">
            <Link href="/about" className="nav-link">About</Link>
          </li>
          <li className="nav-item">
            <Link href="/services" className={`nav-link ${isActive('/services') ? 'active' : ''}`}>Services</Link>
          </li>
          <li className="nav-item has-submenu">
            <Link href="/portfolio" className="nav-link">Portfolio <i className="fas fa-chevron-down dropdown-caret" aria-hidden="true"></i></Link>
            <ul className="submenu" aria-label="Portfolio Categories">
              <li><Link href="/portfolio#video-production" className="submenu-link">Video Production</Link></li>
              <li><Link href="/portfolio#web-development" className="submenu-link">Web Development</Link></li>
              <li><Link href="/portfolio#photography" className="submenu-link">Photography</Link></li>
              <li><Link href="/portfolio#brand-development" className="submenu-link">Brand Development</Link></li>
            </ul>
          </li>
          <li className="nav-item">
            <Link href="/blog" className="nav-link">Blog</Link>
          </li>
          <li className="nav-item">
            <Link href="/contact" className="nav-link">Contact</Link>
          </li>
          <li className="nav-item">
            <Link href="/book.html" className="nav-link nav-cta">Book Services</Link>
          </li>
        </ul>

        <button className="mobile-menu-toggle" aria-label="Toggle mobile menu" onClick={() => setOpen(!open)}>
          <i className="fas fa-bars"></i>
        </button>
      </div>
    </nav>
  )
}


