import { memo } from "react";

const Icon = memo(({ icon, className='' }: { icon: string, className?: string }) => {
  const icons: {[key: string]: React.ReactElement} = {
    arrow:    <>
                <path d="M 15 10 L 35 25"/>
                <path d="M 15 40 L 35 25"/>
              </>,
    magnifyUp: <>
                <circle cx='25' cy='25' r='14' />
                <path d='M 34.9 34.9 L 40 40' />
                <path d="M 19 25 L 31 25"/>
                <path d="M 25 19 L 25 31"/>
              </>,
    magnifyDown: <>
                <circle cx='25' cy='25' r='14' />
                <path d='M 34.9 34.9 L 40 40' />
                <path d="M 19 25 L 31 25"/>
              </>,
    arrOut:   <>
                <path d="M 24 11 L 38 12 M 38 12 L 39 26"/>
                <path d="M 11 24 L 12 38 M 12 38 L 26 39"/>
              </>,
    arrIn:    <>
                <path d="M 28 7 L 29 21 M 29 21 L 43 22"/>
                <path d="M 7 28 L 21 29 M 21 29 L 22 43"/>
              </>,
    play:     <>
                <path stroke='none' d="M 17 12 L 17 38 L 38 25 L 17 12"/>
                <path d="M 15 10 L 15 40 M 15 40 L 40 25 M 40 25 L 15 10"/>
              </>,
    trash:    <>
                <path d="M 38 14 L 35 41 L 14 41 L 12 14" />
                <path d="M 10.5 14 L 39.5 14"/>
                <path d="M 21 22 L 21.5 32"/>
                <path d="M 29 22 L 28.5 32"/>
                <path d="M 17 8 L 33 8"/>
              </>,
    ex:       <>
                <path d="M 7 25 L 43 25"/>
                <path d="M 25 7 L 25 43"/>
              </>,
    check:    <>
                <path d="M 20 35 L 40 12"/>
                <path d="M 10 25 L 20 35"/>
              </>
  }

  return (
    <svg viewBox='0 0 50 50' className={`btn ${className}`}>
      {icons[icon]}
    </svg>
  )
})

Icon.displayName = 'Icon'
export default Icon