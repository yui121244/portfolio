export default function LoadingSequence({ exiting, progress, visible }) {
  if (!visible) return null

  const percentage = Math.min(Math.max(progress, 0), 1) * 100

  return (
    <div className="loader" data-exiting={exiting}>
      <span
        aria-label="Loading WebGL scene"
        aria-valuemax="100"
        aria-valuemin="0"
        aria-valuenow={Math.round(percentage)}
        className="loader__track"
        role="progressbar"
      >
        <span
          className="loader__progress"
          style={{ width: `${percentage}%` }}
        />
      </span>
    </div>
  )
}
