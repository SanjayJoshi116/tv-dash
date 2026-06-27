import { Alert, Button } from 'antd'

interface Props {
  message: string
  description?: string
  onRetry: () => void
}

export function ErrorState({ message, description, onRetry }: Props) {
  return (
    <Alert
      type="error"
      message={message}
      description={description}
      showIcon
      action={<Button size="small" onClick={onRetry}>Retry</Button>}
    />
  )
}
