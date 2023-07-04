export default function StatusIcon({status}: {status: string}) {
  switch (status) {
    case 'Upload': return (
      <svg viewBox='50 50 300 300' className='svg-1'>
        <path d="M 100 200 L 300 200"/>
        <path d="M 200 100 L 200 300"/>
      </svg>
    )
    case 'Uploaded': return (
      <svg viewBox='50 50 300 300' className='svg-3'>
        <path id='path1' d="M 165.882 300 L 300 142.8"/>
        <path id='path2' d="M 100 229.621 L 165.782 300"/>
      </svg>
    )
    default: return (
      <svg viewBox='50 50 300 300' className='svg-2'>
        <ellipse cx="200" cy="200" rx="100" ry="100" />
      </svg> 
    )
  }
}