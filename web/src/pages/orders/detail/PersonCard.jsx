import { User, Truck } from 'lucide-react'

const config = {
  sender: { label: null,     icon: User,  bg: 'bg-blue-100',  color: 'text-blue-700' },
  driver: { label: 'Tài xế', icon: Truck, bg: 'bg-green-100', color: 'text-green-700' },
}

export default function PersonCard({ person, role }) {
  const { label, icon: Icon, bg, color } = config[role]
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
      <div className={`w-9 h-9 ${bg} rounded-full flex items-center justify-center`}>
        <Icon size={18} className={color} />
      </div>
      <div>
        {label && <p className="text-xs text-gray-400 mb-0.5">{label}</p>}
        <p className="text-sm font-semibold text-gray-800">{person.name}</p>
        {person.phone && <p className="text-xs text-gray-500">{person.phone}</p>}
      </div>
    </div>
  )
}
