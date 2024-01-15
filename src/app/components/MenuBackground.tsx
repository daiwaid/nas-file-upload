import { useRef } from "react"
import './MenuBackground.css'

export default function MenuBackground({ onClick }: 
                        { onClick: (e: React.MouseEvent) => void }) {

  return (
    <div className={'menu-backgnd'} onClick={onClick}></div>
  )
}