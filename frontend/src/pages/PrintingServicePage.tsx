import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Box, CheckCircle2, ChevronRight, ChevronLeft,
  Loader2, Info, Printer, Package, CreditCard, Eye
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/axios'
import { useTranslation } from '../i18n/useTranslation'
import StlFileViewer from '../features/stl-viewer/StlFileViewer'

// react-dropzone may not be installed — provide a simple fallback
const useSimpleDropzone = (onDrop: (files: File[]) => void) => {
  return {
    getRootProps: () => ({
      onClick: () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.stl,.obj,.fbx,.gltf,.glb'
        input.onchange = (e) => {
          const f = (e.target as HTMLInputElement).files
          if (f?.length) onDrop(Array.from(f))
        }
        input.click()
      },
    }),
    getInputProps: () => ({}),
    isDragActive: false,
  }
}

const MATERIALS = [
  { id: 'PLA',   name: 'PLA',   descKey: 'mat.pla.desc',   price: 150, icon: '🌿', propKeys: ['mat.prop.easyPrint', 'mat.prop.richColor', 'mat.prop.cheap'] },
  { id: 'PETG',  name: 'PETG',  descKey: 'mat.petg.desc',  price: 200, icon: '💎', propKeys: ['mat.prop.durable', 'mat.prop.heat', 'mat.prop.clear'] },
  { id: 'ABS',   name: 'ABS',   descKey: 'mat.abs.desc',   price: 180, icon: '⚙️', propKeys: ['mat.prop.hard', 'mat.prop.impact', 'mat.prop.technical'] },
  { id: 'TPU',   name: 'TPU',   descKey: 'mat.tpu.desc',   price: 250, icon: '🔋', propKeys: ['mat.prop.flexible', 'mat.prop.wear', 'mat.prop.special'] },
  { id: 'RESIN', name: 'Resin', descKey: 'mat.resin.desc', price: 350, icon: '✨', propKeys: ['mat.prop.detail', 'mat.prop.smooth', 'mat.prop.sla'] },
]

const COLORS = [
  { id: 'white',  hex: '#F8FAFC', nameKey: 'color.white' },
  { id: 'black',  hex: '#0F172A', nameKey: 'color.black' },
  { id: 'gray',   hex: '#94A3B8', nameKey: 'color.gray' },
  { id: 'red',    hex: '#EF4444', nameKey: 'color.red' },
  { id: 'blue',   hex: '#3B82F6', nameKey: 'color.blue' },
  { id: 'green',  hex: '#22C55E', nameKey: 'color.green' },
  { id: 'yellow', hex: '#EAB308', nameKey: 'color.yellow' },
  { id: 'orange', hex: '#F97316', nameKey: 'color.orange' },
  { id: 'purple', hex: '#8B5CF6', nameKey: 'color.purple' },
]

const INFILLS = [
  { value: 15,  label: '15%', descKey: 'infill.15' },
  { value: 30,  label: '30%', descKey: 'infill.30' },
  { value: 50,  label: '50%', descKey: 'infill.50' },
  { value: 80,  label: '80%', descKey: 'infill.80' },
  { value: 100, label: '100%', descKey: 'infill.100' },
]

const LAYER_HEIGHTS = [
  { value: 0.1, label: '0.1mm', descKey: 'layer.fine' },
  { value: 0.2, label: '0.2mm', descKey: 'layer.standard' },
  { value: 0.3, label: '0.3mm', descKey: 'layer.fast' },
]

const STEPS = [
  { id: 1, key: 'ps.step.upload', icon: Upload },
  { id: 2, key: 'ps.step.config', icon: Box },
  { id: 3, key: 'ps.step.confirm', icon: CheckCircle2 },
  { id: 4, key: 'ps.step.view', icon: Eye },
]

