'use client'

import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import MediaViewer from './MediaViewer'
import { image, table } from '../Types'
import './Browse.css'
import PageMenu from './PageMenu'
import Upload from './Upload'
import Icon from './Icon'

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
  const parentDiv = useRef<any>()
  const windowSize = useRef<any>()
  
  

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
    const p = axios.get('http://192.168.1.252/serve.php')
      p.then(r => {
        const pgs: table[] = Object.values(r.data);
        pages.current = JSON.parse(JSON.stringify(pgs))
        reloadImgs()
        setCurrPage(0)
      })
  }

  const fetchImgs = async (cond=false, page=loadPage.current, callbackfn=lazyLoadImgs, force=false): Promise<any> => {
    if (!fetching.current) {
      fetching.current = true
      const tblName = pages.current[page].name
      if (force || !images.current[tblName]) {
        const p = await axios.get('http://192.168.1.252/serve.php?name=' + pages.current[page].name)
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
    fetchImgs(true)
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
          new Image().src = 'http://192.168.1.252' + table[indicies[0]-1].thumb
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
          new Image().src = 'http://192.168.1.252' + images.current[prevPage.name][ind].thumb
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
        new Image().src = 'http://192.168.1.252' + table[indicies[0]+1].thumb
      else
        return Promise.resolve([indicies[0] + 1, indicies[1]])
    }
    else if (indicies[1] < pages.current.length - 1) {
      const nextPage = pages.current[indicies[1] + 1]

      if (images.current[nextPage.name]) { // if next page already fetched
        if (preload)
          new Image().src = 'http://192.168.1.252' + images.current[nextPage.name][0].thumb
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
    if (img.table) {
      return axios.post('http://192.168.1.252/remove.php', {
        table: img.table,
        name: img.name
      }).then(
        r => fetchImgs(false, selectedInd[1], ()=>Promise.resolve(true), true)
      ).catch( r => Promise.resolve(false) )
    }
    return Promise.resolve(false)
  }

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
    if (window.innerWidth < 700) numCols.current = 1
    else if (window.innerWidth < 1120) numCols.current = 2
    else if (window.innerWidth < 1600) numCols.current = 3
    else numCols.current = 4
    lastWindow.current = {height: windowSize.current.clientHeight, width: windowSize.current.clientWidth}
    setColFlex(1/numCols.current * 100)
    fetchPages()

    setAspectRatio(window.innerWidth / window.innerHeight)
  }, [])

  const updateCurrPage = (ind: number) => {
    if (ind >= 0 && ind < pages.current.length) {
      loadPage.current = ind
      setCurrPage(ind)
      reloadImgs()
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
      document.documentElement.style.overflowY = 'hidden'
      parentDiv.current.style.overflowY = 'scroll'

    }
    else {
      document.documentElement.style.overflowY = 'auto'
      parentDiv.current.style.overflowY = 'visible'
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
      lastWindow.current = {height: windowSize.current.clientHeight, width: windowSize.current.clientWidth}
      setColFlex(1/cols * 100)
      reloadImgs()
    }
  }

  const onResize = () => {
    if (Math.abs(lastWindow.current.width - windowSize.current.clientWidth) 
          + Math.abs(lastWindow.current.height - windowSize.current.clientHeight) > 5) {

      if (windowSize.current.clientWidth < 700) setNumCols(1)
      else if (windowSize.current.clientWidth < 1120) setNumCols(2)
      else if (windowSize.current.clientWidth < 1600) setNumCols(3)
      else setNumCols(4)
      
      setAspectRatio(windowSize.current.clientWidth / windowSize.current.clientHeight)
      lastWindow.current = {height: windowSize.current.clientHeight, width: windowSize.current.clientWidth}
    }
  }

  return (
    <div className='falsescroll' ref={parentDiv} tabIndex={-1}>
      <div className="windowsize" ref={windowSize} tabIndex={-1}></div>
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
            <Upload reloadImgs={reloadImgs} />
          </div>
        </div>
      </div>
      {showViewer 
        ? <MediaViewer selectedInd={selectedInd} aspectRatio={aspectRatio} setSelectedInd={setSelectedInd} showViewer={setShowViewer} 
              getImage={getImage} deleteImg={deleteImg} setScroll={setScroll} getPrev={getPrev} getNext={getNext} /> 
        : <></> }
      <div className="grid">
        {columns.map((col, i) =>
          <div key={i} className='column' style={{flex: `${colFlex}%`, maxWidth: `${colFlex}%`}}>
            {col.map((img) => <img key={img.path} src={'http://192.168.1.252' + img.thumb} alt={img.name} onClick={(e) => onSelect(e.currentTarget, img)} />)}
          </div>
        )}
      </div>
    </div>
  )
}