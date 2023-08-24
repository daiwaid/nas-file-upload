import { useEffect, useRef, useState } from 'react'
import './pageMenu.css'
import axios from 'axios'
import { table } from '../Types'

export default function PageMenu({ pages, currPage, updateCurrPage, setScroll }: { pages: table[], currPage: number, 
                                    updateCurrPage: (ind: number) => void, setScroll: (state: boolean) => void }) {

  const year = useRef<any[]>([])
  const yearsLen = useRef<number[]>([])
  const month = useRef<{[id: number]: any[]}>({})
  const [selectedYr, setSelectedYr] = useState<number>(0)
  const [selectedMn, setSelectedMn] = useState<number>(3)
  const lastClick = useRef<number>(0)

  const menu = useRef<any>()
  const menuBackground = useRef<any>()
  const titleFixed = useRef<any>()
  const lastSeled = useRef<number[]>([0, 0])

  const updateYear = (ind: number) => {
    if (ind >= 3 && ind < year.current.length - 3) {
      setSelectedYr(ind)
      setSelectedMn(3)
    }
  }

  const updateMonth = (ind: number) => {
    if (ind >= 3 && ind < month.current[selectedYr].length)
      setSelectedMn(ind)
  }

  const scrollYr = (event: React.WheelEvent<HTMLDivElement>) => {
    if (lastClick.current < (Date.now() - 50)) {
      lastClick.current = Date.now()
      if (event.deltaY < 0) updateYear(selectedYr - 1)
      else if (event.deltaY > 0) updateYear(selectedYr + 1)
    }
  }
  const scrollMn = (event: React.WheelEvent<HTMLDivElement>) => {
    if (lastClick.current < (Date.now() - 50)) {
      lastClick.current = Date.now()
      if (event.deltaY < 0) updateMonth(selectedMn - 1)
      else if (event.deltaY > 0) updateMonth(selectedMn + 1)
    }
  }

  const openMenu = (e: any) => {
    e.stopPropagation()
    lastSeled.current = [selectedYr, selectedMn]
    setScroll(false)
    menuBackground.current.classList.add('visible')
    menu.current.style.transform = 'translateX(-50%) translateY(0px)'
    titleFixed.current.style.display = 'inline'
  }

  const closeMenu = (e: any) => {
    e.stopPropagation()
    setScroll(true)
    menuBackground.current.classList.remove('visible')
    menu.current.style.transform = 'translateX(-50%) translateY(-300px)'
    titleFixed.current.style.display = 'none'
    const ind = yearsLen.current[selectedYr] + selectedMn - 3
    if (ind !== currPage)
      updateCurrPage(ind)
  }

  const disgardMenu = () => {
    menuBackground.current.classList.remove('visible')
    menu.current.style.transform = 'translateX(-50%) translateY(-300px)'
    titleFixed.current.style.display = 'none'
    setScroll(true)
    setSelectedYr(lastSeled.current[0])
    setSelectedMn(lastSeled.current[1])
  }

  const updateMenu = () => {
    let selYr = 3, selMn = 3, mnInd = 0
    month.current = []
    year.current = [<span key={0}>&nbsp;&nbsp;</span>, <span key={1}>&nbsp;&nbsp;</span>, <span key={2}>&nbsp;&nbsp;</span>]
    yearsLen.current = [0, 0, 0]
    for (let i = 0; i < pages.length; i++) {
      const pg = pages[i]
      if (!year.current.includes(pg.year)) {
        year.current.push(pg.year)
        yearsLen.current.push(i)
        mnInd = 0
      }
        
      const currYr = year.current.length-1
      if (!month.current[currYr])
        month.current[currYr] = [<span key={0}>&nbsp;&nbsp;</span>, <span key={1}>&nbsp;&nbsp;</span>, <span key={2}>&nbsp;&nbsp;</span>, pg.month]
      else
        month.current[currYr].push(pg.month)
      if (i === currPage) {
        selYr = year.current.length - 1
        selMn = mnInd + 3
      }
      mnInd += 1
    }
    year.current = year.current.concat([<span key={0}>&nbsp;&nbsp;</span>, <span key={1}>&nbsp;&nbsp;</span>, <span key={2}>&nbsp;&nbsp;</span>])
    setSelectedYr(selYr)
    setSelectedMn(selMn)
  }

  const onYear = (e: any, i: number) => {
    e.stopPropagation()
    updateYear(i)
  }

  const onMonth = (e: any, i: number) => {
    e.stopPropagation()
    updateMonth(i)
  }

  useEffect(() => {
    updateMenu()
  }, [currPage])

  const check = <svg viewBox='5 5 30 30' className='btn'>
        <path d="M 17 30 L 30 14"/>
        <path d="M 10 23 L 17 30"/>
      </svg>

  if (month.current[selectedYr]) {
    return (
      <div>
        <div className="title-fixed" ref={titleFixed}></div>
        <div className='menu-backgnd' ref={menuBackground} onClick={disgardMenu}></div>
        <div className='sel-area' onClick={openMenu}>{pages[currPage] ? pages[currPage].year + '-' + pages[currPage].month : ''}</div>
        <div className="dropdown" ref={menu}>
          <div></div>
          <div onClick={closeMenu}>{check}</div>
          <div></div>
          <div className="dropdown-content" onWheel={scrollYr}>
            <div>
              {year.current.map((y, i) => {
                if (i === selectedYr)
                  return <div key={i.toString()} className='wheel-sel selable'>{y}</div>
                if (Math.abs(i - selectedYr) === 1) {
                  if (i < 3 || i >= year.current.length - 3)
                    return <div key={i.toString()} className='wheel-one'>{y}</div>
                  return <div key={i.toString()} className='wheel-one selable' onClick={(e) => onYear(e, i)}>{y}</div>
                }
                if (Math.abs(i - selectedYr) === 2) {
                  if (i < 3 || i >= year.current.length - 3)
                    return <div key={i.toString()} className='wheel-two'>{y}</div>
                  return <div key={i.toString()} className='wheel-two selable' onClick={(e) => onYear(e, i)}>{y}</div>
                }
                if (Math.abs(i - selectedYr) === 3) {
                  if (i < 3 || i >= year.current.length - 3)
                    return <div key={i.toString()} className='wheel-three'>{y}</div>
                  return <div key={i.toString()} className='wheel-three selable' onClick={(e) => onYear(e, i)}>{y}</div>
                }
                else return <div key={i.toString()} className='wheel-rest'>{y}</div>
              })}
            </div>
          </div>
          <div style={{alignSelf: 'center'}}>-</div>
          <div className="dropdown-content" onWheel={scrollMn}>
            {month.current[selectedYr].map((y, i) => {
                if (i === selectedMn)
                  return <div key={i.toString()} className='wheel-sel selable'>{y}</div>
                if (Math.abs(i - selectedMn) === 1) {
                  if (i < 3)
                    return <div key={i.toString()} className='wheel-one'>{y}</div>
                  return <div key={i.toString()} className='wheel-one selable' onClick={(e) => onMonth(e, i)}>{y}</div>
                }
                if (Math.abs(i - selectedMn) === 2) {
                  if (i < 3)
                    return <div key={i.toString()} className='wheel-two'>{y}</div>
                  return <div key={i.toString()} className='wheel-two selable' onClick={(e) => onMonth(e, i)}>{y}</div>
                }
                if (Math.abs(i - selectedMn) === 3) {
                  if (i < 3)
                    return <div key={i.toString()} className='wheel-three'>{y}</div>
                  return <div key={i.toString()} className='wheel-three selable' onClick={(e) => onMonth(e, i)}>{y}</div>
                }
                else return <div key={i.toString()} className='wheel-rest'>{y}</div>
            })}
          </div>
        </div>
      </div>
    )
  }
  else return (
    <div className="menu-area">
      <div className='sel-area' onClick={openMenu}>{pages[currPage] ? pages[currPage].year + '-' + pages[currPage].month : ''}</div>
    </div>
  )
  
}