'use client'

import { Dispatch, useEffect, useRef, useState } from 'react'
import { image } from '../Types'
import './mediaViewer.css'

export default function MediaViewer({ selected, closeViewer, getPrev, getNext, hideButtons }: 
                        { selected: image, closeViewer: () => void, getPrev: (preload: boolean) => void, 
                          getNext: (preload: boolean) => void, hideButtons: boolean[]}) {

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

  const loadNext = () => {
    getNext(false)
    getNext(true)
  }

  const loaded = () => {
    imgContainer.current.classList.add('loaded')
  }

  const toggleFullScreen = () => {
    if (!document.fullscreenElement)
      document.documentElement.requestFullscreen()
    else
      document.exitFullscreen()
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
    if (slideshow) {
      if (slideInterval.current) clearInterval(slideInterval.current)
      setSlideshow(false)
    }
    else {
      slideInterval.current = setInterval(() => {
        loadNext()
      }, 3000)
      setSlideshow(true)
    }
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

  const fullscrBtn = () => {
    if (document.documentElement.requestFullscreen !== undefined) {
      return fullscreen ? arrIn : arrOut
    }
    return
  }

  useEffect(() => {
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [])

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
                  <path d="M 15 10 L 30 25"/>
                  <path d="M 30 25 L 15 40"/>
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
                <path stroke='none' d="M 12 12 L 12 38 L 33 25 L 12 12"/>
                <path d="M 10 10 L 10 40 M 10 40 L 35 25 M 35 25 L 10 10"/>
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
          <div className='title-left' onClick={hideViewer} style={{rotate: '45deg'}}>{ex}</div>
          <div className='title-right' ref={lBttn} onClick={loadPrev} style={{rotate: '180deg'}}>{arrow}</div>
          <div className='title-center-mv'>
            <div className='date-text'>{formatDate}</div>
            <div className='time-text'>{formatTime}</div>
            </div>
          <div className="title-right-mv">
            <div className='title-left' ref={rBttn} onClick={loadNext}>{arrow}</div>
            <div className='title-right' onClick={toggleSlide}>{play}</div>
          </div>
          <div className='title-right' onClick={toggleFullScreen}>{fullscrBtn()}</div>
        </div>
        <div className='img-container' ref={imgContainer} style={{backgroundImage: 'url(' + 'http://192.168.1.252' + selected.thumb + ')'}}>
          <img key={selected.path} src={'http://192.168.1.252' + selected.path} onLoad={loaded} />
        </div>
      </div>
    )
  }
}