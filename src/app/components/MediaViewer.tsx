'use client'

import { Dispatch, useEffect, useRef, useState } from 'react'
import { image } from '../Types'
import './mediaViewer.css'

export default function MediaViewer({ selected, closeViewer, getPrev, getNext, removeImg, hideButtons }: 
                        { selected: image, closeViewer: () => void, getPrev: (preload: boolean) => void, 
                          getNext: (preload: boolean, fillImg?: boolean) => void, removeImg: () => void, hideButtons: boolean[]}) {

  const [fullscreen, setFullscreen] = useState<boolean>(false)
  const [slideshow, setSlideshow] = useState<boolean>(false)
  const slideInterval = useRef<NodeJS.Timer>()
  const interval = useRef<NodeJS.Timer>()
  const hidden = useRef<boolean>(false)
  const fullscrTime = useRef<number>(0)
  const lBttn = useRef<any>()
  const rBttn = useRef<any>()
  const titleBar = useRef<any>()
  const imgContainer = useRef<any>()

  const hideViewer = () => {
    document.documentElement.style.overflow = 'auto'
    if (fullscreen) {
      document.exitFullscreen()
      if (interval.current) clearInterval(interval.current)
      document.documentElement.style.cursor = 'auto'
    }
    closeViewer()
  }

  const loadPrev = () => {
    getPrev(false)
    getPrev(true)
  }

  const loadNext = (fullImg=false) => {
    getNext(false)
    getNext(true, fullImg)
  }

  const loaded = () => {
    imgContainer.current.classList.add('loaded')
  }

  const onMouse = (event: React.MouseEvent<HTMLDivElement>) => {
    if (fullscreen) {
      fullscrTime.current = Date.now()
    
      if (hidden.current === true) {
        hidden.current = false
        titleBar.current.classList.remove('hidden')
        document.documentElement.style.cursor = 'auto'
      }
    }
  }

  const toggleSlide = () => {
    setSlideshow(!slideshow)
  }

  const slide = () => {
    console.log(slideshow)
    if (slideshow) loadNext(true)
  }
  
  const toggleFullScreen = () => {
    if (!document.fullscreenElement)
      document.documentElement.requestFullscreen()
    else
      document.exitFullscreen()
  }

  const onFullscreen = () => {
    if (document.fullscreenElement) {
      setFullscreen(true)
      titleBar.current.classList.add('fullscreen')
      interval.current = setInterval(() => {
        if (hidden.current === false && (Date.now() - fullscrTime.current) > 1000) {
          titleBar.current.classList.add('hidden')
          document.documentElement.style.cursor = 'none'
          hidden.current = true
        }
      }, 1000)
      fullscrTime.current = Date.now()
    }
    else {
      setFullscreen(false)
      if (interval.current) clearInterval(interval.current)
      document.documentElement.style.cursor = 'auto'
      titleBar.current.classList.remove('hidden')
      titleBar.current.classList.remove('fullscreen')
    }
  }

  const trashBtn = () => {
    if (document.documentElement.requestFullscreen !== undefined) {
      return trash
    }
    return
  }

  const slideBtn = () => {
    if (document.documentElement.requestFullscreen !== undefined) {
      return play
    }
    return
  }


  // full screen on desktop, trash on mobile
  const rightBtn = () => {
    if (document.documentElement.requestFullscreen !== undefined) {
      return fullscreen ? arrIn : arrOut
    }
    return trash
  }

  const rightBtnFn = () => {
    if (document.documentElement.requestFullscreen !== undefined) {
      return toggleFullScreen
    }
    return removeImg
  }

  useEffect(() => {
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [])

  useEffect(() => {
    let id = setInterval(slide, 3000)
    return () => {
      clearInterval(id)
    }
  }, [selected, slideshow])

  if (lBttn.current) {
    if (hideButtons[0]) {
      lBttn.current.style.opacity = 0
      lBttn.current.style.cursor = 'default'
    }
    else {
      lBttn.current.style.opacity = 1
      lBttn.current.style.cursor = 'pointer'
    }
  }

  if (rBttn.current) {
    if (hideButtons[1]) {
      rBttn.current.style.opacity = 0
      rBttn.current.style.cursor = 'default'
    }
    else {
      rBttn.current.style.opacity = 1
      rBttn.current.style.cursor = 'pointer'
    }
  }

  const ex = <svg viewBox='0 0 50 50' className='btn'>
              <path d="M 7 25 L 43 25"/>
              <path d="M 25 7 L 25 43"/>
            </svg>
  
  const arrow = <svg viewBox='0 0 50 50' className='btn'>
                  <path d="M 15 10 L 35 25"/>
                  <path d="M 15 40 L 35 25"/>
                </svg>

  const arrOut = <svg viewBox='0 0 50 50' className='btn'>
                    <path d="M 24 11 L 38 12 M 38 12 L 39 26"/>
                    <path d="M 11 24 L 12 38 M 12 38 L 26 39"/>
                  </svg>
  
  const arrIn = <svg viewBox='0 0 50 50' className='btn'>
                  <path d="M 28 7 L 29 21 M 29 21 L 43 22"/>
                  <path d="M 7 28 L 21 29 M 21 29 L 22 43"/>
                </svg>
  
  const play = <svg viewBox='0 0 50 50' className={slideshow ? 'btn fill' : 'btn'}>
                <path stroke='none' d="M 17 12 L 17 38 L 38 25 L 17 12"/>
                <path d="M 15 10 L 15 40 M 15 40 L 40 25 M 40 25 L 15 10"/>
              </svg>
  
  const trash = <svg viewBox='0 0 50 50' className='btn'>
                  <path d="M 39 12 L 36 43 L 14 43 L 11 12" />
                  <path d="M 10 12 L 40 12"/>
                  <path d="M 20 21 L 21 35"/>
                  <path d="M 30 21 L 29 35"/>
                  <path d="M 16 7 L 34 7"/>
                </svg>

  if (selected.name) {
    document.documentElement.style.overflow = 'hidden'
    
    const date = new Date(selected.date_created)
    const hours = (date.getHours() + 11) % 12 + 1
    const suffix = date.getHours() >= 12 ? ' PM' : ' AM'
    const minutes = '0' + date.getMinutes().toString()
    const seconds = '0' + date.getSeconds().toString()
    const formatDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear().toString()
    const formatTime = hours + ':' + minutes.slice(-2) + ':' + seconds.slice(-2) + suffix  

    return (
      <div className='viewer' onMouseMove={onMouse}>
        <div className='title' ref={titleBar}>
          <div className='title-left'>
            <div className='item-left' onClick={hideViewer} style={{rotate: '45deg'}}>{ex}</div>
            <div className='item-right' ref={lBttn} onClick={loadPrev} style={{rotate: '180deg'}}>{arrow}</div>
          </div>
          <div className='title-center-mv'>
            <div className='date-text'>{formatDate}</div>
            <div className='time-text'>{formatTime}</div>
            </div>
          <div className="title-right">
            <div className='item-left' ref={rBttn} onClick={() => loadNext()}>{arrow}</div>
            <div className="title-right-mv">
              <div></div>
              <div className='item-right' onClick={removeImg}>{trashBtn()}</div>
              <div className='item-right' onClick={toggleSlide}>{slideBtn()}</div>
              <div className='item-right' onClick={rightBtnFn()}>{rightBtn()}</div>
            </div>
          </div>
        </div>
        <div className='img-container' ref={imgContainer} style={{backgroundImage: 'url(' + 'http://192.168.1.252' + selected.thumb + ')'}}>
          <img key={selected.path} src={'http://192.168.1.252' + selected.path} onLoad={loaded} />
        </div>
      </div>
    )
  }
}