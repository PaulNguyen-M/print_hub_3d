import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import apiClient from '../api/axios'
import useAuthStore from '../store/authStore'
import { useToast } from '../hooks/useToast'

const registerSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, 'Họ tên ít nhất 2 ký tự')
    .max(50, 'Họ tên tối đa 50 ký tự'),
  email: z.string()
    .trim()
    .min(1, 'Email là bắt buộc')
    .email('Email không hợp lệ'),
  password: z.string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .max(72, 'Mật khẩu tối đa 72 ký tự')
    .regex(/[A-Za-z]/, 'Mật khẩu cần có ít nhất 1 chữ cái')
    .regex(/[0-9]/, 'Mật khẩu cần có ít nhất 1 chữ số'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterResponse {
  data: {
    user: { id: number; email: string; fullName: string; role: string; profileImageUrl?: string }
    accessToken: string
    refreshToken: string
  }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore(s => s.setSession)
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    // Hiện lỗi ngay khi người dùng rời ô (blur) và tiếp tục cập nhật khi gõ,
    // thay vì chỉ báo lúc bấm "Đăng Ký" (mặc định onSubmit).
    mode: 'onTouched',
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...payload } = data
      const res = await apiClient.post<RegisterResponse>('/auth/register', payload)
      const { user, accessToken, refreshToken } = res.data.data
      setSession(user, accessToken, refreshToken)
      showToast('Đăng ký thành công!')
      navigate('/')
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Đăng ký thất bại'
      showToast(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const field = (label: string, key: keyof RegisterFormData, type: string, placeholder: string, Icon: typeof User) => (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</label>
      <div className="relative">
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          {...register(key)}
          type={type === 'password' ? (showPw ? 'text' : 'password') : type}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        {type === 'password' && (
          <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {errors[key] && <p className="mt-1 text-xs text-red-400">{errors[key]?.message}</p>}
    </div>
  )

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Tạo Tài Khoản</h1>
      <p className="mb-7 text-sm text-slate-400">Tham gia cộng đồng Print Hub 3D ngay hôm nay</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {field('Họ Và Tên', 'fullName', 'text', 'Nguyễn Văn A', User)}
        {field('Email', 'email', 'email', 'name@email.com', Mail)}
        {field('Mật Khẩu', 'password', 'password', '••••••••', Lock)}
        {field('Xác Nhận Mật Khẩu', 'confirmPassword', 'password', '••••••••', Lock)}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? <><Loader2 size={16} className="animate-spin" /> Đang tạo…</> : 'Đăng Ký'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Đã có tài khoản?{' '}
        <Link to="/auth/login" className="font-semibold text-brand-400 hover:text-brand-300">
          Đăng Nhập
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-slate-500">
        Bằng cách đăng ký, bạn đồng ý với{' '}
        <a href="#" className="text-slate-400 hover:text-slate-300">Điều khoản sử dụng</a>
        {' '}và{' '}
        <a href="#" className="text-slate-400 hover:text-slate-300">Chính sách bảo mật</a>
      </p>
    </div>
  )
}
