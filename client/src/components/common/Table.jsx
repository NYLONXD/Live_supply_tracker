// client/src/components/common/Table.jsx - NEW FILE

export default function Table({ children, className = '' }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }) {
  return (
    <thead className="border-b border-brand-zinc-200 bg-brand-zinc-50">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableHeaderCell({ children, className = '' }) {
  return (
    <th className={`py-3 px-4 text-left font-bold text-xs uppercase text-brand-zinc-500 tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function TableBody({ children }) {
  return (
    <tbody className="divide-y divide-brand-zinc-100">
      {children}
    </tbody>
  );
}

export function TableRow({ children, onClick, className = '' }) {
  return (
    <tr 
      className={`hover:bg-brand-zinc-50/80 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`py-3 px-4 ${className}`}>
      {children}
    </td>
  );
}

// Quick Table Component (All-in-one)
export function QuickTable({ headers, data, onRowClick, renderRow }) {
  return (
    <Table>
      <TableHeader>
        {headers.map((header, i) => (
          <TableHeaderCell key={i}>{header}</TableHeaderCell>
        ))}
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={i} onClick={() => onRowClick?.(row)}>
            {renderRow(row)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}