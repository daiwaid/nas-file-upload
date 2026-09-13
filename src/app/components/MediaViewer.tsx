'use client'

import { useEffect, useRef, useState } from 'react'
import { image, imageList } from '../Types'
import './mediaViewer.css'
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
  const interval = useRef<NodeJS.Timer>(null)
  const hidden = useRef(false)
  const fullscrTime = useRef(0)
  const lBttn = useRef<any>(null)
  const rBttn = useRef<any>(null)
  const titleBar = useRef<any>(null)
  const viewer = useRef<any>(null)

  const sliderRef = useRef<any>(null)
  const sliderTrackRef = useRef<any>(null)
  const currImgRef = useRef<any>(null)
  const currX = useRef(0)
  const prevX = useRef(0)
  const prevY = useRef(0)
  const endX = useRef(0)
  const movedX = useRef(0)
  const movedY = useRef(0)
  const direction = useRef(0)
  const startTime = useRef(0)
  const doubleTapTime = useRef(0)
  const touching = useRef(false)
  const quickSwiped = useRef(false)
  const swipeMode = useRef(0) // 0: none, 1: swipe, 2: pan
  const toLoad = useRef(0)
  const loadingImgs = useRef(false)

  const imgOffset = useRef({ x: 0, y: 0 })
  const toOffset = useRef({ x: 0, y: 0 })
  const offsetMomentum = useRef({ x: 0, y: 0 })
  const zoomCenter = useRef({ x: 0, y: 0 })
  const isZooming = useRef(false)
  const zoomLevel = useRef(0)
  const scale = useRef(1)
  const toScale = useRef(1)
  const pinching = useRef(false)
  const prevTouches = useRef({ x1: 0, y1: 0, x2: 0, y2: 0 })
  const animating = useRef(false)
  const canSwitchLeft = useRef(true)
  const canSwitchRight = useRef(true)

  const margin = 5
  const maxZoomLevel = 10
  const zoomFactor = Math.sqrt(2)
  const menuOffset = 50

  /*************************
        Loading Media
  *************************/

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
        if (res) {
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

  const setSelectedImgs = (list: imageList) => {
    resetImg()
    setSelected(list)
  }

  const loadPrev = async (del: boolean = false): Promise<boolean> => {
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
        setSelectedImgs({
          prev: getImage(prevInd), 
          curr: selected.prev, 
          next: selected.next 
        })
      else
        setSelectedImgs({
          prev: getImage(prevInd), 
          curr: imgs[imgs.length - 1], 
          next: imgs[imgs.length - 2]
        })

      if (newInd) setSelectedInd(newInd)

      // if more imgs to load
      if (toLoad.current < 0) return loadPrev()
      else if (toLoad.current > 0) return loadNext()
      // else getPrev(true, prevInd) // preload

      loadingImgs.current = false
      return true
    }

    loadingImgs.current = false
    return false
  }

  const loadNext = async (del: boolean = false): Promise<boolean> => {
    if (del) {
      const newInd = await getNext(false)
      if (newInd) {
        setSelectedImgs({
          prev: selected.prev, 
          curr: selected.next, 
          next: getImage(newInd)
        })
        return true
      }
      return false
    }
    else if (!loadingImgs.current && toLoad.current >= 0) { // prevent concurrent loads
      loadingImgs.current = true
      const num = toLoad.current
      toLoad.current = 0
      const imgs = [selected.curr]

      let newInd = await getNext(false), nextInd = undefined
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

        nextInd = await getNext(false, newInd)
        setSelectedImgs({
          prev: imgs[imgs.length - 2], 
          curr: imgs[imgs.length - 1], 
          next: getImage(nextInd)
        })

        if (newInd) setSelectedInd(newInd)
      }

      // if more imgs to load
      if (toLoad.current < 0) return loadPrev()
      else if (toLoad.current > 0) return loadNext()
      // else if (nextInd) getNext(true, nextInd) // preload

      loadingImgs.current = false
      return true
    }

    loadingImgs.current = false
    return false
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

  /*************************
        Animations
  *************************/

  /** Animates repeatedly until no more changes are detected. */
  const animate = (smoothTransition: boolean = true) => {
    if (animating.current) return

    let prevTimeStamp = -1

    // renders 1 frame for content layer
    const render = (timeStamp: DOMHighResTimeStamp) => {
      console.log("render")
      animating.current = true // starts animating.current
      if (!currImgRef.current) return

      // gets the timestep since last frame
      let timestep
      if (prevTimeStamp === -1) timestep = 1
      else timestep = timeStamp - prevTimeStamp
      prevTimeStamp = timeStamp

      // checks page movement and zoom
      let doneChanging = animateZoom(timestep, smoothTransition)
      doneChanging = animateMove(timestep, smoothTransition) && doneChanging

      if (doneChanging) {
        doneChanging = centerImg()
        if (doneChanging) animating.current = false
      }

      if (!doneChanging) requestAnimationFrame(render)
    }

    requestAnimationFrame(render)
  }

  const animateMove = (timestep: number, smoothTransition: boolean = true) => {
    if (touching.current) return true

    let doneChanging = true

    if (imgOffset.current.x !== toOffset.current.x || offsetMomentum.current.x !== 0) {
      if (smoothTransition) {
          const offsetX = calcSmoothTransition(0, toOffset.current.x - imgOffset.current.x, timestep)
          const momentumX = calcSmoothTransition(0, offsetMomentum.current.x, timestep)

          // if momentum is in the same direction as toOffset, only use one
          if (Math.sign(offsetX) !== Math.sign(momentumX))
            imgOffset.current.x += offsetX + momentumX
          else if (momentumX !== 0)
            imgOffset.current.x += momentumX
          else
            imgOffset.current.x += offsetX

          offsetMomentum.current.x -= momentumX
      }
      else {
        imgOffset.current.x = toOffset.current.x
        offsetMomentum.current.x = 0
      }

      currImgRef.current.style.left = `${imgOffset.current.x}px`
      doneChanging = false
    }

    if (imgOffset.current.y !== toOffset.current.y || offsetMomentum.current.y !== 0) {
      if (smoothTransition) {
        const offsetY = calcSmoothTransition(0, toOffset.current.y - imgOffset.current.y, timestep)
        const momentumY = calcSmoothTransition(0, offsetMomentum.current.y, timestep)

        // if momentum is in the same direction as toOffset, only use one
        if (Math.sign(offsetY) !== Math.sign(momentumY))
          imgOffset.current.y += offsetY + momentumY
        else if (momentumY !== 0)
          imgOffset.current.y += momentumY
        else
          imgOffset.current.y += offsetY
        
        offsetMomentum.current.y -= momentumY
      }
      else {
        imgOffset.current.y = toOffset.current.y
        offsetMomentum.current.y = 0
      }

      currImgRef.current.style.top = `${imgOffset.current.y}px`
      doneChanging = false
    }

    return doneChanging
  }

  const animateZoom = (timestep: number, smoothTransition: boolean = true) => {
    if (scale.current !== toScale.current) {
      if (smoothTransition)
        scale.current += calcSmoothTransition(0, (toScale.current - scale.current) * 256, timestep) / 256
      else
        scale.current = toScale.current

      currImgRef.current.style.transform = `scale(${scale.current})`

      return false
    }

    if (isZooming.current) {
      return boundZoom()
    }
    
    return true
  }

  const applyCSS = () => {
    currImgRef.current.style.left = `${imgOffset.current.x}px`
    currImgRef.current.style.top = `${imgOffset.current.y}px`
    currImgRef.current.style.transformOrigin = `${zoomCenter.current.x}px ${zoomCenter.current.y}px`
  }
  

  /*************************
          Actions
  *************************/

  const touchStart = (touches: React.TouchList) => {
    if (touches.length === 1) {
      touching.current = true
      startTime.current = Date.now()
      movedX.current = 0 // keep track of how much mouse moved
      movedY.current = 0

      if (!isZooming.current) { // stop any current movement
        toOffset.current.x = imgOffset.current.x
        toOffset.current.y = imgOffset.current.y
        offsetMomentum.current.x = 0
        offsetMomentum.current.y = 0
      }

      prevX.current = touches[0].clientX // keep track of last touch
      prevY.current = touches[0].clientY
    }
    else if (touches.length === 2) { // double touch
      pinching.current = true
      touchZoomStart(touches[0], touches[1])
    }
  }
  const touchAction = (touches: React.TouchList) => {
    if (isZooming.current) return // TODO: move this into individual functions; reset zoom at max moves img

    if (touches.length == 1) {
      const clientX = touches[0].clientX
      const clientY = touches[0].clientY
      const toMoveX = clientX - prevX.current
      const toMoveY = clientY - prevY.current

      // determine switching images or panning
      if (swipeMode.current === 0) {
        const horizontalSwipe = Math.abs(toMoveY) < Math.abs(toMoveX)
        const switchingLeft = canSwitchLeft.current && toMoveX > 0
        const switchingRight = canSwitchRight.current && toMoveX < 0

        if ((switchingLeft || switchingRight) && horizontalSwipe) { // swiping between images
          swipeMode.current = 1
          imgSwitch(toMoveX)
        }
        else if (scale.current > 1) { // panning
          swipeMode.current = 2
          touchPan(toMoveX, toMoveY)
        }
      }
      else if (swipeMode.current === 1) {
        imgSwitch(toMoveX)
      }
      else {
        touchPan(toMoveX, toMoveY)
      }

      prevX.current = clientX
      prevY.current = clientY
    }
    else if (touches.length == 2) {
      touchZoom(touches[0], touches[1])
    }
  }
  const touchEnd = (touches: React.TouchList) => { // TODO: zoom move then let go doesn't recenter
    if (touches.length === 1) { // end pinching
      touchZoomEnd()
      prevX.current = touches[0].clientX // keep track of last touch for swipe/pan
      prevY.current = touches[0].clientY
      movedX.current = 0
    }
    else if (touches.length === 0) {
      if (swipeMode.current === 1) { // if swiping between images
        imgSwitchEnd()
      }
      else if (swipeMode.current === 2) { // if panning
        touchPanEnd()
      }
      else if (!pinching.current) { // detect double tap
        doubleTapZoom()
      }
      else if (pinching.current) { // finish pinching
        animate()
      }

      touching.current = pinching.current = false
      swipeMode.current = 0
    }
  }

  const imgSwitch = (toMoveX: number) => {
    if (!sliderTrackRef.current) return

    const frameWidth = sliderRef.current.clientWidth + margin*2
    movedX.current += toMoveX
    
    if (!selected.prev && currX.current > 0 || !selected.next && currX.current < 0) // at the ends
      currX.current += toMoveX / 4
    else
      currX.current += toMoveX

    if (Math.abs(currX.current) > frameWidth) { // if swiped more than 1 entire image
      direction.current += -Math.sign(currX.current)
      currX.current += Math.sign(direction.current) * frameWidth
      changeCurrImg()
    }

    sliderTrackRef.current.style.transform = `translateX(${currX.current - frameWidth - margin}px)`
  }
  const imgSwitchEnd = (newDirection=0, quickswipe=false) => { //TODO: support multiple quick switches
    const frameWidth = sliderRef.current.clientWidth + margin * 2
    
    // quick swipe
    if (Date.now() - startTime.current > 60 && Date.now() - startTime.current < 400 
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
          if (Math.abs(currX.current % frameWidth) < frameWidth / 1.5) { // go back to prev img
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

    centerImgSwitch()
  }

  const centerImgSwitch = () => {
    if (animating.current) return
    
    let prevTimeStamp = -1

    const render = (timeStamp: DOMHighResTimeStamp) => {
      if (touching.current) { // if swiping interrupts centering animation
        direction.current = 0
        prevTimeStamp = -1
        return
      }

      if (currX.current !== endX.current) { // didn't finish moving yet
        const frameWidth = sliderRef.current.clientWidth + margin*2
        // gets the timestep since last frame
        let timestep
        if (prevTimeStamp === -1) timestep = 1
        else timestep = timeStamp - prevTimeStamp
        prevTimeStamp = timeStamp

        currX.current = calcSmoothTransition(currX.current, endX.current, timestep)
        sliderTrackRef.current.style.transform = `translateX(${currX.current - frameWidth - margin}px)`

        requestAnimationFrame(render)
      }
      else { // finished moving, reset and change img
        quickSwiped.current = false
        currX.current = 0
        endX.current = 0
        prevTimeStamp = -1
        changeCurrImg()
      }
    }
    
    requestAnimationFrame(render)
  }

  const touchZoomStart = (touch1: React.Touch, touch2: React.Touch) => {
    movedX.current = getDistance(touch1, touch2) // keep track of initial distance

    const x = (touch1.clientX + touch2.clientX) / 2
    const y = (touch1.clientY + touch2.clientY) / 2
    zoomCenter.current = toRelative(x, y)
    imgOffset.current.x += zoomCenter.current.x  * scale.current - zoomCenter.current.x
    imgOffset.current.y += zoomCenter.current.y * scale.current - zoomCenter.current.y
    applyCSS()

    prevTouches.current = {
      x1: touch1.clientX, 
      y1: touch1.clientY, 
      x2: touch2.clientX, 
      y2: touch2.clientY
    }
  }
  const touchZoom = (touch1: React.Touch, touch2: React.Touch) => {
    const dist = getDistance(touch1, touch2)
    if (dist === 0) return

    let deltaS = dist / movedX.current
    if (scale.current * deltaS > zoomFactor ** maxZoomLevel || scale.current * deltaS < 1) // limit zoom
      deltaS = 1 + (deltaS - 1) / 4
    if (Math.abs(deltaS) < 0.1) deltaS = 0 // don't move if too small to avoid jitter
    toScale.current = scale.current = scale.current * deltaS
    currImgRef.current.style.transform = `scale(${scale.current})`

    // calculate deviations from last touch
    const deltaX = (touch1.clientX + touch2.clientX) / 2 - (prevTouches.current.x1 + prevTouches.current.x2) / 2
    const deltaY = (touch1.clientY + touch2.clientY) / 2 - (prevTouches.current.y1 + prevTouches.current.y2) / 2
    toOffset.current.x = imgOffset.current.x += deltaX
    toOffset.current.y = imgOffset.current.y += deltaY
    applyCSS()

    movedX.current = dist
    prevTouches.current = {
      x1: touch1.clientX, 
      y1: touch1.clientY, 
      x2: touch2.clientX, 
      y2: touch2.clientY
    }
  }
  const touchZoomEnd = () => {
    zoomLevel.current = Math.log2(scale.current) / Math.log2(zoomFactor)
    isZooming.current = true // TODO: move this so after zooming can pan
    animate()
  }

  const doubleTapZoom = () => {
    if (Date.now() - doubleTapTime.current < 400) {
      if (scale.current === 1)
        zoom(3, prevX.current, prevY.current)
      else
        zoom(-0.001, prevX.current, prevX.current)
      doubleTapTime.current = 0
    }
    else {
      doubleTapTime.current = Date.now()
    }
  }

  const scrollZoom = (dist: number, x: number, y: number) => {
    const increment = Math.max(-50, Math.min(50, dist)) * 2
    const newZoomLevel = zoomLevel.current + increment / 4
    if (newZoomLevel < 0 || newZoomLevel >= maxZoomLevel)
      zoom(newZoomLevel, x, y)
    else
      zoom(zoomLevel.current + increment, x, y)
  }

  const zoom = (level: number, x: number, y: number, smoothTransition: boolean = true) => {
    if (currImgRef.current) {
      if (isZooming.current)
        resetZoom() // if already zooming, continue from new center
      else
        isZooming.current = true

      if (onImg(x, y - menuOffset)) { // do not zoom if not on img

        zoomLevel.current = level
        toScale.current = zoomFactor ** level

        offsetMomentum.current.x = offsetMomentum.current.y = 0 // discard any momentum

        // calculate offset and zoom center
        zoomCenter.current = toRelative(x, y - menuOffset)
        imgOffset.current.x += zoomCenter.current.x  * scale.current - zoomCenter.current.x
        imgOffset.current.y += zoomCenter.current.y * scale.current - zoomCenter.current.y
        toOffset.current.x = imgOffset.current.x
        toOffset.current.y = imgOffset.current.y
        applyCSS()

        prevX.current = x
        prevY.current = y
      }

      animate(smoothTransition)
    }
  }

  // if zoomed in, moving a single image
  const mousePan = (toMoveX: number, toMoveY: number) => {
    if (zoomLevel.current <= 0) return

    if (isZooming.current) return // if zooming, discard movement

    // bound panning
    const bounds = getImgOffsetBounds()

    if (bounds.w * scale.current > currImgRef.current.clientWidth) {
      let offsetX = -toMoveX * scale.current
      if (toOffset.current.x + offsetX > bounds.l && toMoveX < 0) {
        if (toOffset.current.x < bounds.l) offsetX = offsetX * 2
        else offsetX = 0
      }
      else if (toOffset.current.x + offsetX < bounds.r && toMoveX > 0) {
        if (toOffset.current.x > bounds.r) offsetX = offsetX * 2
        else offsetX = 0
      }

      offsetMomentum.current.x += offsetX
      toOffset.current.x += offsetX
      
    }

    if (bounds.h * scale.current > currImgRef.current.clientHeight) {
      let offsetY = -toMoveY * scale.current
      if (toOffset.current.y + offsetY > bounds.t && toMoveY < 0) {
        if (toOffset.current.y < bounds.t) offsetY = offsetY * 2
        else offsetY = 0
      }
      else if (toOffset.current.y + offsetY < bounds.b && toMoveY > 0) {
        if (toOffset.current.y > bounds.b) offsetY = offsetY * 2
        else offsetY = 0
      }

      offsetMomentum.current.y += offsetY
      toOffset.current.y += offsetY
    }

    centerImg()
  }
  const mousePanEnter = (clientX: number, clientY: number) => {
    prevX.current = clientX
    prevY.current = clientY
  }

  const touchPan = (toMoveX: number, toMoveY: number) => {
    let offsetX = 0, offsetY = 0

    // bound panning
    const bounds = getImgOffsetBounds()

    if (bounds.w * scale.current > currImgRef.current.clientWidth) {
      if (imgOffset.current.x > bounds.l && Math.sign(toMoveX) === 1 || imgOffset.current.x < bounds.r && Math.sign(toMoveX) === -1)
        offsetX = toMoveX / 4
      else
        offsetX = toMoveX
    }

    if (bounds.h * scale.current > currImgRef.current.clientHeight) {
      if (imgOffset.current.y > bounds.t && Math.sign(toMoveY) === 1 || imgOffset.current.y < bounds.b && Math.sign(toMoveY) === -1)
        offsetY = toMoveY / 4
      else
        offsetY = toMoveY
    }
    
    toOffset.current.x = imgOffset.current.x += offsetX
    toOffset.current.y = imgOffset.current.y += offsetY

    // calculate momentum
    const time = Date.now() - startTime.current
    if (time > 0) {
      movedX.current = offsetX / time * 80
      movedY.current = offsetY / time * 80
      startTime.current = Date.now()
    }
    
    applyCSS()
  }
  const touchPanEnd = () => {
    const minTraveledDist = Math.min(window.innerHeight, window.innerWidth) / 20
    if (Math.abs(movedX.current) + Math.abs(movedY.current) > minTraveledDist) {
      offsetMomentum.current.x = movedX.current
      offsetMomentum.current.y = movedY.current
      toOffset.current.x = imgOffset.current.x + movedX.current
      toOffset.current.y = imgOffset.current.y + movedY.current
    }

    centerImg()
  }


  /*************************
      Helper Functions
  *************************/

  const boundZoom = () => {
    if (!isZooming.current) return

    if (zoomLevel.current < 0) {
      zoomLevel.current = 0
      toScale.current = 1

      centerImg() // simultaneously recenter
      return false
    }
    else if (zoomLevel.current > maxZoomLevel) {
      zoomLevel.current = maxZoomLevel
      toScale.current = zoomFactor ** maxZoomLevel

      animate()
      return false
    }
    else {
      isZooming.current = false
      resetZoom()
      return true
    }
  }

  /** reset zoom origin to 0 0 */
  const resetZoom = () => {
    if (zoomCenter.current.x === 0 && zoomCenter.current.y === 0) return

    imgOffset.current.x -= zoomCenter.current.x  * scale.current - zoomCenter.current.x
    imgOffset.current.y -= zoomCenter.current.y  * scale.current - zoomCenter.current.y
    toOffset.current.x = imgOffset.current.x
    toOffset.current.y = imgOffset.current.y
    zoomCenter.current.x = zoomCenter.current.y = 0
    applyCSS()
  }

  /** keep image centered on screen after zooming / panning */
  const centerImg = (smoothTransition: boolean = true) => {
    let doneChanging = true

    if (selected.curr && currImgRef.current) {
      const bounds = getImgOffsetBounds()

      // bound toOffset.current
      if (bounds.h * scale.current > currImgRef.current.clientHeight) {
        if (toOffset.current.y > bounds.t) {
          toOffset.current.y = bounds.t
          doneChanging = false
        }
        else if (toOffset.current.y < bounds.b) {
          toOffset.current.y = bounds.b
          doneChanging = false
        }
      }
      else { // center y
        const offsetY = (currImgRef.current.clientHeight - currImgRef.current.clientHeight * toScale.current) / 2
        if (toOffset.current.y !== offsetY) {
          toOffset.current.y = offsetY
          doneChanging = false
        }
      }

      if (bounds.w * scale.current > currImgRef.current.clientWidth) {
        canSwitchLeft.current = canSwitchRight.current = false

        if (toOffset.current.x >= bounds.l) {
          canSwitchLeft.current = true

          if (toOffset.current.x > bounds.l) {
            toOffset.current.x = bounds.l
            doneChanging = false
          }
        }
        else if (toOffset.current.x <= bounds.r) {
          canSwitchRight.current = true

          if (toOffset.current.x < bounds.r) {
            toOffset.current.x = bounds.r
            doneChanging = false
          }
        }
      }
      else { // center x
        const offsetX = (currImgRef.current.clientWidth - currImgRef.current.clientWidth * toScale.current) / 2
        if (toOffset.current.x !== offsetX) {
          toOffset.current.x = offsetX
          doneChanging = false
        }

        canSwitchLeft.current = canSwitchRight.current = true
      }

      animate(smoothTransition)
    }
    
    return doneChanging
  }

  /** get curr image on screen size and bounds imgOffset */
  const getImgOffsetBounds = () => {
    if (!selected.curr || !currImgRef.current) return { l: 0, r: 0, t: 0, b: 0, w: 0, h: 0 }

    const imgAspectRatio = selected.curr.width / selected.curr.height

    if (aspectRatio > imgAspectRatio) { // img fills height
      const imgWidth = currImgRef.current.clientHeight * imgAspectRatio
      const imgHeight = currImgRef.current.clientHeight

      const xGap = (currImgRef.current.clientWidth - imgWidth) / 2
      const top = 0
      const bot = imgHeight - imgHeight * scale.current
      const left = -xGap * scale.current
      const right = imgWidth + 2 * xGap - (imgWidth + xGap) * scale.current

      return { l: left, r: right, t: top, b: bot, w: imgWidth, h: imgHeight }
    }

    else { // img fills width
      const imgWidth = currImgRef.current.clientWidth
      const imgHeight = currImgRef.current.clientWidth / imgAspectRatio
      
      const yGap = (currImgRef.current.clientHeight - imgHeight) / 2
      const left = 0
      const right = imgWidth - imgWidth * scale.current
      const top = -yGap * scale.current
      const bot = imgHeight + 2 * yGap - (imgHeight + yGap) * scale.current

      return { l: left, r: right, t: top, b: bot, w: imgWidth, h: imgHeight }
    }
  }

  /** return true if position is on image */
  const onImg = (x: number, y: number) => {
    if (!selected.curr || !currImgRef.current) return false

    const imgAspectRatio = selected.curr.width / selected.curr.height

    if (aspectRatio > imgAspectRatio) {
      const imgWidth = currImgRef.current.clientHeight * imgAspectRatio

      const xGap = (currImgRef.current.clientWidth - imgWidth) / 2
      if (x < imgOffset.current.x + xGap * scale.current || x > imgOffset.current.x + (imgWidth + xGap) * scale.current)
        return false

      return true
    }
    else {
      const imgHeight = currImgRef.current.clientWidth / imgAspectRatio

      const yGap = (currImgRef.current.clientHeight - imgHeight) / 2
      if (y < imgOffset.current.y + yGap * scale.current || y > imgOffset.current.y + (imgHeight + yGap) * scale.current)
        return false

      return true
    }
  }

  const resetImg = () => {
    if (currImgRef.current) {
      imgOffset.current.x = toOffset.current.x = 0
      imgOffset.current.y = toOffset.current.y = 0
      scale.current = toScale.current = 1
      isZooming.current = animating.current = false
      zoomLevel.current = 0
      canSwitchLeft.current = canSwitchRight.current = true

      currImgRef.current.style.left = '0'
      currImgRef.current.style.top = '0'
      currImgRef.current.style.transform = 'scale(1)'
      currImgRef.current.style.transformOrigin = '0 0'
    }
  }

  // convert from viewport coords to relative coords
  const toRelative = (x: number, y: number) => {
    return {
      x: (x - imgOffset.current.x) / scale.current, 
      y: (y - imgOffset.current.y) / scale.current
    }
  }

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const deltaX = touch2.clientX - touch1.clientX
    const deltaY = touch2.clientY - touch1.clientY
    return Math.sqrt(deltaX ** 2 + deltaY ** 2)
  }

  /** Smoothly transitions from x0 to x1, returns what x0 should become in the next time step. */
  const calcSmoothTransition = (x0: number, x1: number, timestep: number): number => {
    const cutoff = 1
    if (Math.abs(x1 - x0) < cutoff) return x1
    return x0 + Math.sign(x1-x0) * ((Math.abs(x1-x0)+200)**2 / 2**16 - 0.55) * timestep
  }

  /*************************
        Event Handlers
  *************************/

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
      touchStart(event.touches)
  }
  const onTouchAction = (event: React.TouchEvent<HTMLDivElement>) => {
    touchAction(event.touches)
  }
  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    touchEnd(event.touches)
  }

  const onMouse = (event: React.MouseEvent<HTMLDivElement>) => {
    const toMoveX = event.clientX - prevX.current
    const toMoveY = event.clientY - prevY.current

    if (Math.abs(toMoveX) + Math.abs(toMoveY) < 10) return

    if (fullscreen) { // show title bar on mouse movement
      fullscrTime.current = Date.now()
    
      if (hidden.current) {
        hidden.current = false
        titleBar.current.classList.remove('hidden')
        document.documentElement.style.cursor = 'auto'
      }
    }

    mousePan(toMoveX, toMoveY)

    prevX.current = event.clientX
    prevY.current = event.clientY
    
  }

  const onMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    mousePanEnter(event.clientX, event.clientY)
  }

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    // Zoom in on scroll up, zoom out on scroll down
    const zoomStep = -event.deltaY / 500
    
    scrollZoom(zoomStep, event.clientX, event.clientY)
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
      const newSelected = {
        prev: getImage(promises[0]), 
        curr: getImage(selectedInd), 
        next: getImage(promises[1])
      }
      setSelected(newSelected)
    })
    
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [])

  const onVideoEnded = () => {
    if (!slideshow) return
    toLoad.current += 1
    loadNext()
  }

  useEffect(() => {
    if (!slideshow || selected.curr?.type === 'video') return

    const id = setInterval(slide, 3000)
    return () => clearInterval(id)
  }, [selectedInd, slideshow, selected.curr?.type])

  useEffect(() => {
    if (sliderTrackRef.current) {
      const frameWidth = sliderRef.current.clientWidth + margin*2
      sliderTrackRef.current.style.transform = `translateX(${currX.current - frameWidth - margin}px)`

      centerImg(false)
    }

    if (endX.current !== currX.current) {
      centerImgSwitch()
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
    <div className='viewer' ref={viewer} onKeyDown={onKeyDown} onMouseMove={onMouse} onMouseEnter={onMouseEnter} tabIndex={0}>
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
          onTouchStart={onTouchStart} onTouchMove={onTouchAction} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd} onWheel={onWheel} >
        <div className="slider-track" ref={sliderTrackRef}>
          {selected && sliderRef.current ? <>
            <ImgContainer key={selected.prev ? selected.prev.path : -1} img={selected.prev} imgRef={undefined}
                aspectRatio={sliderRef.current.clientWidth / sliderRef.current.clientHeight} margin={margin} selected={false} />
            <ImgContainer key={selected.curr ? selected.curr.path : -2} img={selected.curr} imgRef={currImgRef} 
                aspectRatio={sliderRef.current.clientWidth / sliderRef.current.clientHeight} margin={margin} selected={true}
                slideshow={slideshow} onVideoEnded={onVideoEnded} />
            <ImgContainer key={selected.next ? selected.next.path : -3} img={selected.next} imgRef={undefined}
                aspectRatio={sliderRef.current.clientWidth / sliderRef.current.clientHeight} margin={margin} selected={false} />
          </> : <div></div>
          }
        </div>
      </div>
    </div>
  )
}