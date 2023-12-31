export default function StatusIcon({ status, classNames, onClick }: { status: string, classNames: string, onClick?: (e: any) => void }) {
  switch (status) {
    case 'Upload': return (
      <svg viewBox='0 0 50 50' className={`plus ${classNames}`} onClick={onClick}>
        <path d="M 10 25 L 40 25"/>
        <path d="M 25 10 L 25 40"/>
      </svg>
    )
    case 'Uploaded': return (
      <svg viewBox='0 0 50 50' className={`check ${classNames}`} onClick={onClick}>
        <path id="path1" d="M 10 30 L 20 40"/>
        <path id="path2" d="M 20 40 L 45 15"/>
      </svg>
    )
    default: return (
      <svg viewBox='0 0 50 50' className={`circle ${classNames}`} onClick={onClick}>
        <ellipse cx="25" cy="25" rx="10" ry="10" />
      </svg> 
    )
  }
}