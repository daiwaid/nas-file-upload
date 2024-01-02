
export default function MessageWindow( {message}: {message: string[]}) {

  return (
    <div style={{position: 'absolute', width: '50vw', height: '10vh', transform: 'translate(50%, 100%)', backgroundColor: 'black', border: '2px solid white', zIndex: 2, overflow: 'scroll'}}>
      {message.map( (m, i) => <div key={i}>{m}</div>)}
    </div>
  )
}