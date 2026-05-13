import type { ReactNode } from 'react'

interface Column<T> {
  header: string
  accessor: (row: T) => ReactNode
  align?: 'left' | 'right'
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  keyFn: (row: T) => string
  emptyMessage?: string
}

export default function DataTable<T>({ columns, rows, keyFn, emptyMessage = 'No data.' }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                className={`text-[11px] font-semibold uppercase text-[#41454d] border-b border-[#e8e8e8] py-2 px-4 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-[13px] text-[#41454d] px-4 py-4">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={keyFn(row)}>
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={`text-[13px] text-[#333840] py-[11px] px-4 ${i < rows.length - 1 ? 'border-b border-[#e8e8e8]' : ''} ${col.align === 'right' ? 'text-right font-medium' : ''} ${col.className ?? ''}`}
                  >
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
