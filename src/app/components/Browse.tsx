'use client'

import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { API_BASE } from '../api'
import MediaViewer from './MediaViewer'
import { image, table } from '../Types'
import './browse.css'
import PageMenu from './PageMenu'
import Upload from './Upload'
import Icon from './Icon'
import ImgPreview from './ImgPreview'

const POLL_MS = 30000

export default function Browse() {

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
  const [colFlex, setColFlex] = useState<number>(100)
  const [showViewer, setShowViewer] = useState<boolean>(false)
  const [selectedInd, setSelectedInd] = useState<number[]>([0, 0]) // 0: image index, 1: table index
  const [aspectRatio, setAspectRatio] = useState<number>(1)
  
  const fetching = useRef<boolean>(false)
  const lastScroll = useRef<number>(0)
  const lastWindow = useRef({height: 1, width: 1})
  const prevButton = useRef<any>(null)
  const nextButton = useRef<any>(null)
  const zoomIn = useRef<any>(null)
  const zoomOut = useRef<any>(null)
  const parentDiv = useRef<any>(null)
  const columnsRef = useRef<image[][]>([])
  const selectedIndRef = useRef(selectedInd)
  const syncFeedRef = useRef<() => Promise<void>>(async () => {})
  columnsRef.current = columns
  selectedIndRef.current = selectedInd

  const lazyLoadImgs = async (clear=false): Promise<any> => {
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
    axios.get(`${API_BASE}/serve.php`)
      .then(r => {
        const pgs: table[] = Object.values(r.data);
        pages.current = JSON.parse(JSON.stringify(pgs))
        images.current = {}
        fetching.current = false
        updateCurrPage(0)
      })
  }

  const fetchImgs = async (cond=false, page=loadPage.current, callbackfn=lazyLoadImgs, force=false): Promise<any> => {
    if (!fetching.current) {
      fetching.current = true
      const tblName = pages.current[page].name
      if (force || !images.current[tblName]) {
        const p = await axios.get(`${API_BASE}/serve.php?name=` + pages.current[page].name)
        const imgs: image[] = Object.values(p.data)
        const tblName_1 = pages.current[page].name
        const imgsCpy: image[] = []
        for (const img of imgs) {
          imgsCpy.push({ ...img, table: tblName_1 })
        }
        images.current[tblName_1] = imgsCpy
        fetching.current = false
        return callbackfn(cond)
      }
      else {
        fetching.current = false
        return callbackfn(cond)
      }
    }
    return Promise.resolve()
  }

  const reloadImgs = () => {
    fetchImgs(true, currPage)
  }

  const getImage = (inds: number[]|undefined): image|undefined => {
    if (!inds) return undefined
    const selectedPage = pages.current[inds[1]].name
    const table = images.current[selectedPage]
    return table[inds[0]]
  }

  const getPrev = async (preload=false, indicies=selectedInd): Promise<number[]|undefined> => {
    const selectedPage = pages.current[indicies[1]].name

    // if image is in current page
    if (indicies[0] > 0) {
      const table = images.current[selectedPage]
      if (preload) {
        if (table[indicies[0]-1])
          new Image().src = API_BASE + table[indicies[0]-1].thumb
      }
      else {
        return Promise.resolve([indicies[0]-1, indicies[1]])
      }
    }
    else if (indicies[1] > 0) {
      const prevPage = pages.current[indicies[1] - 1]
      
      if (images.current[prevPage.name]) { // if prev page is already fetched
        const ind = images.current[prevPage.name].length - 1
        if (preload)
          new Image().src = API_BASE + images.current[prevPage.name][ind].thumb
        else
          return Promise.resolve([ind, indicies[1] - 1])
      }
      else { // else fetch page and return undefined for now
        return fetchImgs(preload, indicies[1] - 1, () => getPrev(preload, indicies))
      }
    }
    // if no more
    return Promise.resolve(undefined)
  }

  const getNext = async (preload=false, indicies=selectedInd): Promise<number[]|undefined> => {
    const selectedPage = pages.current[indicies[1]].name
    const table = images.current[selectedPage]

    // if image is in current page
    if (table && indicies[0] < table.length - 1) {
      if (preload)
        new Image().src = API_BASE + table[indicies[0]+1].thumb
      else
        return Promise.resolve([indicies[0] + 1, indicies[1]])
    }
    else if (indicies[1] < pages.current.length - 1) {
      const nextPage = pages.current[indicies[1] + 1]

      if (images.current[nextPage.name]) { // if next page already fetched
        if (preload)
          new Image().src = API_BASE + images.current[nextPage.name][0].thumb
        else
          return Promise.resolve([0, indicies[1] + 1])
      }
      else { // else fetch page and return undefined for now
        return fetchImgs(preload, indicies[1] + 1, () => getNext(preload, indicies))
      }
    }
    // reached the end
    return Promise.resolve(undefined)
  }

  // delete the currently selected image
  const deleteImg = (img: image): Promise<boolean> => {
    const tblName = img.table
    if (tblName) {
      return axios.post(`${API_BASE}/remove.php`, {
        table: tblName,
        name: img.name
      }).then(() => {
        const table = images.current[tblName]
        if (table) {
          const idx = table.findIndex((i: image) => i.path === img.path)
          if (idx !== -1) {
            table.splice(idx, 1)
            if (tblName === pages.current[loadPage.current]?.name && idx < numLoaded.current) {
              numLoaded.current -= 1
            }
          }
        }
        setColumns(cols => cols.map(col => col.filter(i => i.path !== img.path)))
        return true
      }).catch(() => false)
    }
    return Promise.resolve(false)
  }

  const relayoutLoaded = () => {
    const shown = columnsRef.current.flat()
    const startName = shown.find(img => img.table && images.current[img.table])?.table
      ?? pages.current[loadPage.current]?.name
    const startInd = pages.current.findIndex(p => p.name === startName)
    if (startInd < 0) return

    const targetCount = Math.max(shown.length, 1)
    const targetHeight = Math.max(loadedHeight.current, window.scrollY + window.innerHeight * 2)
    const actualWidth = window.innerWidth / numCols.current
    const newColumns: image[][] = Array.from({ length: numCols.current }, () => [])
    columnHeights.current = new Array(numCols.current).fill(0)
    pageHeights.current = []

    let pageInd = startInd
    let count = 0
    while (pageInd < pages.current.length) {
      const tblName = pages.current[pageInd].name
      const list = images.current[tblName]
      if (!list) {
        if (pageInd > startInd) {
          loadPage.current = pageInd - 1
          numLoaded.current = images.current[pages.current[pageInd - 1].name].length
        }
        break
      }

      let i = 0
      while (i < list.length && (count < targetCount || Math.min(...columnHeights.current) < targetHeight)) {
        const col = columnHeights.current.reduce((p, c, idx, a) => c >= a[p] ? p : idx, -1)
        const img = list[i]
        columnHeights.current[col] += Number(img.height) / Number(img.width) * actualWidth
        newColumns[col].push(img)
        count++
        i++
      }

      if (i < list.length) {
        numLoaded.current = i
        loadPage.current = pageInd
        break
      }

      pageHeights.current.push(Math.min(...columnHeights.current) + 10)
      pageInd += 1
      numLoaded.current = 0
      loadPage.current = pageInd < pages.current.length ? pageInd : pageInd - 1
    }

    loadedHeight.current = columnHeights.current.length ? Math.min(...columnHeights.current) : 0
    const threshold = window.scrollY === 0 ? 0 : window.scrollY + 100
    let ph = 0
    while (ph < pageHeights.current.length && threshold >= pageHeights.current[ph]) ph++
    phCurr.current = ph
    setCurrPage(startInd + ph)
    setColumns(newColumns)
  }

  const syncFeed = async () => {
    if (fetching.current || document.hidden || pages.current.length === 0) return

    const sel = selectedIndRef.current
    const selPath = images.current[pages.current[sel[1]]?.name]?.[sel[0]]?.path
    const loadName = pages.current[loadPage.current]?.name

    fetching.current = true
    let changed = false
    try {
      const pgs: table[] = Object.values((await axios.get(`${API_BASE}/serve.php`)).data)
      if (pgs.length !== pages.current.length || pgs.some((p, i) => p.name !== pages.current[i]?.name))
        changed = true
      pages.current = JSON.parse(JSON.stringify(pgs))

      const valid = new Set(pgs.map(p => p.name))
      for (const name of Object.keys(images.current)) {
        if (!valid.has(name)) {
          delete images.current[name]
          changed = true
        }
      }

      for (const page of pgs) {
        if (!images.current[page.name]) continue
        const res = await axios.get(`${API_BASE}/serve.php?name=` + page.name)
        const fresh: image[] = (Object.values(res.data) as image[]).map(img => ({ ...img, table: page.name }))
        const prev = images.current[page.name]
        if (fresh.length !== prev.length || fresh.some((img, i) => img.path !== prev[i].path)) {
          images.current[page.name] = fresh
          changed = true
        }
      }

      const newLoad = pages.current.findIndex(p => p.name === loadName)
      if (newLoad >= 0) loadPage.current = newLoad

      if (selPath) {
        for (let p = 0; p < pgs.length; p++) {
          const idx = images.current[pgs[p].name]?.findIndex(i => i.path === selPath) ?? -1
          if (idx >= 0) {
            if (idx !== sel[0] || p !== sel[1]) setSelectedInd([idx, p])
            break
          }
        }
      }
    } catch {
      fetching.current = false
      return
    }
    fetching.current = false
    if (changed) relayoutLoaded()
  }
  syncFeedRef.current = syncFeed

  // add scroll event listener
  useEffect(() => {
    document.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [columns, currPage])

  useEffect(() => {
    lazyLoadImgs()
  }, [columns])

  useEffect(() => {
    if (nextButton.current) {
      if (currPage === 0)
        nextButton.current.classList.add('inactive')
      else
        nextButton.current.classList.remove('inactive')
    }
    if (prevButton.current) {
      if (currPage === pages.current.length-1)
        prevButton.current.classList.add('inactive')
      else
        prevButton.current.classList.remove('inactive')
    }
  }, [currPage])

  useEffect(() => {
    if (numCols.current === 1)
      zoomIn.current.classList.add('inactive')
    else
      zoomIn.current.classList.remove('inactive')
    if (numCols.current === 7)
      zoomOut.current.classList.add('inactive')
    else
      zoomOut.current.classList.remove('inactive')
  }, [colFlex])

  // loads images on page start
  useEffect(() => {
    if (window.innerWidth < 700)
      numCols.current = 1
    else if (window.innerWidth < 1120)
      numCols.current = 2
    else if (window.innerWidth < 1600)
      numCols.current = 3
    else
      numCols.current = 4

    lastWindow.current = {height: window.innerHeight, width: window.innerWidth}
    setColFlex(1/numCols.current * 100)
    fetchPages()

    setAspectRatio(window.innerWidth / window.innerHeight)
  }, [])

  useEffect(() => {
    const tick = () => { syncFeedRef.current() }
    const id = setInterval(tick, POLL_MS)
    const onVis = () => { if (!document.hidden) tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const updateCurrPage = (ind: number) => {
    if (ind >= 0 && ind < pages.current.length) {
      loadPage.current = ind
      setCurrPage(ind)
      fetchImgs(true, ind)
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
    if (!state) {
      document.body.style.overflow = 'hidden'
      // document.body.style.height = '100vh'
      parentDiv.current.style.overflow = 'scroll'
    }
    else {
      document.body.style.overflow = 'auto'
      // document.body.style.height = 'auto'
      parentDiv.current.style.overflow = 'visible'
    }
  }

  const onScroll = () => {
    if (window.scrollY === 0 || Math.abs(window.scrollY - lastScroll.current) > 100) {
      updateHeader()
      lazyLoadImgs()
      lastScroll.current = window.scrollY
    }
  }

  const onSelect = (ref: any, img: image) => {
    // get index of curr image
    if (img.table) {
      const newInd = [0, 0]

      const table = images.current[img.table]
      for (let i = 0; i < table.length; i++) {
        if (table[i].id === img.id) {
          newInd[0] = i
          break
        }
      }
      for (let i = 0; i < pages.current.length; i++) {
        if (pages.current[i].name === img.table) {
          newInd[1] = i
          break
        }
      }

      setSelectedInd(newInd)
      setShowViewer(true)
    }
  }

  const setNumCols = (cols: number) => {
    if (cols > 0 && cols < 8 && numCols.current !== cols) {
      numCols.current = cols
      loadPage.current = currPage
      lastWindow.current = {height: window.innerHeight, width: window.innerWidth}
      setColFlex(1/cols * 100)
      reloadImgs()
    }
  }

  const onResize = () => {
    if (Math.abs(lastWindow.current.width - window.innerWidth) 
          + Math.abs(lastWindow.current.height - window.innerHeight) > 5) {

      if (window.innerWidth < 700)
        setNumCols(1)
      else if (window.innerWidth < 1120)
        setNumCols(2)
      else if (window.innerWidth < 1600)
        setNumCols(3)
      else
        setNumCols(4)
      
      setAspectRatio(window.innerWidth / window.innerHeight)
      lastWindow.current = {height: window.innerHeight, width: window.innerWidth}
    }
  }

  return (
    <div className='falsescroll' ref={parentDiv} tabIndex={-1}>
      <div className="title">
        <div className='title-left'>
          <div className='item-left'></div>
          <div className='item-right' ref={nextButton} onClick={() => updateCurrPage(currPage - 1)} style={{rotate: '180deg'}}><Icon icon='arrow'/></div>
        </div>
        <PageMenu pages={pages.current} currPage={currPage} updateCurrPage={updateCurrPage} setScroll={setScroll}/>
        <div className='title-right'>
          <div className='item-left' ref={prevButton} onClick={() => updateCurrPage(currPage + 1)}>{<Icon icon='arrow'/>}</div>
          <div className='title-right-grid'>
            <div className='item-right' ref={zoomIn} onClick={() => setNumCols(numCols.current-1)}>{<Icon icon='magnifyUp' className='nonmobile'/>}</div>
            <div className='item-right' ref={zoomOut} onClick={() => setNumCols(numCols.current+1)}>{<Icon icon='magnifyDown' className='nonmobile'/>}</div>
            <Upload refresh={fetchPages} />
          </div>
        </div>
      </div>
      {showViewer 
        ? <MediaViewer selectedInd={selectedInd} aspectRatio={aspectRatio} setSelectedInd={setSelectedInd} showViewer={setShowViewer} 
              getImage={getImage} deleteImg={deleteImg} setScroll={setScroll} getPrev={getPrev} getNext={getNext} /> 
        : <></> }
      <div className="grid">
        {columns.map((col, i) =>
          <div key={i} className='column' style={{flex: `${colFlex}%`, maxWidth: `${colFlex}%`, padding: `0 3px`}}>
            {col.map((img) => <ImgPreview key={img.path} img={img} width={colFlex} margin={3} cols={numCols.current} onClick={(e) => onSelect(e.currentTarget, img)} /> 
            )}
          </div>
        )}
      </div>
    </div>
  )
}