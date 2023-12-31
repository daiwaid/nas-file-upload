'use client'

import { useRef, useState } from "react"
import StatusIcon from "./StatusIcon"
import './Upload.css'

export default function Upload({ reloadImgs }: { reloadImgs: () => void }) {
  const [status, setStatus] = useState('Upload')

  const form = useRef<any>(null)

  const uploadFiles = async (files: any[]) => {
    let formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files[]', files[i])
      if (i % 20 == 19 || i == files.length-1) {
        await fetch('http://192.168.1.252/process.php', {method: "POST", body: formData})
        formData = new FormData()
      }
    }
  }

  const handleUpload = (event: any) => {
    const files: any[] = Array.from(event.target.files)
    if (files.length === 1) setStatus('Uploading 1 file...')
    else setStatus(`Uploading ${files.length} files...`)
    
    form.current.reset()
    uploadFiles(files)
    .then(res => {
      setStatus('Uploaded')
      reloadImgs()
      setTimeout(() => setStatus('Upload'), 3000)
    })
  }

  return (
    <form className='upl item-right' ref={form} onChange={handleUpload}>
      <StatusIcon status={status} classNames="btn abs" />
      <input type="file" accept=".jpg,.jpeg,.png,.gif,.mp4,.mov" className='box__file' multiple />
    </form>
    
  )
}