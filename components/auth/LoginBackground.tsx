'use client'

export function LoginBackground() {
  return (
    <div
      className="absolute inset-0 w-full h-full"
      style={{
        backgroundImage: 'url(/images/bg-login.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
}
