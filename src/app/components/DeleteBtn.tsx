import { useRef } from 'react'
import './deleteBtn.css'

export default function DeleteBtn({removeImg}: {removeImg: () => void}) {
  const dropdown = useRef<any>()

  const openMenu = () => {
    dropdown.current.style.transform = 'translateY(0px)'
  }

  const closeMenu = () => {
    dropdown.current.style.transform = 'translateY(-150px)'
  }

  const confirmDelete = () => {
    closeMenu()
    removeImg()
  }

  const trash = <svg viewBox='0 0 50 50' className='btn'>
                  <path d="M 39 12 L 36 43 L 14 43 L 11 12" />
                  <path d="M 10 12 L 40 12"/>
                  <path d="M 20 21 L 21 35"/>
                  <path d="M 30 21 L 29 35"/>
                  <path d="M 16 7 L 34 7"/>
                </svg>
  
  const ex = <svg viewBox='0 0 50 50' className='btn'>
              <path d="M 7 25 L 43 25"/>
              <path d="M 25 7 L 25 43"/>
            </svg>
  
  const check = <svg viewBox='0 0 50 50' className='btn'>
        <path d="M 20 37 L 40 14"/>
        <path d="M 10 25 L 20 37"/>
      </svg>

  return (
    <div className="delete-menu">
      <div onClick={openMenu} style={{position: 'absolute'}}>{trash}</div>
      <div className="delete-dropdown" ref={dropdown}>
        <div onClick={closeMenu} style={{rotate: '45deg'}}>{ex}</div>
        <div onClick={confirmDelete}>{check}</div>
      </div>
    </div>
  )
}