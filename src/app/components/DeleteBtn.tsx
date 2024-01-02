import { useRef } from 'react'
import './DeleteBtn.css'
import Icon from './Icon'

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

  return (
    <div className="delete-menu">
      <div onClick={openMenu} style={{position: 'absolute'}}>{<Icon icon='trash'/>}</div>
      <div className="delete-dropdown" ref={dropdown}>
        <div onClick={closeMenu} style={{rotate: '45deg'}}>{<Icon icon='ex'/>}</div>
        <div onClick={confirmDelete}>{<Icon icon='check'/>}</div>
      </div>
    </div>
  )
}