interface UserAvatarProps {
  name: string | undefined
  size?: 'sm' | 'md'
}

export function UserAvatar({ name, size = 'sm' }: UserAvatarProps) {
  const initial = name?.charAt(0).toUpperCase() ?? '?'
  const sizeClasses = size === 'md' ? 'h-10 w-10 text-base' : 'h-8 w-8 text-sm'

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-primary font-bold text-primary-foreground ${sizeClasses}`}
    >
      {initial}
    </div>
  )
}
