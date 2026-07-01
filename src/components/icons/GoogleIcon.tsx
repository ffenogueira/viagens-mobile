import React from 'react'
import Svg, { Path } from 'react-native-svg'

type GoogleIconProps = {
  size?: number
}

export function GoogleIcon({ size = 20 }: GoogleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M23.52 12.27c0-.82-.07-1.42-.22-2.05H12v3.72h6.44a4.77 4.77 0 0 1-2.04 3.13v2.58h3.3c1.93-1.78 3.04-4.4 3.04-7.38z"
        fill="#4285F4"
      />
      <Path
        d="M12 24c2.7 0 4.96-.89 6.62-2.42l-3.3-2.58c-.89.6-2.04.95-3.32.95-2.55 0-4.71-1.72-5.48-4.03H3.11v2.66A11.99 11.99 0 0 0 12 24z"
        fill="#34A853"
      />
      <Path
        d="M6.52 14.92A7.2 7.2 0 0 1 6.16 12c0-1.01.18-1.99.36-2.92V6.42H3.11A11.99 11.99 0 0 0 0 12c0 1.94.47 3.77 1.28 5.42l3.24-2.5z"
        fill="#FBBC05"
      />
      <Path
        d="M12 4.75c1.47 0 2.78.5 3.81 1.48l2.85-2.85C16.96 1.58 14.7.75 12 .75A11.99 11.99 0 0 0 3.11 6.42l3.35 2.66C7.29 6.47 9.45 4.75 12 4.75z"
        fill="#EA4335"
      />
    </Svg>
  )
}
