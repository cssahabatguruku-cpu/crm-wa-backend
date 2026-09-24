import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

export default function ContactsPage({ supabaseUrl, supabaseKey, onSelectContact }) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  // States untuk Edit Kontak
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLabel, setEditLabel] = useState('General');
  const [editInstitution, setEditInstitution] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Fetch Data Kontak dari Supabase
  const fetchContacts = async () => {
    setLoading(true);
    let query = supabase.from('contacts').select('*').order('created_at', { ascending: false });

    if (selectedTag !== 'ALL') {
      query = query.eq('label', selectedTag);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching contacts:', error);
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      fetchContacts();
    }
  }, [selectedTag, supabaseUrl, supabaseKey]);

  // Sanitasi nomor HP
  const sanitizePhone = (phone) => {
    let clean = String(phone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return clean;
  };

  // 2. Unduh Template Excel
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Nama: 'Ahmad Supardi',
        'No WA': '081234567890',
        Kategori: 'Guru',
        Instansi: 'SMA 1 Kudus',
        Email: 'ahmad@example.com',
      },
      {
        Nama: 'Budi Santoso',
        'No WA': '6289876543210',
        Kategori: 'Alumni',
        Instansi: 'Universitas X',
        Email: 'budi@example.com',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Kontak');
    XLSX.writeFile(workbook, 'Template_Import_Kontak_CRM.xlsx');
  };

  // 3. Handle Import Excel / CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processAndSaveImport(results.data),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processAndSaveImport(data);
      };
      reader.readAsBinaryString(file);
    }

    e.target.value = null;
  };

  const processAndSaveImport = async (rawData) => {
    const formattedData = rawData
      .map((row) => {
        const rawPhone =
          row.Phone ||
          row.phone ||
          row['No WA'] ||
          row['no wa'] ||
          row.WhatsApp ||
          row.phone_number ||
          '';
        const cleanPhone = sanitizePhone(rawPhone);

        return {
          phone_number: cleanPhone,
          name: row.Name || row.name || row.Nama || row.nama || 'Tanpa Nama',
          label: row.Label || row.label || row.Kategori || row.kategori || 'General',
          institution: row.Institution || row.instansi || row.Instansi || row.Sekolah || '',
          email: row.Email || row.email || '',
        };
      })
      .filter((item) => item.phone_number.length >= 10);

    if (formattedData.length === 0) {
      alert('Tidak ada data kontak valid yang ditemukan pada file.');
      setIsImporting(false);
      return;
    }

    const { error } = await supabase
      .from('contacts')
      .upsert(formattedData, { onConflict: 'phone_number' });

    if (error) {
      alert('Gagal mengimpor kontak: ' + error.message);
    } else {
      alert(`Berhasil mengimpor ${formattedData.length} kontak!`);
      fetchContacts();
    }
    setIsImporting(false);
  };

  // 4. Hapus Kontak
  const handleDeleteContact = async (id, name) => {
    if (!confirm(`Hapus kontak "${name}"?`)) return;

    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus kontak: ' + error.message);
    } else {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setSelectedContactIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // 5. Buka Modal Edit Kontak
  const handleOpenEditModal = (contact) => {
    setEditingContact(contact);
    setEditName(contact.name || '');
    setEditPhone(contact.phone_number || '');
    setEditLabel(contact.label || 'General');
    setEditInstitution(contact.institution || '');
    setShowEditModal(true);
  };

  // 6. Simpan Perubahan Edit Kontak
  const handleUpdateContact = async (e) => {
    e.preventDefault();
    if (!editingContact) return;

    setIsUpdating(true);
    const cleanPhone = sanitizePhone(editPhone);

    const { error } = await supabase
      .from('contacts')
      .update({
        name: editName.trim(),
        phone_number: cleanPhone,
        label: editLabel,
        institution: editInstitution.trim(),
      })
      .eq('id', editingContact.id);

    if (error) {
      alert('Gagal mengupdate kontak: ' + error.message);
    } else {
      setShowEditModal(false);
      setEditingContact(null);
      fetchContacts();
    }
    setIsUpdating(false);
  };

  // Selection Checkbox Logic
  const toggleSelectAll = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtering Lokal
  const filteredContacts = contacts.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone_number || '').includes(searchTerm) ||
      (c.institution || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 bg-slate-50 min-h-screen overflow-y-auto">
      {/* Title Bar & Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Data Kontak</h1>
          <p className="text-slate-500 text-sm">
            Kelola seluruh database kontak pelanggan dan filter untuk broadcast
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3.5 py-2 rounded-lg font-medium text-sm transition border border-slate-300"
            title="Download Format Template Excel"
          >
            <span>📥 Template Excel</span>
          </button>

          <label className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg cursor-pointer font-medium text-sm transition shadow-sm">
            <span>{isImporting ? 'Mengimpor...' : '📂 Import Excel / CSV'}</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isImporting}
            />
          </label>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <input
          type="text"
          placeholder="Cari berdasarkan nama, nomor WA, atau instansi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">Semua Kategori</option>
          <option value="General">General</option>
          <option value="Hot Lead">Hot Lead</option>
          <option value="Guru">Guru</option>
          <option value="Siswa">Siswa</option>
          <option value="Alumni">Alumni</option>
        </select>
      </div>

      {/* Bulk Action Panel */}
      {selectedContactIds.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl mb-4 flex items-center justify-between">
          <span className="text-emerald-800 text-sm font-medium">
            <strong>{selectedContactIds.length}</strong> kontak dipilih
          </span>
          <button
            onClick={() =>
              alert(
                `Fitur tambah ${selectedContactIds.length} kontak ke paket broadcast dapat dikelola di menu Broadcast`
              )
            }
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
          >
            + Masukkan ke Paket Broadcast
          </button>
        </div>
      )}

      {/* Table Data Kontak */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={
                    selectedContactIds.length === filteredContacts.length &&
                    filteredContacts.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
              </th>
              <th className="p-4">Nama Pelanggan</th>
              <th className="p-4">Nomor WhatsApp</th>
              <th className="p-4">Kategori / Label</th>
              <th className="p-4">Instansi</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center p-8 text-slate-400">
                  Memuat data kontak...
                </td>
              </tr>
            ) : filteredContacts.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-8 text-slate-400">
                  Tidak ada kontak yang ditemukan.
                </td>
              </tr>
            ) : (
              filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50 transition">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedContactIds.includes(contact.id)}
                      onChange={() => toggleSelectOne(contact.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="p-4 font-medium text-slate-800">
                    {contact.name || 'Tanpa Nama'}
                  </td>
                  <td className="p-4 text-slate-600">+{contact.phone_number}</td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full border border-slate-200 font-medium">
                      {contact.label || 'General'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">{contact.institution || '-'}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() =>
                          onSelectContact && onSelectContact(contact.phone_number)
                        }
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium"
                        title="Buka Chat"
                      >
                        💬 Chat
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(contact)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2 py-1.5 rounded-lg border border-slate-200 font-medium"
                        title="Edit Kontak"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id, contact.name)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs px-2 py-1.5 rounded-lg border border-rose-200 font-medium"
                        title="Hapus Kontak"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Edit Kontak */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-base mb-4">Edit Data Kontak</h3>
            <form onSubmit={handleUpdateContact} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Pelanggan *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nomor WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kategori / Label
                </label>
                <select
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="General">General</option>
                  <option value="Hot Lead">Hot Lead</option>
                  <option value="Guru">Guru</option>
                  <option value="Siswa">Siswa</option>
                  <option value="Alumni">Alumni</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Instansi / Sekolah
                </label>
                <input
                  type="text"
                  value={editInstitution}
                  onChange={(e) => setEditInstitution(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}