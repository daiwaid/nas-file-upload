import { memo, useEffect, useRef, useState } from "react"
import './ImgContainer.css'
import { image } from "../Types"


const ImgContainer = memo(({ img, aspectRatio, margin, selected }: 
                          { img: image|undefined, aspectRatio: number, margin: number, selected: boolean }) =>  {

  const imgContainer = useRef<any>()
  const preload = new Image()
  const [loaded, setLoaded] = useState(false)

  const innerTag = () => {
    if (img) {
      console.log(img.type)
      const style = aspectRatio > img.width / img.height
                      ? {minHeight: '100%', width: 'auto'}
                      : {minWidth: '100%', height: 'auto'}

      if (img.type === 'image' && loaded) {
        return <img src={`http://192.168.1.252${img.path}`} alt={img.name} style={style} />
      }
      if (img.type === 'video' && selected) {
        return <video src={`http://192.168.1.252${img.path}`} controls style={style} />
      }
    }
    return <></>
  }

  useEffect(() => {
    if (img) {
      preload.src = `http://192.168.1.252${img.path}`
      preload.onload = () => setLoaded(true)
    }
  }, [img])

  return (
    <>
      { img
        ? <div className='img-container' ref={imgContainer} style={{backgroundImage: `url('http://192.168.1.252${img.thumb}')`, margin: `0 ${margin}px`}}>
            {innerTag()}
          </div> 
        : <div className='img-container' ref={imgContainer} style={{margin:  `0 ${margin}px`}}></div> }
    </>
  )
})

ImgContainer.displayName = 'ImgContainer'
export default ImgContainer