export default function PrintingServicePage() {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [material, setMaterial] = useState('PLA')
  const [color, setColor] = useState('white')
  const [infill, setInfill] = useState(30)
  const [layerHeight, setLayerHeight] = useState(0.2)
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) setFile(acceptedFiles[0])
  }, [])

  const dropzone = useSimpleDropzone(onDrop)

  const selectedMat = MATERIALS.find(m => m.id === material)!
  const selectedColor = COLORS.find(c => c.id === color)!

  // Simple estimate: weight ≈ file size / 10000 grams, price = weight * material price
  const estimatedWeight = file ? Math.max(20, Math.round(file.size / 8000)) : 0
  const materialCost = estimatedWeight * (selectedMat?.price ?? 150) / 1000
  const serviceFee = 50000
  const total = Math.round((materialCost + serviceFee) * qty)

  const formatPrice = (p: number) =>
    p.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

  const handleSubmit = async () => {
    if (!file) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('material', material)
      fd.append('color', t(selectedColor.nameKey))
      fd.append('infillDensity', String(infill))
      fd.append('layerHeight', String(layerHeight))
      fd.append('quantity', String(qty))
      fd.append('notes', notes)
      await apiClient.post('/printing-requests', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate('/account?tab=printing')
    } catch {
      // still navigate to account
      navigate('/account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-6 pb-16">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            {t('ps.label')}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {t('ps.title')}
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {t('ps.subtitle')}
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-10 flex items-center justify-center gap-0">
          {STEPS.map((s, i) => {
            const done = step > s.id
            const active = step === s.id
            const Icon = s.icon
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    done ? 'border-brand-600 bg-brand-600 text-white'
                    : active ? 'border-brand-600 bg-white text-brand-600 dark:bg-slate-900'
                    : 'border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <p className={`mt-1.5 text-xs font-medium ${
                    active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'
                  }`}>{t(s.key)}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mb-5 mx-3 h-0.5 w-16 transition-all duration-500 ${
                    step > s.id ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* ── Step 1: Upload ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="card p-6"
                >
                  <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">
                    {t('ps.uploadTitle')}
                  </h2>

                  <div
                    {...dropzone.getRootProps()}
                    className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 ${
                      file
                        ? 'border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20'
                        : 'border-slate-200 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-brand-500'
                    }`}
                  >
                    {file ? (
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/40">
                          <Box size={28} className="text-brand-600" />
                        </div>
                        <p className="font-semibold text-brand-700 dark:text-brand-300">{file.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFile(null) }}
                          className="mt-3 text-xs text-red-500 hover:text-red-700"
                        >
                          {t('ps.removeFile')}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center px-6">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
                          <Upload size={28} className="text-slate-400" />
                        </div>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">
                          {t('ps.dropHint')}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {t('ps.formats')}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs text-brand-600 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                          <Info size={11} /> {t('ps.autoAnalyze')}
                        </div>
                      </div>
                    )}
                  </div>

                  {file && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                    >
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t('ps.fileInfo')}
                      </p>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            ~{estimatedWeight}g
                          </p>
                          <p className="text-xs text-slate-400">{t('ps.estWeight')}</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            {(file.size / 1024).toFixed(0)} KB
                          </p>
                          <p className="text-xs text-slate-400">{t('ps.fileSize')}</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                            {file.name.split('.').pop()?.toUpperCase()}
                          </p>
                          <p className="text-xs text-slate-400">{t('ps.format')}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      disabled={!file}
                      onClick={() => setStep(2)}
                      className="btn-primary gap-2 disabled:opacity-40"
                    >
                      {t('ps.next')} <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Configure ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Material */}
                  <div className="card p-6">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {t('ps.selectMaterial')}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {MATERIALS.map(mat => (
                        <button
                          key={mat.id}
                          type="button"
                          onClick={() => setMaterial(mat.id)}
                          className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                            material === mat.id
                              ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/30'
                              : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                          }`}
                        >
                          <span className="text-2xl">{mat.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{mat.name}</p>
                              <p className="text-xs font-bold text-brand-600">{mat.price}đ/g</p>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{t(mat.descKey)}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {mat.propKeys.map(pk => (
                                <span key={pk} className="badge badge-slate text-[10px] py-0">{t(pk)}</span>
                              ))}
                            </div>
                          </div>
                          {material === mat.id && (
                            <CheckCircle2 size={16} className="shrink-0 text-brand-600 mt-0.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div className="card p-6">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {t('ps.selectColor')}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {COLORS.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setColor(c.id)}
                          title={t(c.nameKey)}
                          className={`flex flex-col items-center gap-1 transition`}
                        >
                          <div
                            className={`h-9 w-9 rounded-xl border-2 shadow-sm transition ${
                              color === c.id ? 'border-brand-600 scale-110' : 'border-slate-200 dark:border-slate-600'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-[10px] text-slate-400">{t(c.nameKey)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Technical settings */}
                  <div className="card p-6">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {t('ps.techSpecs')}
                    </h3>
                    <div className="space-y-5">
                      {/* Infill */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('ps.infill')}</label>
                          <span className="badge badge-blue">{infill}%</span>
                        </div>
                        <div className="flex gap-2">
                          {INFILLS.map(inf => (
                            <button
                              key={inf.value}
                              type="button"
                              onClick={() => setInfill(inf.value)}
                              className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
                                infill === inf.value
                                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              <span className="block">{inf.label}</span>
                              <span className="block text-[10px] font-normal opacity-60">{t(inf.descKey)}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Layer height */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('ps.layerHeight')}</label>
                          <span className="badge badge-blue">{layerHeight}mm</span>
                        </div>
                        <div className="flex gap-2">
                          {LAYER_HEIGHTS.map(lh => (
                            <button
                              key={lh.value}
                              type="button"
                              onClick={() => setLayerHeight(lh.value)}
                              className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
                                layerHeight === lh.value
                                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              <span className="block">{lh.label}</span>
                              <span className="block text-[10px] font-normal opacity-60">{t(lh.descKey)}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('ps.quantity')}</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setQty(q => Math.max(1, q - 1))}
                            className="btn-secondary h-10 w-10 items-center justify-center p-0 flex"
                          >
                            −
                          </button>
                          <span className="w-12 text-center text-lg font-bold text-slate-900 dark:text-white">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(q => Math.min(50, q + 1))}
                            className="btn-secondary h-10 w-10 items-center justify-center p-0 flex"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('ps.notesLabel')}</label>
                        <textarea
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          rows={3}
                          placeholder={t('ps.notesPlaceholder')}
                          className="input resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary gap-2">
                      <ChevronLeft size={16} /> {t('ps.back')}
                    </button>
                    <button type="button" onClick={() => setStep(3)} className="btn-primary gap-2">
                      {t('ps.viewQuote')} <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Confirm ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="card p-6"
                >
                  <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">
                    {t('ps.confirmTitle')}
                  </h2>

                  <div className="space-y-4">
                    {/* File */}
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3.5 dark:border-slate-700">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/40">
                        <Box size={20} className="text-brand-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{file?.name}</p>
                        <p className="text-xs text-slate-400">{(file!.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>

                    {/* Config summary */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {[
                        [t('ps.material'), `${selectedMat.name} (${selectedMat.price}đ/g)`],
                        [t('ps.color'), t(selectedColor.nameKey)],
                        [t('ps.infill'), `${infill}%`],
                        [t('ps.layerHeight'), `${layerHeight}mm`],
                        [t('ps.quantity'), `${qty} ${t('ps.qtyUnit')}`],
                        ...(notes ? [[t('ps.notesLabel'), notes]] : []),
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-800">
                          <span className="text-sm text-slate-500">{k}</span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{v}</span>
                        </div>
                      ))}
                    </div>

                    {notes && (
                      <p className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300">
                        {t('ps.quoteNote')}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button type="button" onClick={() => setStep(2)} className="btn-secondary gap-2">
                      <ChevronLeft size={16} /> {t('ps.back')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="btn-primary gap-2"
                    >
                      <Eye size={16} /> {t('ps.viewModel')} <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 4: View 3D ── */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="card p-6"
                >
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('ps.view3dTitle')}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('ps.view3dHint')}</p>
                  </div>

                  {/* 3D Viewer */}
                  <div className="h-[420px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                    {file && <StlFileViewer file={file} />}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button type="button" onClick={() => setStep(3)} className="btn-secondary gap-2">
                      <ChevronLeft size={16} /> {t('ps.back')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="btn-primary gap-2"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                      {submitting ? t('ps.submitting') : t('ps.submit')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quote sidebar */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-24 card p-5 space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard size={17} className="text-brand-600" /> {t('ps.quickQuote')}
              </h3>

              {file ? (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('ps.materialCost')} ({estimatedWeight}g)</span>
                      <span className="font-medium">{formatPrice(materialCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('ps.serviceFee')}</span>
                      <span className="font-medium">{formatPrice(serviceFee)}</span>
                    </div>
                    {qty > 1 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">× {qty} {t('ps.qtyUnit')}</span>
                        <span className="font-medium">×{qty}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">{t('ps.estTotal')}</span>
                      <span className="text-xl font-extrabold text-brand-600">{formatPrice(total)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{t('ps.finalNote')}</p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Package size={12} className="text-brand-500" />
                      {t('ps.delivery')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Printer size={12} className="text-brand-500" />
                      {t('ps.equipment')}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-4 text-center">
                  <Upload size={28} className="mb-2 text-slate-300" />
                  <p className="text-sm text-slate-400">{t('ps.uploadToQuote')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
