interface SceneBackgroundProps {
  label: string
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
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
      }}
    >
      {backgroundVideo ? (
        <video
          className="scene__video"
          src={backgroundVideo}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden
        />
      ) : null}
      {children}
    </main>
  )
}
