import { useEffect, useRef, useState } from "react";
import { image } from "../Types";
import './ImgContainer.css'


export default function ImgContainer({ img, aspectRatio, selected, margin }: 
                          { img: image|undefined, aspectRatio: number, selected: boolean, margin: number }) {
  const [loaded, setLoaded] = useState(false)
  const imgContainer = useRef<any>()

  useEffect(() => {
    if (selected && loaded) imgContainer.current.classList.add('loaded')
  }, [selected, loaded])

  return (
    <>
      { img ?
        <div className='img-container' ref={imgContainer} style={{backgroundImage: 'url(' + 'http://192.168.1.252' + img.thumb + ')', margin: `0 ${margin}px`}}>
          {
            aspectRatio > img.width / img.height
              ? <img src={'http://192.168.1.252' + img.path} onLoad={() => setLoaded(true)} loading="eager" style={{minHeight: '100%', width: 'auto'}} alt={img.name} />
              : <img src={'http://192.168.1.252' + img.path} onLoad={() => setLoaded(true)} loading="eager" style={{minWidth: '100%', height: 'auto'}} alt={img.name} />
          }
        </div> : <div className='img-container' ref={imgContainer} style={{margin:  `0 ${margin}px`}}></div> }
    </>
  )
}