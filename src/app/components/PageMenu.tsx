import { useEffect, useRef, useState } from 'react'
import './PageMenu.css'
import { table } from '../Types'
import Icon from './Icon'
import MenuBackground from './MenuBackground'

export default function PageMenu({ pages, currPage, updateCurrPage, setScroll }: { pages: table[], currPage: number, 
                                    updateCurrPage: (ind: number) => void, setScroll: (state: boolean) => void }) {

  const year = useRef<any[]>([])
  const yearsLen = useRef<number[]>([])
  const month = useRef<{[id: number]: any[]}>({})
  const [selectedYr, setSelectedYr] = useState<number>(0)
  const [selectedMn, setSelectedMn] = useState<number>(3)
  const lastClick = useRef<number>(0)

  const menu = useRef<any>()
  const [menuOpen, setmenuOpen] = useState(false)
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
    if (lastClick.current < (Date.now() - 100) || Math.abs(event.deltaY) >= 100) {
      lastClick.current = Date.now()
      if (event.deltaY < 0) updateYear(selectedYr - 1)
      else if (event.deltaY > 0) updateYear(selectedYr + 1)
    }
  }
  const scrollMn = (event: React.WheelEvent<HTMLDivElement>) => {
    console.log(event.deltaY)
    if (lastClick.current < (Date.now() - 100) || Math.abs(event.deltaY) >= 100) {
      lastClick.current = Date.now()
      if (event.deltaY < 0) updateMonth(selectedMn - 1)
      else if (event.deltaY > 0) updateMonth(selectedMn + 1)
    }
  }

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    lastSeled.current = [selectedYr, selectedMn]
    setScroll(false)
    setmenuOpen(true)
    menu.current.style.transform = 'translateX(-50%) translateY(0px)'
    titleFixed.current.style.display = 'inline'
  }

  const closeMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setScroll(true)
    setmenuOpen(false)
    menu.current.style.transform = 'translateX(-50%) translateY(-300px)'
    titleFixed.current.style.display = 'none'
    const ind = yearsLen.current[selectedYr] + selectedMn - 3
    if (ind !== currPage)
      updateCurrPage(ind)
  }

  const disgardMenu = () => {
    menu.current.style.transform = 'translateX(-50%) translateY(-300px)'
    titleFixed.current.style.display = 'none'
    setScroll(true)
    setmenuOpen(false)
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

  if (month.current[selectedYr]) {
    return (
      <div>
        <div className="title-fixed" ref={titleFixed}></div>
        <div className='sel-area' onClick={openMenu}>{pages[currPage] ? pages[currPage].year + '-' + pages[currPage].month : ''}</div>
        <div className="dropdown" ref={menu}>
          <div></div>
          <div onClick={closeMenu}>{<Icon icon='check'/>}</div>
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
        {menuOpen ? <MenuBackground onClick={disgardMenu} /> : <></>}
      </div>
    )
  }
  else return (
    <div className="menu-area">
      <div className='sel-area' onClick={openMenu}>{pages[currPage] ? pages[currPage].year + '-' + pages[currPage].month : ''}</div>
    </div>
  )
  
}