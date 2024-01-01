'use client'

import { useEffect, useRef, useState } from 'react'
import { image, imageList } from '../Types'
import './MediaViewer.css'
import DeleteBtn from './DeleteBtn'
import ImgContainer from './ImgContainer'

export default function MediaViewer({ selectedInd, aspectRatio, setSelectedInd, showViewer, getImage, deleteImg, getPrev, getNext }: 
                        { selectedInd: number[], aspectRatio: number, setSelectedInd: React.Dispatch<React.SetStateAction<number[]>>, 
                          showViewer: (viewer: boolean) => void, getImage: (inds: number[] | undefined) => image | undefined, 
                          deleteImg: (img: image) => Promise<boolean>, getPrev: (preload?: boolean, indicies?: number[]) => Promise<number[]|undefined>,
                          getNext: (preload?: boolean, indicies?: number[], fullImg?: boolean) => Promise<number[]|undefined> }) {

  const [fullscreen, setFullscreen] = useState(false)
  const [slideshow, setSlideshow] = useState(false)
  const [selected, setSelected] = useState<imageList>({} as imageList)
  const interval = useRef<NodeJS.Timer>()
  const hidden = useRef(false)
  const fullscrTime = useRef(0)
  const lBttn = useRef<any>()
  const rBttn = useRef<any>()
  const titleBar = useRef<any>()
  const viewer = useRef<any>()

  const sliderRef = useRef<any>()
  const sliderTrackRef = useRef<any>()
  const startX = useRef(0)
  const currX = useRef(0)
  const prevX = useRef(0)
  const endX = useRef(0)
  const movedX = useRef(0)
  const direction = useRef(0)
  const startTime = useRef(0)
  const swiping = useRef(false)
  const quickSwiped = useRef(false)
  const toLoad = useRef(0)
  const loadingImgs = useRef(false)

  const margin = 5
  let prevTimeStamp = -1

  const hideViewer = () => {
    document.documentElement.style.overflow = 'auto'
    if (fullscreen) {
      document.exitFullscreen()
      if (interval.current) clearInterval(interval.current)
      document.documentElement.style.cursor = 'auto'
    }
    showViewer(false)
  }

  // remove the currently selected image
  const removeImg = () => {
   // won't delete if only 1 image left
    if ((selected.prev || selected.next) && selected.curr) {
      deleteImg(selected.curr).then( res => {
        if (res) {
          toLoad.current += 1
          return loadNext(true)
        }
        return false
      }).then( res => {
        if (!res) {
          toLoad.current -= 1
          loadPrev(true)
        }
      })
    }
  }

  const loadPrev = (del=false): Promise<boolean> => {
    if (loadingImgs.current || toLoad.current >= 0) // prevent concurrent loads
      return Promise.resolve(false)

    loadingImgs.current = true
    const num = -toLoad.current
    toLoad.current = 0
    let imgs = [selected.curr]
    return getPrev(false).then( newInd => {
      if (newInd) {
        imgs.push(selected.prev)

        const promises = []
        for (let i = 1; i < num; i++) {
          promises.push(getPrev(false, newInd))
        }
        return Promise.all(promises).then( responses => {
          for (const newNewInd of responses) {
            if (!newNewInd) break

            newInd = newNewInd
            imgs.push(getImage(newInd))
          }

          return getPrev(false, newInd).then( prevInd => {
            if (del)
              setSelected({prev: getImage(prevInd), curr: selected.prev, next: selected.next})
            else
              setSelected({prev: getImage(prevInd), curr: imgs[imgs.length-1], next: imgs[imgs.length-2]})
            
              if (newInd) setSelectedInd(newInd)

            // getPrev(true, prevInd) // preload
            // if more imgs to load
            if (toLoad.current < 0) return loadPrev()
            else if (toLoad.current > 0) return loadNext()

            loadingImgs.current = false
            return true
          })
        })
      }

      loadingImgs.current = false
      return Promise.resolve(false)
    })
  }

  const loadNext = (del=false): Promise<boolean> => {
    if (loadingImgs.current || toLoad.current <= 0) // prevent concurrent loads
      return Promise.resolve(false)

    loadingImgs.current = true
    const num = toLoad.current
    toLoad.current = 0
    let imgs = [selected.curr]
    return getNext(false).then( newInd => {
      if (newInd) {
        imgs.push(selected.next)

        const promises: Promise<number[] | undefined>[] = []
        for (let i = 1; i < num; i++) {
          promises.push(getNext(false, newInd))
        }
        return Promise.all(promises).then( responses => {
          for (const newNewInd of responses) {
            if (!newNewInd) break

            newInd = newNewInd
            imgs.push(getImage(newInd))
          }

          return getNext(false, newInd).then( nextInd => {
            if (del)
              setSelected({prev: selected.prev , curr: selected.next, next: getImage(nextInd)})
            else
              setSelected({prev: imgs[imgs.length-2], curr: imgs[imgs.length-1], next: getImage(nextInd)})

            if (newInd) setSelectedInd(newInd)

            // getNext(true, nextInd) // preload
            // if more imgs to load
            if (toLoad.current < 0) return loadPrev()
            else if (toLoad.current > 0) return loadNext()
            
            loadingImgs.current = false
            return true
          })
        })
      }

      loadingImgs.current = false
      return Promise.resolve(false)
    })
  }

  const swipeStart = (clientX: number) => {
    prevX.current = clientX // keep track of last mouse position
    startX.current = currX.current
    movedX.current = 0 // keep track of how much mouse moved
    startTime.current = Date.now()
    swiping.current = true
  }

  const swipeAction = (clientX: number) => {
    if (swiping.current === true && sliderTrackRef.current) {
      const frameWidth = sliderRef.current.clientWidth + margin*2
      const toMove = clientX - prevX.current
      if (toMove === 0) return
      movedX.current += toMove

      if (!selected.prev && currX.current > 0) // at the left end
        currX.current += toMove * frameWidth / (3 * (currX.current + frameWidth))
      else if (!selected.next && currX.current < 0) // at the right end
        currX.current += toMove * frameWidth / (3 * (-currX.current + frameWidth))
      else
        currX.current += toMove

      if (Math.abs(currX.current) > frameWidth) { // if swiped more than 1 entire image
        direction.current += -Math.sign(currX.current)
        currX.current += Math.sign(direction.current) * frameWidth
        changeCurrImg()
      }

      sliderTrackRef.current.style.transform = `translateX(${currX.current - frameWidth - margin}px)`
      prevX.current = clientX
    }
  }

  const swipeEnd = (newDirection=0, quickswipe=false) => {
    if (swiping.current === true || newDirection !== 0) {
      const frameWidth = sliderRef.current.clientWidth + margin*2
      swiping.current = false
      
      if (Date.now() - startTime.current > 60 && Date.now() - startTime.current < 300 
                                      && Math.abs(movedX.current) > 20) { // quick swipe
        quickswipe = true
        newDirection = -Math.sign(movedX.current)
      }
      else if (Math.abs(currX.current) > frameWidth / 3) { // if swiped enough to change current img
        newDirection = -Math.sign(currX.current)
      }

      // if already at one of the ends or didn't move enough
      if (newDirection === 0 || !selected.prev && newDirection < 0 || !selected.next && newDirection > 0) {
        endX.current = 0
      }
      else {
        if (endX.current !== 0) { // if auto centering gets interrupted
          if (!quickswipe) { // if not quickswipe (go by pos of imgs on screen)
            if (Math.abs(currX.current % frameWidth) < frameWidth / 2) { // go back to prev img
              endX.current += newDirection * frameWidth
            }
            else { // keep going to new img
              direction.current += newDirection
            }
          }
          else { // quickswipe (go by direction of motion)
            if (Math.sign(currX.current - endX.current) !== newDirection) { // go back
              endX.current += -newDirection * frameWidth
            }
            else { // keep going
              direction.current += newDirection
              if (Math.abs(direction.current) > 1) endX.current -= newDirection * frameWidth
            }
            quickSwiped.current = true
          }
        }
        else {
          direction.current += newDirection
          endX.current += -newDirection * frameWidth
          if (quickswipe)
            quickSwiped.current = true
        }
      }

      if (Math.abs(currX.current) > frameWidth) { // if swiped more than 1 entire image
        direction.current += -Math.sign(currX.current)
        currX.current += Math.sign(direction.current) * frameWidth
        changeCurrImg()
      }

      requestAnimationFrame(centerImg)
    }
  }

  const centerImg = (timeStamp: DOMHighResTimeStamp) => {
    if (swiping.current === true) { // if swiping interrupts centering animation
      direction.current = 0
      prevTimeStamp = -1
    }
    else {
      if (currX.current !== endX.current) { // didn't finish moving yet
        const frameWidth = sliderRef.current.clientWidth + margin*2
        // gets the timestep since last frame
        let timestep
        if (prevTimeStamp === -1) timestep = 1
        else timestep = timeStamp - prevTimeStamp
        prevTimeStamp = timeStamp

        const a = smoothTransition(currX.current, endX.current, timestep)

        currX.current = a
        sliderTrackRef.current.style.transform = `translateX(${currX.current - frameWidth - margin}px)`

        requestAnimationFrame(centerImg)
      }
      else { // finished moving, reset and change img
        quickSwiped.current = false
        currX.current = 0
        endX.current = 0
        prevTimeStamp = -1
        changeCurrImg()
      }
    }
  }

  // change curr image
  const changeCurrImg = () => {
    toLoad.current += direction.current
    if (direction.current < 0) loadPrev(false)
    else if (direction.current > 0) loadNext(false)
    direction.current = 0
  }

  const prevImg = () => {
    if (!selected.prev) return

    const frameWidth = sliderRef.current.clientWidth + margin*2
    toLoad.current -= 1
    currX.current -= frameWidth
    loadPrev(false)
  }
  const nextImg = () => {
    if (!selected.next) return

    const frameWidth = sliderRef.current.clientWidth + margin*2
    toLoad.current += 1
    currX.current += frameWidth
    loadNext(false)
  }

  /** Smoothly transitions from x0 to x1, returns what x0 should become in the next time step. */
  const smoothTransition = (x0: number, x1: number, timestep: number): number => {
    const cutoff = 1
    if (Math.abs(x1 - x0) < cutoff) return x1
    return x0 + Math.sign(x1-x0) * ((Math.abs(x1-x0)+200)**2 / 2**16 - 0.55) * Math.min(timestep, 20)
  }

  const touchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1)
      swipeStart(event.touches[0].clientX)
  }
  const touchAction = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1)
      swipeAction(event.touches[0].clientX)
  }
  const touchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    swipeEnd()
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

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      toLoad.current -= 1
      loadPrev()
    }
    else if (event.key === 'ArrowRight') {
      toLoad.current += 1
      loadNext()
    }
    else if (event.key === 'Escape') {
      hideViewer()
    }
  }

  const toggleSlide = () => {
    setSlideshow(!slideshow)
  }

  const slide = () => {
    if (slideshow) {
      toLoad.current += 1
      loadNext()
    }
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

  const fullScrBtn = () => {
    if (document.documentElement.requestFullscreen !== undefined) {
      return fullscreen ? arrIn : arrOut
    }
  }

  useEffect(() => {
    viewer.current.focus()
    document.documentElement.style.overflow = 'hidden'
    document.addEventListener('fullscreenchange', onFullscreen)

    direction.current = 0
    currX.current = 0
    endX.current = 0

    Promise.all([getPrev(false), getNext(false)]).then( promises => {
      const newSelected = {prev: getImage(promises[0]), curr: getImage(selectedInd), next: getImage(promises[1])}
      setSelected(newSelected)
    })
    
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(slide, 3000)

    return () => {
      clearInterval(id)
    }
  }, [selectedInd, slideshow])

  useEffect(() => {
    if (sliderTrackRef.current) {
      const frameWidth = sliderRef.current.clientWidth + margin*2
      sliderTrackRef.current.style.transform = `translateX(${currX.current - frameWidth - margin}px)`
    }

    if (endX.current !== currX.current) {
      requestAnimationFrame(centerImg)
    }
      
  }, [selected, aspectRatio])

  const ex = <svg viewBox='0 0 50 50' className='btn'>
              <path d="M 7 25 L 43 25"/>
              <path d="M 25 7 L 25 43"/>
            </svg>
  
  const arrow = <svg viewBox='0 0 50 50' className='btn nonmobile'>
                  <path d="M 15 10 L 35 25"/>
                  <path d="M 15 40 L 35 25"/>
                </svg>

  const arrOut = <svg viewBox='0 0 50 50' className='btn nonmobile'>
                    <path d="M 24 11 L 38 12 M 38 12 L 39 26"/>
                    <path d="M 11 24 L 12 38 M 12 38 L 26 39"/>
                  </svg>
  
  const arrIn = <svg viewBox='0 0 50 50' className='btn nonmobile'>
                  <path d="M 28 7 L 29 21 M 29 21 L 43 22"/>
                  <path d="M 7 28 L 21 29 M 21 29 L 22 43"/>
                </svg>
  
  const play = <svg viewBox='0 0 50 50' className={slideshow ? 'btn fill nonmobile' : 'btn nonmobile'}>
                <path stroke='none' d="M 17 12 L 17 38 L 38 25 L 17 12"/>
                <path d="M 15 10 L 15 40 M 15 40 L 40 25 M 40 25 L 15 10"/>
              </svg>

let formatDate = '', formatTime = ''

  if (selected.curr) {
    const date = new Date(selected.curr.date_created)
    const hours = (date.getHours() + 11) % 12 + 1
    const suffix = date.getHours() >= 12 ? ' PM' : ' AM'
    const minutes = '0' + date.getMinutes().toString()
    const seconds = '0' + date.getSeconds().toString()
    formatDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear().toString()
    formatTime = hours + ':' + minutes.slice(-2) + ':' + seconds.slice(-2) + suffix
  }

  return (
    <div className='viewer' ref={viewer} onKeyDown={onKeyDown} tabIndex={0}>
      <div className='title prevent-select' ref={titleBar}>
        <div className='title-left'>
          <div className='item-left' onClick={hideViewer} style={{rotate: '45deg'}}>{ex}</div>
          <div className={selected.prev ? 'item-right' : 'item-right inactive'} ref={lBttn} onClick={prevImg} style={{rotate: '180deg'}}>{arrow}</div>
        </div>
        <div className='title-center-mv'>
          <div className='date-text'>{formatDate}</div>
          <div className='time-text'>{formatTime}</div>
          </div>
        <div className="title-right">
          <div className={selected.next ? 'item-left' : 'item-left inactive'} ref={rBttn} onClick={nextImg}>{arrow}</div>
          <div className="title-right-grid">
            <div></div>
            <div className='item-right' onClick={toggleSlide}>{play}</div>
            <div className='item-right' onClick={toggleFullScreen}>{fullScrBtn()}</div>
            <DeleteBtn removeImg={removeImg} />
          </div>
        </div>
      </div>
      <div className="slider prevent-select" ref={sliderRef} onMouseMove={onMouse}
          onTouchStart={touchStart} onTouchMove={touchAction} onTouchEnd={touchEnd} onTouchCancel={touchEnd} >
        <div className="slider-track" ref={sliderTrackRef}>
          {selected && sliderRef.current ? <>
            <ImgContainer key={selected.prev ? selected.prev.path : -1} img={selected.prev} 
                aspectRatio={sliderRef.current.clientWidth / sliderRef.current.clientHeight} margin={margin} />
            <ImgContainer key={selected.curr ? selected.curr.path : -2} img={selected.curr} 
                aspectRatio={sliderRef.current.clientWidth / sliderRef.current.clientHeight} margin={margin} />
            <ImgContainer key={selected.next ? selected.next.path : -3} img={selected.next} 
                aspectRatio={sliderRef.current.clientWidth / sliderRef.current.clientHeight} margin={margin} />
          </> : <div></div>
          }
        </div>
      </div>
    </div>
  )
}