interface AppMarkProps {
  size?: 'small' | 'default'
  surface?: 'auto' | 'dark' | 'light'
}

export default function AppMark({
  size = 'default',
  surface = 'auto',
}: AppMarkProps) {
  return (
    <span
      className={`app-mark ${size} ${surface === 'auto' ? '' : `app-mark-${surface}`}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" focusable="false">
        <path
          d="M30.5 10.5a15 15 0 1 0 0 27"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M38 15.5a11 11 0 1 0 0 17"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="35.5" cy="24" r="3.5" fill="var(--color-ember)" />
      </svg>
    </span>
  )
}
