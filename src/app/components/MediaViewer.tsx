'use client'

import { Dispatch, EventHandler, KeyboardEventHandler, useRef } from 'react'
import { image } from '../Types'
import './mediaViewer.css'

export default function MediaViewer({ selected, setSelected, getPrev, getNext, hideButtons }: 
                        { selected: image, setSelected: Dispatch<React.SetStateAction<image>>, 
                          getPrev: () => void, getNext: () => void, hideButtons: boolean[] }) {

  const l_bttn = useRef<any>()
  const r_bttn = useRef<any>()

  const hideViewer = () => {
    document.documentElement.style.overflow = 'auto'
    setSelected({} as image)
  }

  if (l_bttn.current) {
    if (hideButtons[0]) {
      l_bttn.current.style.opacity = 0
      l_bttn.current.style.cursor = 'default'
    }
    else {
      l_bttn.current.style.opacity = 1
      l_bttn.current.style.cursor = 'pointer'
    }
  }

  if (r_bttn.current) {
    if (hideButtons[1]) {
      r_bttn.current.style.opacity = 0
      r_bttn.current.style.cursor = 'default'
    }
    else {
      r_bttn.current.style.opacity = 1
      r_bttn.current.style.cursor = 'pointer'
    }

  }

  const ex = <svg viewBox='0 0 50 50' className='btn'>
              <path d="M 7 25 L 43 25"/>
              <path d="M 25 7 L 25 43"/>
            </svg>
  
  const arrow = <svg viewBox='0 0 50 50' className='btn'>
                  <path d="M 15 10 L 30 25"/>
                  <path d="M 15 40 L 30 25"/>
                </svg>

  if (selected.name) {
    return (
      <div className="viewer">
        <div className="title">
          <div className='title-left' onClick={hideViewer} style={{rotate: '45deg'}}>{ex}</div>
          <div className='title-right' ref={l_bttn} onClick={getPrev} style={{rotate: '180deg'}}>{arrow}</div>
          <div className='title-center-mv'>{selected.name}</div>
          <div className='title-left' ref={r_bttn} onClick={getNext}>{arrow}</div>
          <div className='title-right'></div>
        </div>
        <div className='img-container'>
          <img src={'http://192.168.1.252' + selected.path} />
        </div>
        
      </div>
    )
  }
}