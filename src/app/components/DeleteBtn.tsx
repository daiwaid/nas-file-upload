import { useRef } from 'react'
import './DeleteBtn.css'

export default function DeleteBtn({ removeImg }: { removeImg: () => void }) {
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
                  <path d="M 38 14 L 35 41 L 14 41 L 12 14" />
                  <path d="M 10.5 14 L 39.5 14"/>
                  <path d="M 21 22 L 21.5 32"/>
                  <path d="M 29 22 L 28.5 32"/>
                  <path d="M 17 8 L 33 8"/>
                </svg>
  
  const ex = <svg viewBox='0 0 50 50' className='btn'>
              <path d="M 7 25 L 43 25"/>
              <path d="M 25 7 L 25 43"/>
            </svg>
  
  const check = <svg viewBox='0 0 50 50' className='btn'>
        <path d="M 20 35 L 40 12"/>
        <path d="M 10 25 L 20 35"/>
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