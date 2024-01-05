import { useRef } from "react"
import { image } from "../Types"
import './ImgPreview.css'


export default function ImgPreview({ img, width, margin, cols, onClick }: 
                      { img: image, width: number, margin: number, cols: number, onClick: (e: React.MouseEvent) => void }) {

  // const mouseEnter = () => {
  //   svgRef.current.style.
  // }

  const mouseLeave = () => {

  }

  const imgRatio = img.height / img.width
  const actualWidth = (window.innerWidth - cols * margin * 2) * width / 100
  const actualHeight = imgRatio * actualWidth
  

  return (
    <>
      <div className="preview-container" onClick={onClick}
            style={{width: actualWidth, height: actualHeight, margin: `${margin}px 0 0 0`}} >
        {img.type === 'video'
          ? <svg viewBox='0 0 50 50' className='play-icon'>
              <path d="M 17 12 L 17 38 L 38 25 L 17 12"/>
              <path d="M 15 10 L 15 40 M 15 40 L 40 25 M 40 25 L 15 10"/>
            </svg>
          : <></>}
      </div>
      
      <img src={'http://192.168.1.252' + img.thumb} alt={img.name} style={{margin: `${margin}px 0`}} />
    </>
  )
  }