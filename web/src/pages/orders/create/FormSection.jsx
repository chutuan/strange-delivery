export default function FormSection({ icon: Icon, color, title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className={`flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 ${color}`}>
        <Icon size={16} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">
        {children}
      </div>
    </div>
  )
}
