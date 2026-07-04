import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import apiClient from '../api/axios'
import useAuthStore from '../store/authStore'
import { useToast } from '../hooks/useToast'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginResponse {
  data: {
    user: { id: number; email: string; fullName: string; role: string; profileImageUrl?: string }
    accessToken: string
    refreshToken: string
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore(s => s.setSession)
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const res = await apiClient.post<LoginResponse>('/auth/login', data)
      const { user, accessToken, refreshToken } = res.data.data
      setSession(user, accessToken, refreshToken)
      showToast('Đăng nhập thành công!')
      // Admin lands straight on the control panel; everyone else on the homepage
      navigate(user.role === 'ADMIN' ? '/admin' : '/')
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Đăng nhập thất bại'
      showToast(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Chào Mừng Trở Lại</h1>
      <p className="mb-7 text-sm text-slate-400">Đăng nhập để tiếp tục với Print Hub 3D</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Email
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              {...register('email')}
              type="email"
              placeholder="name@email.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Mật Khẩu
            </label>
            <a href="#" className="text-xs text-brand-400 hover:text-brand-300">Quên mật khẩu?</a>
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              {...register('password')}
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <><Loader2 size={16} className="animate-spin" /> Đang đăng nhập…</> : 'Đăng Nhập'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 border-t border-slate-700" />
        <span className="text-xs text-slate-500">hoặc</span>
        <div className="flex-1 border-t border-slate-700" />
      </div>

      <button
        type="button"
        className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 flex items-center justify-center gap-2"
      >
        <img src="https://www.google.com/favicon.ico" alt="" className="h-4 w-4" />
        Tiếp tục với Google
      </button>

      <p className="mt-6 text-center text-sm text-slate-400">
        Chưa có tài khoản?{' '}
        <Link to="/auth/register" className="font-semibold text-brand-400 hover:text-brand-300">
          Đăng Ký Ngay
        </Link>
      </p>
    </div>
  )
}
