import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { PROJECT_STATUS_CONFIG, PRIORITY_CONFIG, formatDate, getErrorMessage } from '../utils/helpers'
import ProjectModal from '../components/projects/ProjectModal'

export default function Projects() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data.data.projects)
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => { toast.success('Project deleted'); qc.invalidateQueries(['projects']) },
    onError: (err) => toast.error(getErrorMessage(err))
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">{data?.length || 0} projects</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <span>+</span> New Project
        </button>
      </div>

      {!data?.length ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">◈</p>
          <p className="text-slate-300 font-medium">No projects yet</p>
          <p className="text-slate-500 text-sm mt-1">Create your first project to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Create Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map(project => (
            <div key={project._id} className="card p-5 hover:border-slate-600 transition-colors group">
              {/* Color bar */}
              <div className="w-full h-1 rounded-full mb-4" style={{ backgroundColor: project.color || '#6366f1' }} />

              <div className="flex items-start justify-between gap-2 mb-3">
                <Link to={`/projects/${project._id}`} className="font-semibold text-white hover:text-indigo-300 transition-colors flex-1 truncate">
                  {project.name}
                </Link>
                <span className={`badge shrink-0 ${PROJECT_STATUS_CONFIG[project.status]?.color}`}>
                  {PROJECT_STATUS_CONFIG[project.status]?.label}
                </span>
              </div>

              {project.description && (
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span>✓ {project.taskCount || 0} tasks</span>
                  <span className={`badge ${PRIORITY_CONFIG[project.priority]?.color}`}>
                    {PRIORITY_CONFIG[project.priority]?.icon} {PRIORITY_CONFIG[project.priority]?.label}
                  </span>
                </div>
                {project.dueDate && <span>Due {formatDate(project.dueDate)}</span>}
              </div>

              {/* Members */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex -space-x-1">
                  {project.members?.slice(0, 4).map(m => (
                    <div key={m.user?._id} title={m.user?.name}
                      className="w-6 h-6 rounded-full bg-indigo-600/30 border border-slate-800 flex items-center justify-center text-xs">
                      {m.user?.avatar || '?'}
                    </div>
                  ))}
                  {project.members?.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-800 flex items-center justify-center text-xs text-slate-400">
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>
                <Link to={`/projects/${project._id}`} className="text-indigo-400 hover:text-indigo-300 text-xs">
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
