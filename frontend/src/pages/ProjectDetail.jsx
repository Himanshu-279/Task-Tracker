import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate, isOverdue, getErrorMessage } from '../utils/helpers'
import TaskModal from '../components/tasks/TaskModal'
import AddMemberModal from '../components/projects/AddMemberModal'
import ProjectModal from '../components/projects/ProjectModal'

const COLUMNS = ['todo', 'in_progress', 'in_review', 'done']

export default function ProjectDetail() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [taskModal, setTaskModal] = useState(null) // null | 'create' | task object
  const [addMember, setAddMember] = useState(false)
  const [editProject, setEditProject] = useState(false)
  const [filter, setFilter] = useState({ status: '', priority: '', assignee: '' })

  const { data: project, isLoading: pLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data.data.project)
  })

  const { data: tasks = [], isLoading: tLoading } = useQuery({
    queryKey: ['tasks', id, filter],
    queryFn: () => {
      const params = new URLSearchParams()
      Object.entries(filter).forEach(([k, v]) => { if (v) params.set(k, v) })
      return api.get(`/projects/${id}/tasks?${params}`).then(r => r.data.data.tasks)
    }
  })

  const deleteProjectMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => { toast.success('Project deleted'); navigate('/projects') },
    onError: (err) => toast.error(getErrorMessage(err))
  })

  const isOwner = project?.owner?._id === user?._id
  const memberEntry = project?.members?.find(m => m.user?._id === user?._id)
  const isProjectAdmin = isOwner || memberEntry?.role === 'admin' || isAdmin

  if (pLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  )

  if (!project) return <div className="text-center text-slate-400 mt-20">Project not found</div>

  const tasksByStatus = (status) => tasks.filter(t => t.status === status)

  return (
    <div className="max-w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          </div>
          {project.description && <p className="text-slate-400 text-sm mt-1 ml-6">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isProjectAdmin && (
            <>
              <button onClick={() => setAddMember(true)} className="btn-secondary text-sm">+ Member</button>
              <button onClick={() => setEditProject(true)} className="btn-secondary text-sm">Edit</button>
              {(isOwner || isAdmin) && (
                <button onClick={() => {
                  if (confirm('Delete this project and all tasks?')) deleteProjectMutation.mutate()
                }} className="btn-danger text-sm">Delete</button>
              )}
            </>
          )}
          <button onClick={() => setTaskModal('create')} className="btn-primary text-sm">+ Task</button>
        </div>
      </div>

      {/* Members */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Team:</span>
        <div className="flex -space-x-1">
          {project.members?.map(m => (
            <div key={m.user?._id} title={`${m.user?.name} (${m.role})`}
              className="w-7 h-7 rounded-full bg-indigo-600/30 border-2 border-slate-950 flex items-center justify-center text-sm cursor-default">
              {m.user?.avatar}
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select className="bg-slate-800 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-1.5"
          value={filter.priority} onChange={e => setFilter(p => ({ ...p, priority: e.target.value }))}>
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="bg-slate-800 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-1.5"
          value={filter.assignee} onChange={e => setFilter(p => ({ ...p, assignee: e.target.value }))}>
          <option value="">All Members</option>
          {project.members?.map(m => <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>)}
        </select>
        {(filter.priority || filter.assignee) && (
          <button onClick={() => setFilter({ status: '', priority: '', assignee: '' })} className="text-xs text-slate-400 hover:text-white">✕ Clear</button>
        )}
        <span className="ml-auto text-xs text-slate-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(status => {
          const cfg = STATUS_CONFIG[status]
          const columnTasks = tasksByStatus(status)
          return (
            <div key={status} className="min-w-[260px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-sm font-semibold text-slate-300">{cfg.label}</span>
                  <span className="text-xs text-slate-500 bg-slate-800 rounded-full px-2 py-0.5">{columnTasks.length}</span>
                </div>
              </div>

              <div className="space-y-2">
                {columnTasks.map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onClick={() => setTaskModal(task)}
                    projectId={id}
                    qc={qc}
                    isProjectAdmin={isProjectAdmin}
                  />
                ))}
                {columnTasks.length === 0 && (
                  <div className="border border-dashed border-slate-700 rounded-lg p-4 text-center text-slate-600 text-xs">
                    Empty
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {taskModal && (
        <TaskModal
          projectId={id}
          members={project.members}
          task={taskModal === 'create' ? null : taskModal}
          onClose={() => setTaskModal(null)}
        />
      )}
      {addMember && <AddMemberModal projectId={id} onClose={() => setAddMember(false)} />}
      {editProject && <ProjectModal project={project} onClose={() => setEditProject(false)} />}
    </div>
  )
}

function TaskCard({ task, onClick, projectId, qc, isProjectAdmin }) {
  const overdue = isOverdue(task.dueDate, task.status)
  const pCfg = PRIORITY_CONFIG[task.priority]

  const updateStatus = useMutation({
    mutationFn: (status) => api.put(`/projects/${projectId}/tasks/${task._id}`, { status }),
    onSuccess: () => qc.invalidateQueries(['tasks', projectId]),
    onError: (err) => toast.error(getErrorMessage(err))
  })

  return (
    <div
      onClick={onClick}
      className="card p-3 cursor-pointer hover:border-slate-500 transition-all hover:shadow-lg hover:shadow-black/20 group"
    >
      <div className="flex items-start gap-2 mb-2">
        <span className={`badge mt-0.5 shrink-0 ${pCfg.color}`}>{pCfg.icon}</span>
        <p className="text-sm text-slate-200 font-medium line-clamp-2 flex-1">{task.title}</p>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-1 mb-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {task.assignee && (
            <div title={task.assignee.name}
              className="w-5 h-5 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs">
              {task.assignee.avatar}
            </div>
          )}
          {task.comments?.length > 0 && (
            <span className="text-xs text-slate-500">💬 {task.comments.length}</span>
          )}
        </div>
        {task.dueDate && (
          <span className={`text-xs ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
            {overdue ? '⚠ ' : ''}{formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  )
}
