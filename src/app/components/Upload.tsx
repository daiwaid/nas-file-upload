'use client'

import { useRef, useState } from "react"
import StatusIcon from "./StatusIcon"
import './upload.css'

export default function Upload({ togglePages }: { togglePages: () => void }) {
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
      setTimeout(() => setStatus('Upload'), 2000)
    })
  }
  
  const arrow = <svg viewBox='0 0 50 50' className='btn'>
                  <path d="M 15 10 L 35 25"/>
                  <path d="M 15 40 L 35 25"/>
                </svg>

  return (
    <div className="upl">
      <div className='left-arr' onClick={togglePages} style={{rotate: '180deg'}}>{arrow}</div>
      <form className='upload' ref={form} onChange={handleUpload}>
        <StatusIcon status={status} />
        <input type="file" className='box__file' multiple/>
        <label htmlFor="file">{status}</label>
      </form>
    </div>  
  )
}