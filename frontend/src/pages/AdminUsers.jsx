import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { formatDate, getErrorMessage } from '../utils/helpers'
import { Navigate } from 'react-router-dom'

export default function AdminUsers() {
  const { isAdmin, user: me } = useAuth()
  const qc = useQueryClient()

  if (!isAdmin) return <Navigate to="/dashboard" />

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data.users)
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => api.put(`/users/${id}/role`, { role }),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries(['users']) },
    onError: (err) => toast.error(getErrorMessage(err))
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Users</h1>
        <p className="text-slate-400 text-sm mt-1">{users.length} registered users</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-700">
            <tr className="text-xs text-slate-500 uppercase tracking-wider">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Joined</th>
              <th className="text-left px-4 py-3">Last Login</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-500">Loading...</td></tr>
            ) : users.map(u => (
              <tr key={u._id} className="hover:bg-slate-700/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{u.avatar}</span>
                    <span className="text-slate-200 font-medium">{u.name}</span>
                    {u._id === me._id && <span className="text-xs text-indigo-400">(you)</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.role === 'admin' ? 'bg-indigo-900/50 text-indigo-300' : 'bg-slate-700 text-slate-400'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-slate-500">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
                <td className="px-4 py-3">
                  {u._id !== me._id && (
                    <button
                      onClick={() => roleMutation.mutate({ id: u._id, role: u.role === 'admin' ? 'member' : 'admin' })}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Make {u.role === 'admin' ? 'Member' : 'Admin'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
