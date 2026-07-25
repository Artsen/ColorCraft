export interface NoticeState {
  message: string
  retry?: () => void
}

interface InlineNoticeProps {
  notice: NoticeState
  onDismiss: () => void
}

export default function InlineNotice({ notice, onDismiss }: InlineNoticeProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-600/30 bg-red-600/10 p-3 text-sm text-text-primary"
    >
      <p>{notice.message}</p>
      <div className="mt-2 flex gap-3">
        {notice.retry && (
          <button
            type="button"
            onClick={notice.retry}
            className="text-sm font-medium text-purple-400 hover:text-purple-300"
          >
            Retry
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
