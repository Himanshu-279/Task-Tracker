import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate, formatRelative, isOverdue, getErrorMessage } from '../../utils/helpers'

export default function TaskModal({ projectId, task, members, onClose }) {
  const { user, isAdmin } = useAuth()
  const qc = useQueryClient()
  const isEdit = !!task
  const [mode, setMode] = useState(isEdit ? 'view' : 'edit')
  const [comment, setComment] = useState('')

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee: task?.assignee?._id || task?.assignee || '',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    tags: task?.tags?.join(', ') || ''
  })

  // Fetch fresh task data when viewing
  const { data: freshTask } = useQuery({
    queryKey: ['task', task?._id],
    queryFn: () => api.get(`/projects/${projectId}/tasks/${task._id}`).then(r => r.data.data.task),
    enabled: !!task?._id,
    initialData: task
  })
  const displayTask = freshTask || task

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit
      ? api.put(`/projects/${projectId}/tasks/${task._id}`, data)
      : api.post(`/projects/${projectId}/tasks`, data),
    onSuccess: () => {
      toast.success(isEdit ? 'Task updated' : 'Task created!')
      qc.invalidateQueries(['tasks', projectId])
      qc.invalidateQueries(['task', task?._id])
      qc.invalidateQueries(['dashboard'])
      if (isEdit) setMode('view'); else onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err))
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${projectId}/tasks/${task._id}`),
    onSuccess: () => { toast.success('Task deleted'); qc.invalidateQueries(['tasks', projectId]); onClose() },
    onError: (err) => toast.error(getErrorMessage(err))
  })

  const commentMutation = useMutation({
    mutationFn: (text) => api.post(`/projects/${projectId}/tasks/${task._id}/comments`, { text }),
    onSuccess: () => { setComment(''); qc.invalidateQueries(['task', task._id]) },
    onError: (err) => toast.error(getErrorMessage(err))
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/projects/${projectId}/tasks/${task._id}/comments/${commentId}`),
    onSuccess: () => qc.invalidateQueries(['task', task._id]),
    onError: (err) => toast.error(getErrorMessage(err))
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate({
      ...form,
      assignee: form.assignee || null,
      dueDate: form.dueDate || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    })
  }

  const overdue = isOverdue(displayTask?.dueDate, displayTask?.status)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50 shrink-0">
          <h2 className="font-bold text-white">{isEdit ? (mode === 'view' ? 'Task Details' : 'Edit Task') : 'New Task'}</h2>
          <div className="flex items-center gap-2">
            {isEdit && mode === 'view' && (
              <>
                <button onClick={() => setMode('edit')} className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>
                <button onClick={() => { if (confirm('Delete this task?')) deleteMutation.mutate() }}
                  className="text-xs text-red-400 hover:text-red-300">Delete</button>
              </>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white ml-2">✕</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {mode === 'view' && displayTask ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">{displayTask.title}</h3>
              {displayTask.description && <p className="text-slate-400 text-sm">{displayTask.description}</p>}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500 text-xs mb-1">Status</p>
                  <span className={`badge ${STATUS_CONFIG[displayTask.status]?.color}`}>{STATUS_CONFIG[displayTask.status]?.label}</span></div>
                <div><p className="text-slate-500 text-xs mb-1">Priority</p>
                  <span className={`badge ${PRIORITY_CONFIG[displayTask.priority]?.color}`}>{PRIORITY_CONFIG[displayTask.priority]?.label}</span></div>
                <div><p className="text-slate-500 text-xs mb-1">Assignee</p>
                  <p className="text-slate-300">{displayTask.assignee ? `${displayTask.assignee.avatar} ${displayTask.assignee.name}` : 'Unassigned'}</p></div>
                <div><p className="text-slate-500 text-xs mb-1">Due Date</p>
                  <p className={overdue ? 'text-red-400' : 'text-slate-300'}>{displayTask.dueDate ? formatDate(displayTask.dueDate) : '—'}</p></div>
              </div>

              {displayTask.tags?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {displayTask.tags.map(tag => (
                    <span key={tag} className="badge bg-slate-700 text-slate-300">{tag}</span>
                  ))}
                </div>
              )}

              {/* Comments */}
              <div className="border-t border-slate-700/50 pt-4">
                <p className="text-sm font-semibold text-slate-400 mb-3">Comments ({displayTask.comments?.length || 0})</p>
                <div className="space-y-3 mb-3">
                  {displayTask.comments?.map(c => (
                    <div key={c._id} className="flex gap-2">
                      <span className="text-base shrink-0">{c.author?.avatar}</span>
                      <div className="flex-1 bg-slate-900 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-300">{c.author?.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{formatRelative(c.createdAt)}</span>
                            {(c.author?._id === user._id || isAdmin) && (
                              <button onClick={() => deleteCommentMutation.mutate(c._id)} className="text-xs text-red-400 hover:text-red-300">✕</button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-300">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="input flex-1 text-sm" placeholder="Add a comment..."
                    value={comment} onChange={e => setComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && comment.trim()) { e.preventDefault(); commentMutation.mutate(comment.trim()) } }}
                  />
                  <button onClick={() => comment.trim() && commentMutation.mutate(comment.trim())}
                    className="btn-primary text-sm px-3" disabled={!comment.trim()}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input className="input" placeholder="Task title" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none h-20" placeholder="Add details..."
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Assignee</label>
                  <select className="input" value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {members?.map(m => (
                      <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" className="input" value={form.dueDate}
                    onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Tags <span className="text-slate-600">(comma separated)</span></label>
                <input className="input" placeholder="e.g. backend, urgent" value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
              </div>
            </form>
          )}
        </div>

        {mode !== 'view' && (
          <div className="p-5 border-t border-slate-700/50 flex gap-3 shrink-0">
            <button type="button" onClick={() => isEdit ? setMode('view') : onClose()} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" form="task-form" className="btn-primary flex-1" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
