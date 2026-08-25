interface SceneBackgroundProps {
  label: string
  backgroundColor: string
  backgroundImage?: string
  children?: React.ReactNode
}

export default function SceneBackground({
  label: _label,
  backgroundColor,
  backgroundImage,
  children,
}: SceneBackgroundProps) {
  return (
    <main
      className="scene"
      style={{
        backgroundColor,
      }}
    >
      {/* Background Image Layer */}
      {backgroundImage && (
        <div
          key={backgroundImage}
          className="scene__image"
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
        />
      )}

      {children}
    </main>
  )
}
