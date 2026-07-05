import React, { useEffect, useState } from 'react'
import { Avatar, AvatarFallbackText, AvatarImage } from '../../components/ui'
import { DEMO_AVATAR_URI } from '../lib/demoAssets'
import { getInitials } from './shared'

type UserAvatarProps = {
  name?: string | null
  imageUri?: string | null
  className?: string
  fallbackClassName?: string
}

export function UserAvatar({ name, imageUri, className, fallbackClassName }: UserAvatarProps) {
  const uri = imageUri ?? DEMO_AVATAR_URI
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [uri])

  const showInitials = !uri || failed

  return (
    <Avatar className={className}>
      {uri && !failed ? (
        <AvatarImage source={{ uri }} onError={() => setFailed(true)} />
      ) : null}
      {showInitials ? (
        <AvatarFallbackText className={fallbackClassName}>{getInitials(name ?? undefined)}</AvatarFallbackText>
      ) : null}
    </Avatar>
  )
}
