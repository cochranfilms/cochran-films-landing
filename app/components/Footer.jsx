export default function Footer(){
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <img src="/CF_Logo_White2025.png" alt="Cochran Films logo" />
        </div>
        <div className="footer-social">
          <a href="mailto:info@cochranfilms.com" className="social-link">
            <i className="fas fa-envelope"></i>
            Email
          </a>
          <a href="https://www.instagram.com/cochran.films" target="_blank" rel="noopener" className="social-link">
            <i className="fab fa-instagram"></i>
            Instagram
          </a>
          <a href="https://www.youtube.com/@cochranfilmsllc" target="_blank" rel="noopener" className="social-link">
            <i className="fas fa-youtube"></i>
            YouTube
          </a>
          <a href="https://github.com/cochranfilms" target="_blank" rel="noopener" className="social-link">
            <i className="fab fa-github"></i>
            GitHub
          </a>
        </div>
        <div className="footer-copyright">
          © 2025 Cochran Films LLC. All rights reserved.
        </div>
      </div>
    </footer>
  )
}


