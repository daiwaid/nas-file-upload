'use client'

import { useEffect, useRef, useState } from 'react'
import { image, imageList } from '../Types'
import './MediaViewer.css'
import DeleteBtn from './DeleteBtn'
import ImgContainer from './ImgContainer'
import Icon from './Icon'

export default function MediaViewer({ selectedInd, aspectRatio, setSelectedInd, showViewer, getImage, deleteImg, setScroll, getPrev, getNext }: 
                        { selectedInd: number[], aspectRatio: number, setSelectedInd: React.Dispatch<React.SetStateAction<number[]>>, 
                          showViewer: (viewer: boolean) => void, getImage: (inds: number[] | undefined) => image | undefined, 
                          deleteImg: (img: image) => Promise<boolean>, setScroll: (state: boolean) => void
                          getPrev: (preload?: boolean, indicies?: number[]) => Promise<number[]|undefined>,
                          getNext: (preload?: boolean, indicies?: number[]) => Promise<number[]|undefined> }) {

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
  const currX = useRef(0)
  const prevX = useRef(0)
  const prevY = useRef(0)
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
    if (fullscreen) {
      document.exitFullscreen()
      if (interval.current) clearInterval(interval.current)
      document.documentElement.style.cursor = 'auto'
    }
    showViewer(false)
    setScroll(true)
  }

  // remove the currently selected image
  const removeImg = () => {
   // won't delete if only 1 image left
    if ((selected.prev || selected.next) && selected.curr) {
      deleteImg(selected.curr).then( res => {
        if (res || true) {
          loadNext(true).then( res => {
            if (!res) {
              toLoad.current -= 1
              loadPrev(true)
            }
          })
        }
      })
    }
  }

  const loadPrev = async (del=false): Promise<boolean> => {
    if (loadingImgs.current || toLoad.current >= 0) // prevent concurrent loads
      return false

    loadingImgs.current = true
    const num = -toLoad.current
    toLoad.current = 0
    const imgs = [selected.curr]

    let newInd = await getPrev(false) // get prev
    if (newInd) {
      imgs.push(selected.prev)

      const promises = [] // get all prev needed
      for (let i = 1; i < num; i++) {
        promises.push(getPrev(false, newInd))
      }
      const responses = await Promise.all(promises)
      for (const newNewInd of responses) {
        if (!newNewInd) break

        newInd = newNewInd
        imgs.push(getImage(newInd))
      }

      const prevInd = await getPrev(false, newInd)
      if (del)
        setSelected({ prev: getImage(prevInd), curr: selected.prev, next: selected.next })
      else
        setSelected({ prev: getImage(prevInd), curr: imgs[imgs.length - 1], next: imgs[imgs.length - 2] })

      if (newInd) setSelectedInd(newInd)

      // getPrev(true, prevInd) // preload
      // if more imgs to load
      if (toLoad.current < 0) return loadPrev()
      else if (toLoad.current > 0) return loadNext()

      loadingImgs.current = false
      return true
    }
    loadingImgs.current = false
    return false
  }

  const loadNext = async (del=false): Promise<boolean> => {
    if (del) {
      const newInd = await getNext(false)
      if (newInd) {
        setSelected({ prev: selected.prev, curr: selected.next, next: getImage(newInd) })
        return true
      }
      return false
    }
    else if (!loadingImgs.current && toLoad.current >= 0) { // prevent concurrent loads
      loadingImgs.current = true
      const num = toLoad.current
      toLoad.current = 0
      const imgs = [selected.curr]

      let newInd = await getNext(false)
      if (newInd) {
        imgs.push(selected.next)

        const promises = []
        for (let i = 1; i < num; i++) {
          promises.push(getNext(false, newInd))
        }
        const responses = await Promise.all(promises)
        for (const newNewInd of responses) {
          if (!newNewInd) break

          newInd = newNewInd
          imgs.push(getImage(newInd))
        }

        const nextInd = await getNext(false, newInd)
        setSelected({ prev: imgs[imgs.length - 2], curr: imgs[imgs.length - 1], next: getImage(nextInd) })

        if (newInd) setSelectedInd(newInd)
      }

      // getNext(true, nextInd) // preload
      // if more imgs to load
      if (toLoad.current < 0) return loadPrev()
      else if (toLoad.current > 0) return loadNext()

      loadingImgs.current = false
      return true
    }

    loadingImgs.current = false
    return false
  }

  const swipeStart = (clientX: number) => {
    prevX.current = clientX // keep track of last mouse position
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
      
      // quick swipe
      if (Date.now() - startTime.current > 60 && Date.now() - startTime.current < 300 
                                      && Math.abs(movedX.current) > 20) {
        quickswipe = true
        newDirection = -Math.sign(movedX.current)
      }
      // if swiped enough to change current img
      else if (Math.abs(currX.current) > frameWidth / 3) {
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

        currX.current = smoothTransition(currX.current, endX.current, timestep)
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

    toLoad.current -= 1
    loadPrev()
  }
  const nextImg = () => {
    if (!selected.next) return

    toLoad.current += 1
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
      prevY.current = event.clientY
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
        if (hidden.current === false && (Date.now() - fullscrTime.current) > 1000 && prevY.current > 80) {
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
      return fullscreen ? <Icon icon='arrIn' className='nonmobile'/> : <Icon icon='arrOut' className='nonmobile'/>
    }
  }

  useEffect(() => {
    document.addEventListener('fullscreenchange', onFullscreen)
    direction.current = 0
    currX.current = 0
    endX.current = 0

    viewer.current.focus()
    setScroll(false)

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
    <div className='viewer' ref={viewer} onKeyDown={onKeyDown} onMouseMove={onMouse} tabIndex={0}>
      <div className='title prevent-select' ref={titleBar}>
        <div className='title-left'>
          <div className='item-left' onClick={hideViewer}>{<Icon icon='ex'/>}</div>
          <div className={selected.prev ? 'item-right' : 'item-right inactive'} ref={lBttn} onClick={prevImg} style={{rotate: '180deg'}}>{<Icon icon='arrow' className='nonmobile'/>}</div>
        </div>
        <div className='title-center-mv'>
          <div className='date-text'>{formatDate}</div>
          <div className='time-text'>{formatTime}</div>
          </div>
        <div className="title-right">
          <div className={selected.next ? 'item-left' : 'item-left inactive'} ref={rBttn} onClick={nextImg}>{<Icon icon='arrow' className='nonmobile'/>}</div>
          <div className="title-right-grid">
            <div></div>
            <div className='item-right' onClick={toggleSlide}>{<Icon icon='play' className={slideshow ? 'fill nonmobile' : 'nonmobile'}/>}</div>
            <div className='item-right' onClick={toggleFullScreen}>{fullScrBtn()}</div>
            <DeleteBtn removeImg={removeImg} />
          </div>
        </div>
      </div>
      <div className="slider prevent-select" ref={sliderRef}
          onTouchStart={touchStart} onTouchMove={touchAction} onTouchEnd={touchEnd} onTouchCancel={touchEnd} >
        <div className="slider-track" ref={sliderTrackRef}>
          {selected && sliderRef.current ? <>
            <ImgContainer key={selected.prev ? selected.prev.path : -1} img={selected.prev} 
                aspectRatio={sliderRef.current.clientWidth / sliderRef.current.clientHeight} margin={margin} selected={false} />
            <ImgContainer key={selected.curr ? selected.curr.path : -2} img={selected.curr} 
                aspectRatio={sliderRef.current.clientWidth / sliderRef.current.clientHeight} margin={margin} selected={true} />
            <ImgContainer key={selected.next ? selected.next.path : -3} img={selected.next} 
                aspectRatio={sliderRef.current.clientWidth / sliderRef.current.clientHeight} margin={margin} selected={false} />
          </> : <div></div>
          }
        </div>
      </div>
    </div>
  )
}