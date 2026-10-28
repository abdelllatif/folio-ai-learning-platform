import { useOutletContext } from 'react-router-dom'
import { ChatPanel } from '@/components/chat/ChatPanel'

export function DocAssistant() {
  const { doc } = useOutletContext()
  return <ChatPanel document={doc} />
}
