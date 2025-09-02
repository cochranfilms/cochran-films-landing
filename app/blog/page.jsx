'use client'
import { useEffect, useState } from 'react'

export default function Page(){
  const [posts, setPosts] = useState([])
  useEffect(() => { loadPosts() }, [])
  async function loadPosts(){
    try { const r = await fetch('/blog/posts.json', { cache: 'no-store' }); const p = await r.json(); setPosts(p||[]) } catch {}
  }
  const featured = posts.length ? posts[(new Date().getDay()) % posts.length] : null
  return (
    <section id="blog" className="section">
      <div className="section-header"><h2 className="section-title">Blog</h2><p className="section-subtitle">Stay updated with the latest trends in video production, web development, and creative marketing. Expert insights from our team.</p></div>
      <div className="blog-content">
        <article className="featured-blog" id="featuredBlogPost">
          {featured && (
            <>
              <div className="featured-blog-header"><span className="featured-badge">Featured</span><span className="featured-blog-category"><i className="fa-solid fa-newspaper"></i> {featured.category}</span></div>
              <h3 className="featured-blog-title">{featured.title}</h3>
              <p className="featured-blog-excerpt">{featured.summary || 'Discover the latest insights and trends in this featured article.'}</p>
              <div className="featured-blog-meta"><span className="featured-blog-date"><i className="fa-regular fa-calendar"></i> {new Date(featured.publishedAt||Date.now()).toLocaleDateString()}</span></div>
              <a href={`/blog-post.html?id=${encodeURIComponent(btoa(featured.url||''))}`} className="featured-blog-cta">Read Full Article <i className="fa-solid fa-arrow-right"></i></a>
            </>
          )}
        </article>
        <div className="blog-grid" id="blogGrid">
          {posts.slice(0,6).map(post => (
            <article key={post.url} className="blog-item" onClick={()=>window.open(post.url,'_blank')}>
              <div className="blog-thumbnail">{post.image ? <img src={post.image} alt={post.title} loading="lazy"/> : <div style={{background:'linear-gradient(45deg, rgba(99,102,241,0.3), rgba(255,178,0,0.3))',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',fontSize:24}}><i className="fas fa-newspaper"></i></div>}</div>
              <div className="blog-content-inner">
                <div className="blog-category"><i className="fas fa-newspaper"></i>{post.category}</div>
                <h3 className="blog-title">{post.title}</h3>
                <p className="blog-excerpt">{post.summary}</p>
                <div className="blog-meta"><span className="blog-date"><i className="fas fa-calendar"></i> {new Date(post.publishedAt||Date.now()).toLocaleDateString()}</span><span className="blog-read-more">Read More <i className="fas fa-arrow-right"></i></span></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}


