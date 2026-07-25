import Button from './ui/Button'
import Notice, { type NoticeVariant } from './ui/Notice'

export interface NoticeState {
  message: string
  variant?: NoticeVariant
  retry?: () => void
}

interface InlineNoticeProps {
  notice: NoticeState
  onDismiss: () => void
}

export default function InlineNotice({ notice, onDismiss }: InlineNoticeProps) {
  return (
    <Notice variant={notice.variant ?? 'error'}>
      <p>{notice.message}</p>
      <div className="notice-actions">
        {notice.retry && (
          <Button variant="quiet" onClick={notice.retry}>
            Retry
          </Button>
        )}
        <Button variant="quiet" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </Notice>
  )
}
