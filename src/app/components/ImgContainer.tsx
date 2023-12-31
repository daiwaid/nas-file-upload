import { memo, useEffect, useRef } from "react";
import './ImgContainer.css'
import { image } from "../Types";


const ImgContainer = memo(({ img, aspectRatio, margin }: 
                          { img: image|undefined, aspectRatio: number, margin: number }) =>  {

  const imgContainer = useRef<any>()
  const preload = new Image()

  const load = () => {
    if (imgContainer.current) imgContainer.current.classList.add('loaded')
  }

  useEffect(() => {
    if (img) {
      preload.src = `http://192.168.1.252${img.path}`
      preload.onload = load
    }
  }, [img])

  return (
    <>
      { img ?
        <div className='img-container' ref={imgContainer} style={{backgroundImage: `url('http://192.168.1.252${img.thumb}')`, margin: `0 ${margin}px`}}>
          <img src={`http://192.168.1.252${img.path}`} alt={img.name} style={aspectRatio > img.width / img.height
        ? {minHeight: '100%', width: 'auto'}
        : {minWidth: '100%', height: 'auto'}} />
        </div> : <div className='img-container' ref={imgContainer} style={{margin:  `0 ${margin}px`}}></div> }
    </>
  )
})

ImgContainer.displayName = 'ImgContainer'
export default ImgContainer