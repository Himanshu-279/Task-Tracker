import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'

export const formatDate = (date) => {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy')
}

export const formatRelative = (date) => {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false
  return isPast(new Date(dueDate))
}

export const dueDateLabel = (dueDate) => {
  if (!dueDate) return null
  const d = new Date(dueDate)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'MMM d')
}

export const STATUS_CONFIG = {
  todo:        { label: 'To Do',      color: 'bg-slate-700 text-slate-300',   dot: 'bg-slate-400' },
  in_progress: { label: 'In Progress', color: 'bg-blue-900/50 text-blue-300', dot: 'bg-blue-400' },
  in_review:   { label: 'In Review',  color: 'bg-purple-900/50 text-purple-300', dot: 'bg-purple-400' },
  done:        { label: 'Done',       color: 'bg-green-900/50 text-green-300', dot: 'bg-green-400' },
}

export const PRIORITY_CONFIG = {
  low:      { label: 'Low',      color: 'bg-slate-700 text-slate-300',    icon: '▼' },
  medium:   { label: 'Medium',   color: 'bg-yellow-900/50 text-yellow-300', icon: '■' },
  high:     { label: 'High',     color: 'bg-orange-900/50 text-orange-300', icon: '▲' },
  critical: { label: 'Critical', color: 'bg-red-900/50 text-red-300',     icon: '⚡' },
}

export const PROJECT_STATUS_CONFIG = {
  active:    { label: 'Active',    color: 'bg-green-900/50 text-green-300' },
  on_hold:   { label: 'On Hold',   color: 'bg-yellow-900/50 text-yellow-300' },
  completed: { label: 'Completed', color: 'bg-blue-900/50 text-blue-300' },
  archived:  { label: 'Archived',  color: 'bg-slate-700 text-slate-400' },
}

export const getErrorMessage = (err) => {
  return err?.response?.data?.message || err?.message || 'Something went wrong'
}
