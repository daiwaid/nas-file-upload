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

  const menu = useRef<any>(null)

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
    if (event.deltaY < 0) updateYear(selectedYr - 1)
    else if (event.deltaY > 0) updateYear(selectedYr + 1)
  }
  const scrollMn = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.deltaY < 0) updateMonth(selectedMn - 1)
    else if (event.deltaY > 0) updateMonth(selectedMn + 1)
  }

  const openMenu = () => {
    if (menu.current) {
      setScroll(false)
      menu.current.style.transform = 'translateY(0px)'
    }
  }

  const closeMenu = () => {
    if (menu.current) {
      setScroll(true)
      menu.current.style.transform = 'translateY(-300px)'
      const ind = yearsLen.current[selectedYr] + selectedMn - 3
      if (ind !== currPage)
        updateCurrPage(ind)
    }
  }

  const check = <svg viewBox='5 5 30 30' className='btn'>
        <path d="M 17 30 L 30 14"/>
        <path d="M 10 23 L 17 30"/>
      </svg>

  useEffect(() => {
    let selYr = 3, selMn = 3, mnInd = 0
    month.current = []
    year.current = [<span>&nbsp;&nbsp;</span>, <span>&nbsp;&nbsp;</span>, <span>&nbsp;&nbsp;</span>]
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
        month.current[currYr] = [<span>&nbsp;&nbsp;</span>, <span>&nbsp;&nbsp;</span>, <span>&nbsp;&nbsp;</span>, pg.month]
      else
        month.current[currYr].push(pg.month)
      if (i === currPage) {
        selYr = year.current.length - 1
        selMn = mnInd + 3
      }
      mnInd += 1
    }
    year.current = year.current.concat([<span>&nbsp;&nbsp;</span>, <span>&nbsp;&nbsp;</span>, <span>&nbsp;&nbsp;</span>])
    setSelectedYr(selYr)
    setSelectedMn(selMn)
  }, [currPage])

  if (month.current[selectedYr]) {
    return (
      <div className="menu-area">
        <div className='sel-area' onClick={openMenu}></div>

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
                    return <div key={i.toString()} className='wheel-one' onClick={() => updateYear(i)}>{y}</div>
                  return <div key={i.toString()} className='wheel-one selable' onClick={() => updateYear(i)}>{y}</div>
                }
                if (Math.abs(i - selectedYr) === 2) {
                  if (i < 3 || i >= year.current.length - 3)
                    return <div key={i.toString()} className='wheel-two' onClick={() => updateYear(i)}>{y}</div>
                  return <div key={i.toString()} className='wheel-two selable' onClick={() => updateYear(i)}>{y}</div>
                }
                if (Math.abs(i - selectedYr) === 3) {
                  if (i < 3 || i >= year.current.length - 3)
                    return <div key={i.toString()} className='wheel-three' onClick={() => updateYear(i)}>{y}</div>
                  return <div key={i.toString()} className='wheel-three selable' onClick={() => updateYear(i)}>{y}</div>
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
                  return <div key={i.toString()} className='wheel-one' onClick={() => updateMonth(i)}>{y}</div>
                return <div key={i.toString()} className='wheel-one selable' onClick={() => updateMonth(i)}>{y}</div>
              }
              if (Math.abs(i - selectedMn) === 2) {
                if (i < 3)
                  return <div key={i.toString()} className='wheel-two' onClick={() => updateMonth(i)}>{y}</div>
                return <div key={i.toString()} className='wheel-two selable' onClick={() => updateMonth(i)}>{y}</div>
              }
              if (Math.abs(i - selectedMn) === 3) {
                if (i < 3)
                  return <div key={i.toString()} className='wheel-three' onClick={() => updateMonth(i)}>{y}</div>
                return <div key={i.toString()} className='wheel-three selable' onClick={() => updateMonth(i)}>{y}</div>
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
      <div className='sel-area' onClick={openMenu}></div>
    </div>
    
  )
  

}