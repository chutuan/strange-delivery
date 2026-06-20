export default function Pagination({ page, lastPage, onPage }) {
  if (!lastPage || lastPage <= 1) return null
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="px-4 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
      >
        Trước
      </button>
      <span className="text-sm text-gray-500 px-2">{page} / {lastPage}</span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === lastPage}
        className="px-4 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
      >
        Sau
      </button>
    </div>
  )
}
