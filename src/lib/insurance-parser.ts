import * as XLSX from 'xlsx';
import type { InsurancePolicy } from '../types';

type ParsedPolicy = Omit<InsurancePolicy, 'id' | 'user_id' | 'created_at'>;

export interface ParseResult {
  policies: ParsedPolicy[];
  errors: string[];
}

export function parseInsuranceFile(file: ArrayBuffer, batchId: string): ParseResult {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { policies: [], errors: ['Empty workbook.'] };
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { policies: [], errors: ['Empty workbook.'] };

  // Har HaBituach exports have incorrect !ref range — recalculate from actual cells
  const cellKeys = Object.keys(sheet).filter(k => k[0] !== '!');
  if (cellKeys.length > 0) {
    let maxRow = 0;
    let maxCol = 0;
    let minRow = Infinity;
    let minCol = Infinity;
    for (const key of cellKeys) {
      const decoded = XLSX.utils.decode_cell(key);
      if (decoded.r > maxRow) maxRow = decoded.r;
      if (decoded.c > maxCol) maxCol = decoded.c;
      if (decoded.r < minRow) minRow = decoded.r;
      if (decoded.c < minCol) minCol = decoded.c;
    }
    sheet['!ref'] = XLSX.utils.encode_range({ s: { r: minRow, c: minCol }, e: { r: maxRow, c: maxCol } });
  }

  const rows: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  const errors: string[] = [];
  const policies: ParsedPolicy[] = [];

  let currentCategory = '';
  let headerFound = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(cell => !cell || String(cell).trim() === '')) continue;

    const firstCell = String(row[0] ?? '').trim();

    // Detect header row
    if (firstCell === 'תעודת זהות') {
      headerFound = true;
      continue;
    }

    // Detect section header rows: "תחום - XXX"
    const joinedRow = row.map(c => String(c ?? '').trim()).filter(Boolean).join(' ').trim();
    const categoryMatch = joinedRow.match(/תחום\s*[-–—]\s*(.+)/);
    if (categoryMatch && categoryMatch[1]) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    if (!headerFound) continue;

    // Skip summary/total rows
    if (firstCell.includes('סה"כ') || firstCell.includes('סהכ')) continue;

    // Skip rows that look like sub-headers or have no ID number
    if (!/^\d+$/.test(firstCell.replace(/\s/g, ''))) continue;

    const cells = row.map(c => String(c ?? '').trim());

    // Parse premium
    let premiumNis: number | null = null;
    const premiumRaw = cells[7] ?? '';
    if (premiumRaw) {
      const cleaned = premiumRaw.replace(/[₪,\s]/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) premiumNis = parsed;
    }

    policies.push({
      upload_batch_id: batchId,
      category: currentCategory,
      identity_number: cells[0] ?? '',
      main_branch: cells[1] ?? '',
      sub_branch: cells[2] ?? '',
      product_type: cells[3] ?? '',
      company: cells[4] ?? '',
      coverage_period: cells[5] ?? '',
      additional_details: cells[6] ?? '',
      premium_nis: premiumNis,
      premium_type: cells[8] ?? '',
      policy_number: cells[9] ?? '',
      plan_classification: cells[10] ?? '',
    });
  }

  if (policies.length === 0) {
    errors.push('No insurance data found. Make sure you uploaded the correct file from Har HaBituach.');
  }

  return { policies, errors };
}
