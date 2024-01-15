import { useRef, useState } from 'react'
import './DeleteBtn.css'
import Icon from './Icon'
import MenuBackground from './MenuBackground'

export default function DeleteBtn({ removeImg }: { removeImg: () => void }) {
  const [menuOpen, setmenuOpen] = useState(false)
  const dropdown = useRef<any>()
  

  const openMenu = () => {
    dropdown.current.style.transform = 'translateY(0px)'
    setmenuOpen(true)
  }

  const closeMenu = () => {
    dropdown.current.style.transform = 'translateY(-150px)'
    setmenuOpen(false)
  }

  const confirmDelete = () => {
    closeMenu()
    removeImg()
  }

  return (
    <div className="delete-menu item-right">
      <div onClick={openMenu} style={{position: 'absolute'}}>{<Icon icon='trash'/>}</div>
      <div className="delete-dropdown" ref={dropdown}>
        <div onClick={closeMenu}>{<Icon icon='ex' />}</div>
        <div onClick={confirmDelete}>{<Icon icon='check'/>}</div>
      </div>
      {menuOpen ? <MenuBackground onClick={closeMenu} /> : <></>}
    </div>
  )
}