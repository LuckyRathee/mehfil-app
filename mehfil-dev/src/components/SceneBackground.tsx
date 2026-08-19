interface SceneBackgroundProps {
  backgroundColor: string
  backgroundImage?: string
  backgroundVideo?: string
  children?: React.ReactNode
}

export default function SceneBackground({
  backgroundColor,
  backgroundImage,
  backgroundVideo,
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

      {/* Background Video Layer */}
      {backgroundVideo && (
        <video
          key={backgroundVideo}
          className="scene__video"
          src={backgroundVideo}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden
        />
      )}

      {children}
    </main>
  )
}
