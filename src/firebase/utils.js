export function timeAgo(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now  = Date.now()
  const diff = now - date.getTime()

  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  const weeks = Math.floor(diff / 604800000)

  if (mins < 1)    return 'just now'
  if (mins < 60)   return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days < 7)    return `${days}d ago`
  return `${weeks}w ago`
}
