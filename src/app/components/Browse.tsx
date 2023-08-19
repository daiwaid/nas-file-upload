'use client'

import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import MediaViewer from './MediaViewer'
import { image, table } from '../Types'
import './browse.css'
import PageMenu from './PageMenu'

export default function Browse({ togglePages }: { togglePages: () => void }) {

  const pages = useRef<table[]>([])
  const [currPage, setCurrPage] = useState<number>(2)
  const loadPage = useRef<number>(0)
  const pageHeights = useRef<number[]>([])
  const phCurr = useRef<number>(0)

  const images = useRef<{[key: string]: image[]}>({})
  const numLoaded = useRef<number>(0)
  const loadedHeight = useRef<number>(0)
  const [columns, setColumns] = useState<image[][]>([])
  const columnHeights = useRef<number[]>([])
  const numCols = useRef<number>(4)

  const fetching = useRef<boolean>(false)
  const lastScroll = useRef<number>(0)
  const lastWindow = useRef<number>(0)
  const prevButton = useRef<any>(null)
  const nextButton = useRef<any>(null)
  const [selected, setSelected] = useState<image>({} as image)
  const selectedInd = useRef<number[]>([0, 0]) // 0: image index, 1: table index
  const [hideButtons, setHideButtons] = useState<boolean[]>([false, false])
  const mediaViwer = useRef<any>(null)
  const scrollable = useRef<boolean>(true)
  const lastY = useRef<number>(0)
  

  const lazyLoadImgs = (clear=false) => {
    if (!pages.current[currPage]) return

    const tblName = pages.current[loadPage.current].name
    if (!images.current[tblName] || fetching.current) return

    if (clear) {
      pageHeights.current = []
      phCurr.current = 0
      loadedHeight.current = 0
      numLoaded.current = 0
      window.scrollTo(0, 0)
    }

    // if all images for current page has been loaded, fetch next page
    if (numLoaded.current === images.current[tblName].length && loadPage.current < pages.current.length-1) {
      pageHeights.current.push(loadedHeight.current + 10)
      numLoaded.current = 0
      loadPage.current += 1
      return fetchImgs()
    }

    // if almost viewed all loaded images and there are more images to load
    if (numLoaded.current < images.current[tblName].length && window.scrollY + window.innerHeight * 2 > loadedHeight.current) {
      const actualWidth = window.innerWidth / numCols.current
      const newHeight = loadedHeight.current + window.innerHeight * 2
      
      let newColumns: image[][]
      if (clear) {
        newColumns = []
        while (newColumns.length < numCols.current) newColumns.push([])
        columnHeights.current = new Array(numCols.current).fill(0)
      }
      else newColumns = [...columns]
      
      // add images until all columns are long enough
      let i = numLoaded.current
      while (Math.min(...columnHeights.current) < newHeight && numLoaded.current < images.current[tblName].length) {
        const col = columnHeights.current.reduce((p, c, i, a) => c >= a[p] ? p : i, -1)
        const imgRatio = Number(images.current[tblName][numLoaded.current].height) / Number(images.current[tblName][numLoaded.current].width)
        columnHeights.current[col] += imgRatio * actualWidth
        newColumns[col].push(images.current[tblName][numLoaded.current])
        numLoaded.current += 1
      }

      loadedHeight.current = Math.min(...columnHeights.current)
      setColumns(newColumns)
    }
  }

  const fetchPages = () => {
    const p = axios.get('http://192.168.1.252/serve.php')
      p.then(r => {
        const pgs: table[] = Object.values(r.data);
        pages.current = JSON.parse(JSON.stringify(pgs))
        fetchImgs(true)
        setCurrPage(0)
      })
  }

  const fetchImgs = (clear=false, page=loadPage.current, callbackfn=lazyLoadImgs) => {
    fetching.current = true
    const tblName = pages.current[page].name
    if (!images.current[tblName]) {
      const p = axios.get('http://192.168.1.252/serve.php?name=' + pages.current[page].name)
      p.then(r => {
        const imgs: image[] = Object.values(r.data);
        const tblName = pages.current[page].name
        const imgsCpy: image[] = []
        for (const img of imgs) {
          imgsCpy.push({...img, table: tblName})
        }
        images.current[tblName] = imgsCpy
        fetching.current = false
        callbackfn(clear)
      })
    }
    else {
      fetching.current = false
      callbackfn(clear)
    }
  }

  const getPrev = () => {
    // if image is in current page
    if (selectedInd.current[0] > 0 && selected.table) {
      const table = images.current[selected.table]
      selectedInd.current[0] -= 1
      setSelected(table[selectedInd.current[0]])
    }
    else if (selectedInd.current[1] > 0) {
      // if prev page is already fetched
      const prevPage = pages.current[selectedInd.current[1] - 1]
      if (images.current[prevPage.name]) {
        const ind = images.current[prevPage.name].length - 1
        selectedInd.current = [ind, selectedInd.current[1] - 1]
        setSelected(images.current[prevPage.name][ind])
      }
      // else fetch page and try again
      else {
        fetchImgs(false, selectedInd.current[1] - 1, getNext)
      }
    }
  }

  const getNext = () => {
    const table = selected.table ? images.current[selected.table] : undefined
    // if image is in current page
    if (table && selectedInd.current[0] < table.length - 1) {
      selectedInd.current[0] += 1
      setSelected(table[selectedInd.current[0]])
    }
    else if (selectedInd.current[1] < pages.current.length - 1) {
      // if next page already fetched
      const nextPage = pages.current[selectedInd.current[1] + 1]
      if (images.current[nextPage.name]) {
        selectedInd.current = [0, selectedInd.current[1] + 1]
        setSelected(images.current[nextPage.name][0])
      }
      // else fetch page and try again
      else {
        fetchImgs(false, selectedInd.current[1] + 1, getNext)
      }
    }
  }

  useEffect(() => {
    if (nextButton.current) {
      if (currPage === 0) {
        nextButton.current.style.opacity = 0
        nextButton.current.style.cursor = 'default'
      }
      else {
        nextButton.current.style.opacity = 1
        nextButton.current.style.cursor = 'pointer'
      }
    }
    if (prevButton.current) {
      if (currPage === pages.current.length-1) {
        prevButton.current.style.opacity = 0
        prevButton.current.style.cursor = 'default'
      }
      else {
        prevButton.current.style.opacity = 1
        prevButton.current.style.cursor = 'pointer'
      }
    }
  }, [currPage])

  // add scroll event listener
  useEffect(() => {
    document.addEventListener('scroll', onScroll)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [columns, currPage])

  useEffect(() => {
    lazyLoadImgs()
  }, [columns])

  useEffect(() => {
    showHideButtons()
  }, [selected])

  // loads images on page start
  useEffect(() => {
    if (window.innerWidth < 800) numCols.current = 2
    lastWindow.current = window.innerWidth
    fetchPages()
  }, [])

  const updateCurrPage = (ind: number) => {
    if (ind >= 0 && ind < pages.current.length) {
      setCurrPage(ind)
      loadPage.current = ind
      fetchImgs(true)
    }
  }

  const updateHeader = () => {
    const threashold = window.scrollY === 0 ? window.scrollY : window.scrollY + 100
    if (pageHeights.current[phCurr.current] !== undefined && threashold >= pageHeights.current[phCurr.current] && currPage < pages.current.length - 1) {
      phCurr.current += 1
      setCurrPage(currPage + 1)
    }
    else if (phCurr.current > 0 && currPage > 0 && threashold < pageHeights.current[phCurr.current - 1]) {
      phCurr.current -= 1
      setCurrPage(currPage - 1)
    }
  }

  const setScroll = (state: boolean) => {
    scrollable.current = state
    if (!state) lastY.current = window.scrollY
  }

  const onScroll = () => {
    if (!scrollable.current) {
      window.scrollTo(0, lastY.current)
    }
    if (window.scrollY === 0 || Math.abs(window.scrollY - lastScroll.current) > 100) {
      updateHeader()
      lazyLoadImgs()
      lastScroll.current = window.scrollY
    }
  }

  const onSelect = (img: image) => {
    // get index of curr image
    if (img.table) {
      const table = images.current[img.table]
      for (let i = 0; i < table.length; i++) {
        if (table[i].id === img.id) {
          selectedInd.current[0] = i
          break
        }
      }
      for (let i = 0; i < pages.current.length; i++) {
        if (pages.current[i].name === img.table) {
          selectedInd.current[1] = i
          break
        }
      }
    }

    if (mediaViwer.current) {
      mediaViwer.current.style.display = 'inline'
    }
    document.documentElement.style.overflow = 'hidden'

    setSelected(img)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') getPrev()
    else if (event.key === 'ArrowRight') getNext()
    else if (event.key === 'Escape') setSelected({} as image)

  }

  const handleResize = () => {
    if (Math.abs(lastWindow.current - window.innerWidth) > 100) {
      if (window.innerWidth < 700) numCols.current = 2
      else if (window.innerWidth < 1120) numCols.current = 3
      else numCols.current = 4
      loadPage.current = currPage
      lastWindow.current = window.innerWidth
      fetchImgs(true)
    }
  }

  const showHideButtons = () => {
    const hide = [false, false]
    if (selectedInd.current[1] === 0 && selectedInd.current[0] === 0)
      hide[0] = true

    if (selectedInd.current[1] === pages.current.length - 1) {
      const table = selected.table ? images.current[selected.table] : undefined
      if (table && selectedInd.current[0] === table.length - 1)
        hide[1] = true
    }
    setHideButtons(hide)
  }

  const arrow = <svg viewBox='0 0 50 50' className='btn'>
                  <path d="M 15 10 L 30 25"/>
                  <path d="M 15 40 L 30 25"/>
                </svg>

  const upload = <svg viewBox='0 0 50 50' className='btn'>
                  <path d="M 10 25 L 40 25"/>
                  <path d="M 25 10 L 25 40"/>
                </svg>

  return (
    <div onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="title">
        <div className='title-left'></div>
        <div className='title-right' ref={prevButton} onClick={() => updateCurrPage(currPage + 1)} style={{rotate: '180deg'}}>{arrow}</div>
        <div className='title-center'>
          {pages.current[currPage] ? pages.current[currPage].year + '-' + pages.current[currPage].month : ''}
        </div>
        <div className='title-left' ref={nextButton} onClick={() => updateCurrPage(currPage - 1)}>{arrow}</div>
        <div className='title-right' onClick={togglePages}>{upload}</div>
      </div>
      <PageMenu pages={pages.current} currPage={currPage} updateCurrPage={updateCurrPage} setScroll={setScroll}/>
      <MediaViewer selected={selected} setSelected={setSelected} getPrev={getPrev} getNext={getNext} hideButtons={hideButtons} />
      <div className="grid">
        {columns.map(((col, i) =>
          <div key={i} className='column'>
            {col.map(img => <img key={img.path} src={'http://192.168.1.252' + img.thumb} alt={img.name} onClick={() => onSelect(img)} />)}
          </div>
        ))}
      </div>
    </div>
    
  )
}