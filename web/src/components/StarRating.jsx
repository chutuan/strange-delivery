import { Star } from 'lucide-react'
import { useState } from 'react'

export function StarDisplay({ score, size = 16 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        />
      ))}
    </span>
  )
}

export function StarPicker({ value, onChange, size = 28 }) {
  const [hover, setHover] = useState(0)

  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
        >
          <Star
            size={size}
            className={i <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </span>
  )
}
