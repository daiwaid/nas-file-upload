import { memo, useEffect, useRef, useState } from "react"
import './ImgContainer.css'
import { image } from "../Types"


const ImgContainer = memo(({ img, aspectRatio, margin, selected, imgRef, slideshow, onVideoEnded }: 
                          { img: image|undefined, aspectRatio: number, margin: number, 
                            selected: boolean, imgRef: any, slideshow?: boolean, onVideoEnded?: () => void }) =>  {

  const preload = new Image()
  const [loaded, setLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const innerTag = () => {
    if (img) {
      const style = aspectRatio > img.width / img.height
                      ? {minHeight: '100%', width: 'auto'}
                      : {minWidth: '100%', height: 'auto'}

      if (img.type === 'image' && loaded) {
        return <img src={`http://192.168.1.252${img.path}`} alt={img.name} style={style} />
      }
      if (img.type === 'video' && selected) {
        return <video ref={videoRef} src={`http://192.168.1.252${img.path}`} controls
            autoPlay={slideshow} playsInline style={style}
            onEnded={slideshow ? onVideoEnded : undefined} />
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

  useEffect(() => {
    if (!slideshow || !selected || img?.type !== 'video') return
    const video = videoRef.current
    if (!video) return
    video.muted = false
    video.play().catch(() => {})
  }, [slideshow, selected, img])

  return (
    <>
      { img
        ? <div className='img-container' ref={imgRef} style={{backgroundImage: `url('http://192.168.1.252${img.thumb}')`, margin: `0 ${margin}px`}}>
            {innerTag()}
          </div> 
        : <div className='img-container' ref={imgRef} style={{margin:  `0 ${margin}px`}}></div> }
    </>
  )
})

ImgContainer.displayName = 'ImgContainer'
export default ImgContainer