import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { STATUS_CONFIG, PRIORITY_CONFIG, formatRelative, formatDate, isOverdue } from '../utils/helpers'

const StatCard = ({ label, value, icon, accent = 'indigo' }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value ?? '—'}</p>
      </div>
      <span className="text-2xl">{icon}</span>
    </div>
  </div>
)

export default function Dashboard() {
  const { user, isAdmin } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data.data.stats)
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  )

  const s = data || {}

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} {user?.avatar}
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's what's happening in your workspace.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={s.totalProjects} icon="◈" />
        <StatCard label="Total Tasks" value={s.totalTasks} icon="✓" />
        <StatCard label="My Tasks" value={s.myTasks} icon="☑" />
        <StatCard label="Overdue" value={s.overdueTasks} icon="⚠" />
      </div>

      {/* Progress + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Completion */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-400 mb-4">Overall Completion</h2>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold text-white">{s.completionRate}%</span>
            <span className="text-slate-400 text-sm mb-1">of tasks done</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all"
              style={{ width: `${s.completionRate}%` }}
            />
          </div>
        </div>

        {/* Status breakdown */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-400 mb-4">Tasks by Status</h2>
          <div className="space-y-3">
            {Object.entries(s.tasksByStatus || {}).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status]
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="text-sm text-slate-300">{cfg.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-400 mb-4">Recent Tasks</h2>
          {s.recentTasks?.length ? (
            <div className="space-y-3">
              {s.recentTasks.map(task => (
                <div key={task._id} className="flex items-start gap-3">
                  <span className={`badge mt-0.5 ${STATUS_CONFIG[task.status]?.color}`}>
                    {STATUS_CONFIG[task.status]?.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.project?.name} · {formatRelative(task.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-500 text-sm">No recent tasks</p>}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-400 mb-4">Due This Week</h2>
          {s.upcomingTasks?.length ? (
            <div className="space-y-3">
              {s.upcomingTasks.map(task => (
                <div key={task._id} className="flex items-start gap-3">
                  <span className={`badge mt-0.5 ${PRIORITY_CONFIG[task.priority]?.color}`}>
                    {PRIORITY_CONFIG[task.priority]?.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.project?.name} · Due {formatDate(task.dueDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-500 text-sm">Nothing due this week 🎉</p>}
        </div>
      </div>

      {isAdmin && s.totalUsers !== undefined && (
        <div className="card p-4 flex items-center gap-3">
          <span className="text-2xl">👥</span>
          <div>
            <p className="text-slate-400 text-xs">Total Users</p>
            <p className="text-xl font-bold text-white">{s.totalUsers}</p>
          </div>
        </div>
      )}
    </div>
  )
}
