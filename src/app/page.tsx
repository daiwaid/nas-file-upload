'use client'

import { useState } from 'react'
import Browse from './components/Browse'
import Upload from './components/Upload'

export default function Home() {

  const [page, setPage] = useState(0)

  const togglePages = () => {
    setPage((page + 1) % 2)
  }

  const pages = [<Browse key={1} togglePages={togglePages} />, <Upload key={0} togglePages={togglePages} />]

  return (
    pages[page]
  )
}
