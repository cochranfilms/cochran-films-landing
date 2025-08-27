'use client'

import { useEffect, useState } from 'react'
import { fetchCategoryItemsNormalized } from '../lib/airtableServer'
import CMSGrid from '../components/CMSGrid'

export default function Page(){
  const [videoItems, setVideoItems] = useState([])
  const [webItems, setWebItems] = useState([])
  const [photoItems, setPhotoItems] = useState([])
  const [brandItems, setBrandItems] = useState([])
  useEffect(() => { (async () => {
    setVideoItems(await fetchCategoryItemsNormalized('Video Production', 6))
    setWebItems(await fetchCategoryItemsNormalized('Web Development', 6))
    setPhotoItems(await fetchCategoryItemsNormalized('Photography', 6))
    setBrandItems(await fetchCategoryItemsNormalized('Brand Development', 6))
  })() }, [])

  return (
    <>
      <CMSGrid title="Video Production" subtitle="Rotates daily" items={videoItems} layout="gallery" />
      <CMSGrid title="Web Development" subtitle="Live links where available" items={webItems} layout="gallery" />
      <CMSGrid title="Photography" subtitle="Tap to view" items={photoItems} layout="masonry" />
      <CMSGrid title="Brand Development" subtitle="Identity systems and assets" items={brandItems} layout="gallery" />
    </>
  )
}

// old slideshow removed; using CMSGrid


