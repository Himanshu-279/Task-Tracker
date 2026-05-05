import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate, isOverdue } from '../utils/helpers'
import TaskModal from '../components/tasks/TaskModal'

export default function MyTasks() {
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  // Fetch all projects user belongs to, then their tasks
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data.data.projects)
  })

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks', user._id, projects.map(p => p._id).join(',')],
    queryFn: async () => {
      if (!projects.length) return []
      const results = await Promise.all(
        projects.map(p =>
          api.get(`/projects/${p._id}/tasks?assignee=${user._id}`).then(r =>
            r.data.data.tasks.map(t => ({ ...t, projectName: p.name, projectColor: p.color, project: p._id }))
          ).catch(() => [])
        )
      )
      return results.flat()
    },
    enabled: projects.length > 0
  })

  const filtered = statusFilter ? allTasks.filter(t => t.status === statusFilter) : allTasks
  const overdueTasks = filtered.filter(t => isOverdue(t.dueDate, t.status))
  const activeTasks = filtered.filter(t => t.status !== 'done' && !isOverdue(t.dueDate, t.status))
  const doneTasks = filtered.filter(t => t.status === 'done')

  const TaskRow = ({ task }) => {
    const overdue = isOverdue(task.dueDate, task.status)
    return (
      <div onClick={() => setSelected(task)}
        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30 cursor-pointer rounded-lg transition-colors">
        <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_CONFIG[task.status]?.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-200 truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500"
              style={{ color: task.projectColor }}>{task.projectName}</span>
          </div>
        </div>
        <span className={`badge ${PRIORITY_CONFIG[task.priority]?.color}`}>{PRIORITY_CONFIG[task.priority]?.label}</span>
        {task.dueDate && (
          <span className={`text-xs shrink-0 ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
            {overdue ? '⚠ ' : ''}{formatDate(task.dueDate)}
          </span>
        )}
      </div>
    )
  }

  const Section = ({ title, tasks, empty }) => (
    <div className="card">
      <div className="px-4 py-3 border-b border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-300">{title} <span className="text-slate-500">({tasks.length})</span></h2>
      </div>
      {tasks.length ? tasks.map(t => <TaskRow key={t._id} task={t} />) : (
        <p className="px-4 py-6 text-sm text-slate-600 text-center">{empty}</p>
      )}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">{allTasks.length} tasks assigned to you</p>
        </div>
        <select className="bg-slate-800 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-1.5"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-32 items-center">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {overdueTasks.length > 0 && <Section title="⚠ Overdue" tasks={overdueTasks} empty="" />}
          <Section title="Active" tasks={activeTasks} empty="No active tasks" />
          <Section title="Completed" tasks={doneTasks} empty="No completed tasks yet" />
        </div>
      )}

      {selected && (
        <TaskModal
          projectId={selected.project}
          task={selected}
          members={[]}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
