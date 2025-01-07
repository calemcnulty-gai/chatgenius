type UserAvatarProps = {
  name: string
  image: string | null
  className?: string
}

export function UserAvatar({ name, image, className = "h-8 w-8" }: UserAvatarProps) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`rounded-full object-cover ${className}`}
      />
    )
  }

  // Get initials from name
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={`flex items-center justify-center rounded-full bg-blue-500 text-white ${className}`}>
      <span className="text-sm font-medium">{initials}</span>
    </div>
  )
} 