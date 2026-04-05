import * as XLSX from 'xlsx';
import type { PendingCredential } from '@/stores/pending-credentials';

export function exportCredentialsToExcel(credentials: PendingCredential[]) {
  const rows = credentials.map((c) => ({
    Name: c.name,
    Email: c.email,
    'Temporary Password': c.password,
    'Created At': c.createdAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 30 },
    { wch: 30 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'New User Credentials');
  XLSX.writeFile(workbook, `new-user-credentials-${Date.now()}.xlsx`);
}
