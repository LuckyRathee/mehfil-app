interface SceneBackgroundProps {
  label: string
  backgroundColor: string
  backgroundImage?: string
  children?: React.ReactNode
}

export default function SceneBackground({
  backgroundColor,
  backgroundImage,
  children,
}: SceneBackgroundProps) {
  return (
    <main
      className="scene"
      style={{
        backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
      }}
    >
      {children}
    </main>
  )
}
