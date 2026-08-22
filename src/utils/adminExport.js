const getCellValue = (row, column, fallback = '') => (
  column.csvValue ? column.csvValue(row) : (row[column.key] ?? fallback)
);

export const exportCsv = (rows, columns, filename) => {
  const headers = columns.map((column) => column.label).join(',');
  const body = rows.map((row) => (
    columns.map((column) => `"${String(getCellValue(row, column)).replace(/"/g, '""')}"`).join(',')
  )).join('\n');
  const blob = new Blob([`${headers}\n${body}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportPdf = (rows, columns, title) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const headings = columns.map((column) => `<th>${column.label}</th>`).join('');
  const rowsMarkup = rows.map((row) => (`<tr>${columns.map((column) => (
    `<td>${String(getCellValue(row, column, '—'))}</td>`
  )).join('')}</tr>`)).join('');

  printWindow.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:28px;color:#1a2b1f}h2{margin:0 0 4px;color:#0e2a23;font-size:20px}p{margin:0 0 18px;color:#7a8c7e;font-size:12px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0e2a23;color:#c6a84b;padding:9px 11px;text-align:left}td{padding:8px 11px;border-bottom:1px solid #e8ede9}.print-button{margin-top:18px;padding:9px 20px;background:#0e2a23;color:#c6a84b;border:0;border-radius:7px;cursor:pointer}@media print{.print-button{display:none}}</style>
    </head><body><h2>${title}</h2><p>Generated: ${new Date().toLocaleString()} · ${rows.length} records</p><table><thead><tr>${headings}</tr></thead><tbody>${rowsMarkup}</tbody></table><button class="print-button" onclick="window.print()">Print / Save as PDF</button></body></html>`);
  printWindow.document.close();
};
