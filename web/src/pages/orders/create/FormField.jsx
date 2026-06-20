const baseClass = 'w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-gray-50 focus:bg-white'

export default function FormField({ label, name, type = 'text', placeholder, required = true, as = 'input', form, errors, onChange }) {
  const errClass = errors[name] ? 'border-red-400 bg-red-50 focus:bg-white' : 'border-gray-200'

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
        {!required && <span className="normal-case text-gray-400 font-normal ml-1">(tuỳ chọn)</span>}
      </label>
      {as === 'textarea' ? (
        <textarea
          rows={3}
          value={form[name]}
          onChange={onChange(name)}
          placeholder={placeholder}
          className={`${baseClass} ${errClass} resize-none`}
        />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          value={form[name]}
          onChange={onChange(name)}
          placeholder={placeholder}
          className={`${baseClass} ${errClass}`}
        />
      )}
      {errors[name] && <p className="text-xs text-red-600 mt-1.5">{errors[name][0]}</p>}
    </div>
  )
}
