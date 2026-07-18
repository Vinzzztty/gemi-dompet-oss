'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useCategory } from '@/hooks/useCategory';
import { useWallet } from '@/hooks/useWallet';
import { useIncome } from '@/features/income/hooks/useIncome';
import { useExpense } from '@/features/expense/hooks/useExpense';
import * as XLSX from 'xlsx';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

interface CSVRow {
  Tanggal: string | number;
  Deskripsi: string;
  Total: string | number;
  Kategori: string;
  Pembayaran: string;
}

interface ParsedTransaction {
  tanggal: string;
  nama: string;
  nominal: number;
  kategori: string;
  pembayaran: string;
}

export const ImportCSVModal: React.FC<ImportCSVModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<ParsedTransaction[]>([]);
  const [categoryMapping, setCategoryMapping] = useState<Record<string, string>>({});
  const [walletMapping, setWalletMapping] = useState<Record<string, string>>({});

  const { categories, fetchCategories, createCategory } = useCategory();
  const { wallets, fetchWallets, createWallet } = useWallet();
  const { create: createIncome } = useIncome();
  const { create: createExpense } = useExpense();

  // Fetch categories and wallets when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchWallets();
    }
  }, [isOpen, fetchCategories, fetchWallets]);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(';').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(';').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row as CSVRow;
    });
  };

  const parseXLSX = (arrayBuffer: ArrayBuffer): CSVRow[] => {
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get data as JSON with first row as headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false, // Keep formatting
      defval: '' // Default value for empty cells
    });
    
    if (jsonData.length === 0) return [];
    
    // Map to CSVRow format
    return jsonData.map((row: any) => {
      return {
        Tanggal: row['Tanggal'] || row['tanggal'] || '',
        Deskripsi: row['Deskripsi'] || row['deskripsi'] || '',
        Total: row['Total'] || row['total'] || '',
        Kategori: row['Kategori'] || row['kategori'] || '',
        Pembayaran: row['Pembayaran'] || row['pembayaran'] || '',
      } as CSVRow;
    }).filter(row => row.Tanggal && row.Deskripsi); // Filter valid rows
  };

  const parseRupiah = (rupiahString: string | number): number => {
    if (typeof rupiahString === 'number') {
      return rupiahString;
    }
    
    if (!rupiahString) return 0;
    
    const cleanString = String(rupiahString).replace(/[Rp.,\s]/g, '');
    const parsed = parseInt(cleanString);
    return isNaN(parsed) ? 0 : parsed;
  };

  const parseDate = (dateString: string | number): string => {
    if (!dateString) {
      return new Date().toISOString().split('T')[0];
    }

    const dateStr = String(dateString).trim();

    // Check if it's a number string (Excel serial date)
    const numValue = parseFloat(dateStr);
    if (!isNaN(numValue) && numValue > 1000) {
      // Excel serial date starts from 1899-12-30
      // Excel for Windows: 1900-01-01 is day 1
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + numValue * 86400000);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Handle M/D/YYYY format
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [month, day, year] = parts;
        if (month && day && year) {
          const yyyy = year.length === 2 ? `20${year}` : year;
          return `${yyyy}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }

    // Handle YYYY-MM-DD format (already formatted)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }

    // Handle DD-MM-YYYY or DD/MM/YYYY format
    if (dateStr.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
      const separator = dateStr.includes('/') ? '/' : '-';
      const [day, month, year] = dateStr.split(separator);
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try to parse as Date object
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
    }

    // Fallback to current date
    return new Date().toISOString().split('T')[0];
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const isCSV = selectedFile.name.endsWith('.csv');
    const isXLSX = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');

    if (!isCSV && !isXLSX) {
      toast.error('File harus berformat CSV atau XLSX');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        let rows: CSVRow[];
        
        if (isCSV) {
          // Parse CSV
          const text = e.target?.result as string;
          rows = parseCSV(text);
        } else {
          // Parse XLSX
          const arrayBuffer = e.target?.result as ArrayBuffer;
          rows = parseXLSX(arrayBuffer);
        }
        
        if (rows.length === 0) {
          toast.error('File tidak memiliki data yang valid');
          return;
        }

        // Parse transactions
        const parsed: ParsedTransaction[] = rows
          .filter(row => row.Tanggal && row.Deskripsi) // Filter valid rows
          .map(row => ({
            tanggal: parseDate(row.Tanggal),
            nama: String(row.Deskripsi || ''),
            nominal: parseRupiah(row.Total),
            kategori: String(row.Kategori || ''),
            pembayaran: String(row.Pembayaran || ''),
          }));

        setPreview(parsed.slice(0, 5)); // Show first 5 for preview

        // Extract unique categories and wallets
        const uniqueCategories = [...new Set(rows.map(r => r.Kategori).filter(Boolean))];
        const uniqueWallets = [...new Set(rows.map(r => r.Pembayaran).filter(Boolean))];

        // Auto-map categories
        const catMap: Record<string, string> = {};
        uniqueCategories.forEach(cat => {
          const existing = categories.find(c => 
            c.name.toLowerCase() === cat.toLowerCase()
          );
          if (existing) {
            catMap[cat] = existing.id;
          }
        });
        setCategoryMapping(catMap);

        // Auto-map wallets
        const walMap: Record<string, string> = {};
        uniqueWallets.forEach(wallet => {
          const existing = wallets.find(w => 
            w.namaDompet.toLowerCase() === wallet.toLowerCase()
          );
          if (existing) {
            walMap[wallet] = existing.id;
          }
        });
        setWalletMapping(walMap);

        toast.success(`${rows.length} transaksi siap diimport`);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Gagal membaca file. Pastikan format file sesuai');
      }
    };

    // Read file based on type
    if (isCSV) {
      reader.readAsText(selectedFile);
    } else {
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Pilih file CSV atau XLSX terlebih dahulu');
      return;
    }

    setIsProcessing(true);

    try {
      const isCSV = file.name.endsWith('.csv');
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          let rows: CSVRow[];
          
          if (isCSV) {
            const text = e.target?.result as string;
            rows = parseCSV(text);
          } else {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            rows = parseXLSX(arrayBuffer);
          }

          let successCount = 0;
          let failCount = 0;

          for (const row of rows) {
            try {
              // Skip rows with missing critical data
              if (!row.Deskripsi || !row.Total || !row.Kategori) {
                console.log('Skipping row with missing data:', row);
                failCount++;
                continue;
              }

              const nominal = parseRupiah(row.Total);
              const tanggal = parseDate(row.Tanggal);
              
              // Get or create category
              let categoryId = categoryMapping[row.Kategori];
              if (!categoryId && row.Kategori) {
                try {
                  // Check if category exists in current list first
                  const existingInList = categories.find(c => 
                    c.name.toLowerCase() === row.Kategori.toLowerCase() && 
                    c.type === 'EXPENSE'
                  );
                  
                  if (existingInList) {
                    categoryId = existingInList.id;
                    setCategoryMapping(prev => ({ ...prev, [row.Kategori]: existingInList.id }));
                  } else {
                    // Try to create new category
                    const newCat = await createCategory({
                      name: row.Kategori,
                      type: 'EXPENSE',
                      icon: 'wallet'
                    });
                    if (newCat) {
                      categoryId = newCat.id;
                      setCategoryMapping(prev => ({ ...prev, [row.Kategori]: newCat.id }));
                      // Refresh categories list
                      await fetchCategories();
                    }
                  }
                } catch (catError: any) {
                  console.error('Error creating category:', catError);
                  // If category creation fails (e.g., duplicate), try to fetch it
                  await fetchCategories();
                  const found = categories.find(c => 
                    c.name.toLowerCase() === row.Kategori.toLowerCase() && 
                    c.type === 'EXPENSE'
                  );
                  if (found) {
                    categoryId = found.id;
                    setCategoryMapping(prev => ({ ...prev, [row.Kategori]: found.id }));
                  }
                }
              }

              // Skip if still no categoryId
              if (!categoryId) {
                console.log('No categoryId for row:', row);
                failCount++;
                continue;
              }

              // Get or create wallet
              let walletId = walletMapping[row.Pembayaran];
              if (!walletId && row.Pembayaran) {
                try {
                  const newWallet = await createWallet({
                    namaDompet: row.Pembayaran,
                  });
                  if (newWallet) {
                    walletId = newWallet.id;
                    setWalletMapping(prev => ({ ...prev, [row.Pembayaran]: newWallet.id }));
                  }
                } catch (walletError: any) {
                  console.error('Error creating wallet:', walletError);
                  // Wallet is optional, so we can continue
                }
              }

              // Create expense transaction
              await createExpense({
                nama: row.Deskripsi,
                nominal,
                categoryId: categoryId!,
                walletId: walletId || undefined,
                tanggal,
                catatan: undefined,
              });

              successCount++;
            } catch (error) {
              console.error('Error importing row:', error);
              failCount++;
            }
          }

          // Success summary
          toast.success(
            `✅ Import selesai!\n` +
            `${successCount} transaksi berhasil diimport${failCount > 0 ? `, ${failCount} gagal` : ''}`,
            { duration: 4000 }
          );

          handleClose();
          onImportComplete?.();
        } catch (error) {
          console.error('Error processing CSV:', error);
          toast.error('Gagal memproses file CSV');
        } finally {
          setIsProcessing(false);
        }
      };

      // Read file based on type
      if (isCSV) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Gagal membaca file');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setCategoryMapping({});
    setWalletMapping({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={handleClose}>
        <div className="bg-white rounded-[24px] w-full max-w-xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="p-6 pb-0 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Import Data</h2>
                <p className="text-sm text-gray-500">Import transaksi dari file CSV atau Excel</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100" onClick={handleClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col gap-6 overflow-y-auto">
            {/* File Upload */}
            <div className="w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 border-gray-200 bg-gray-50 hover:border-green-500 hover:bg-green-50/30">
                <div className="mb-4 text-green-500">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <span className="text-lg font-medium text-gray-900 mb-2 text-center">
                  {file ? file.name : 'Klik untuk pilih file CSV atau Excel'}
                </span>
                <span className="text-xs text-gray-500 text-center mb-1">Format: Tanggal, Deskripsi, Total, Kategori, Pembayaran</span>
                <span className="text-[10px] text-gray-400 text-center italic">Mendukung: .csv, .xlsx, .xls</span>
              </label>
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Preview (5 transaksi pertama)</h3>
                <div className="flex flex-col gap-3">
                  {preview.map((transaction, index) => {
                    const categoryExists = categoryMapping[transaction.kategori];
                    const walletExists = walletMapping[transaction.pembayaran];
                    
                    return (
                      <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 font-medium">Tanggal:</span>
                          <span className="text-[13px] text-gray-900">{transaction.tanggal}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 font-medium">Deskripsi:</span>
                          <span className="text-[13px] text-gray-900">{transaction.nama}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 font-medium">Nominal:</span>
                          <span className="text-[13px] text-gray-900 font-medium">Rp {transaction.nominal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 font-medium">Kategori:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] text-gray-900">{transaction.kategori || '-'}</span>
                            {transaction.kategori && !categoryExists && (
                              <span className="px-1.5 py-0.5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[10px] font-bold rounded uppercase tracking-wider">Baru</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 font-medium">Dompet:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] text-gray-900">{transaction.pembayaran || '-'}</span>
                            {transaction.pembayaran && !walletExists && (
                              <span className="px-1.5 py-0.5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[10px] font-bold rounded uppercase tracking-wider">Baru</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Info Banners */}
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg mt-4 text-xs text-blue-800 leading-relaxed">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Kategori dan dompet yang bertanda "Baru" akan otomatis dibuat untuk akun Anda</span>
                </div>
                
              </div>
            )}

            {/* Import Button */}
            {file && (
              <button
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={handleImport}
                disabled={isProcessing}
              >
                {isProcessing ? 'Memproses...' : 'Import Sekarang'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ImportCSVModal;
