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

  // States Modal Tambah / Edit Kontak
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form Field States
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    label: 'General',
    institution: '',
    email: '',
    notes: '',
    custom_fields: {},
  });

  // State untuk Tambah Custom Field Baru (Key - Value)
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 2. Open Modal Tambah Kontak Baru
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData({
      name: '',
      phone_number: '',
      label: 'General',
      institution: '',
      email: '',
      notes: '',
      custom_fields: {},
    });
    setShowModal(true);
  };

  // 3. Open Modal Edit Kontak
  const handleOpenEditModal = (contact) => {
    setModalMode('edit');
    setEditingId(contact.id);
    setFormData({
      name: contact.name || '',
      phone_number: contact.phone_number || '',
      label: contact.label || 'General',
      institution: contact.institution || '',
      email: contact.email || '',
      notes: contact.notes || '',
      custom_fields: contact.custom_fields || {},
    });
    setShowModal(true);
  };

  // 4. Handle Submit Form (Tambah / Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone_number.trim()) return;

    setIsSubmitting(true);
    const cleanPhone = sanitizePhone(formData.phone_number);

    const payload = {
      name: formData.name.trim(),
      phone_number: cleanPhone,
      label: formData.label,
      institution: formData.institution.trim(),
      email: formData.email.trim(),
      notes: formData.notes.trim(),
      custom_fields: formData.custom_fields,
    };

    if (modalMode === 'add') {
      const { error } = await supabase.from('contacts').upsert([payload], { onConflict: 'phone_number' });
      if (error) {
        alert('Gagal menyimpan kontak baru: ' + error.message);
      } else {
        alert('Kontak baru berhasil ditambahkan!');
        setShowModal(false);
        fetchContacts();
      }
    } else {
      const { error } = await supabase.from('contacts').update(payload).eq('id', editingId);
      if (error) {
        alert('Gagal memperbarui kontak: ' + error.message);
      } else {
        alert('Data kontak berhasil diperbarui!');
        setShowModal(false);
        fetchContacts();
      }
    }
    setIsSubmitting(false);
  };

  // Helper untuk Tambah/Hapus Custom Field (Key-Value)
  const handleAddCustomField = () => {
    if (!customKey.trim() || !customValue.trim()) return;
    setFormData((prev) => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [customKey.trim()]: customValue.trim(),
      },
    }));
    setCustomKey('');
    setCustomValue('');
  };

  const handleRemoveCustomField = (keyToRemove) => {
    setFormData((prev) => {
      const updated = { ...prev.custom_fields };
      delete updated[keyToRemove];
      return { ...prev, custom_fields: updated };
    });
  };

  // 5. Unduh Template Excel
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Nama: 'Ahmad Supardi',
        'No WA': '081234567890',
        Kategori: 'Guru',
        Instansi: 'SMA 1 Kudus',
        Email: 'ahmad@example.com',
        Catatan: 'Tertarik ikut webinar',
      },
      {
        Nama: 'Budi Santoso',
        'No WA': '6289876543210',
        Kategori: 'Alumni',
        Instansi: 'Universitas X',
        Email: 'budi@example.com',
        Catatan: 'Lulusan batch 2',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Kontak');
    XLSX.writeFile(workbook, 'Template_Import_Kontak_CRM.xlsx');
  };

  // 6. Handle Import Excel / CSV
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
          row.Phone || row.phone || row['No WA'] || row['no wa'] || row.WhatsApp || row.phone_number || '';
        const cleanPhone = sanitizePhone(rawPhone);

        return {
          phone_number: cleanPhone,
          name: row.Name || row.name || row.Nama || row.nama || 'Tanpa Nama',
          label: row.Label || row.label || row.Kategori || row.kategori || 'General',
          institution: row.Institution || row.instansi || row.Instansi || row.Sekolah || '',
          email: row.Email || row.email || '',
          notes: row.Notes || row.notes || row.Catatan || row.catatan || '',
        };
      })
      .filter((item) => item.phone_number.length >= 10);

    if (formattedData.length === 0) {
      alert('Tidak ada data kontak valid yang ditemukan pada file.');
      setIsImporting(false);
      return;
    }

    const { error } = await supabase.from('contacts').upsert(formattedData, { onConflict: 'phone_number' });

    if (error) {
      alert('Gagal mengimpor kontak: ' + error.message);
    } else {
      alert(`Berhasil mengimpor ${formattedData.length} kontak!`);
      fetchContacts();
    }
    setIsImporting(false);
  };

  // 7. Hapus Kontak
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

  // Checkbox Select
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
      (c.institution || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 bg-slate-50 min-h-screen overflow-y-auto">
      {/* Title Bar & Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Data Kontak</h1>
          <p className="text-slate-500 text-sm">
            Kelola seluruh database kontak pelanggan beserta variabel kustomnya
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tombol Tambah Kontak Manual */}
          <button
            onClick={handleOpenAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm flex items-center gap-1.5"
          >
            <span>+ Tambah Kontak</span>
          </button>

          {/* Tombol Download Template */}
          <button
            onClick={handleDownloadTemplate}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3.5 py-2 rounded-lg font-medium text-sm transition border border-slate-300"
            title="Download Format Template Excel"
          >
            <span>📥 Template Excel</span>
          </button>

          {/* Tombol Import Excel */}
          <label className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg cursor-pointer font-medium text-sm transition shadow-sm">
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
          placeholder="Cari nama, nomor WA, instansi, atau email..."
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
            onClick={() => alert(`Sistem siap memproses ${selectedContactIds.length} kontak untuk broadcast.`)}
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
                  checked={selectedContactIds.length === filteredContacts.length && filteredContacts.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
              </th>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Nomor WhatsApp</th>
              <th className="p-4">Kategori & Instansi</th>
              <th className="p-4">Email</th>
              <th className="p-4">Variabel Kustom</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center p-8 text-slate-400">
                  Memuat data kontak...
                </td>
              </tr>
            ) : filteredContacts.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-8 text-slate-400">
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
                    <div>{contact.name || 'Tanpa Nama'}</div>
                    {contact.notes && <div className="text-[10px] text-slate-400 italic font-normal">{contact.notes}</div>}
                  </td>
                  <td className="p-4 text-slate-600">+{contact.phone_number}</td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full border border-slate-200 font-medium inline-block mb-1">
                      {contact.label || 'General'}
                    </span>
                    <div className="text-xs text-slate-500">{contact.institution || '-'}</div>
                  </td>
                  <td className="p-4 text-slate-500 text-xs">{contact.email || '-'}</td>
                  <td className="p-4">
                    {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(contact.custom_fields).map(([k, v]) => (
                          <span key={k} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded font-mono">
                            {k}: <strong>{v}</strong>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onSelectContact && onSelectContact(contact.phone_number)}
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
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Unified: Tambah / Edit Kontak Penuh */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-base mb-4 pb-2 border-b">
              {modalMode === 'add' ? 'Tambah Kontak Baru' : 'Edit Data Kontak Penuh'}
            </h3>

            <form onSubmit={handleSubmitForm} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Pelanggan *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Ahmad Supardi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori / Label</label>
                  <select
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Hot Lead">Hot Lead</option>
                    <option value="Guru">Guru</option>
                    <option value="Siswa">Siswa</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Instansi / Sekolah</label>
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="SMA 1 Kudus"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Alamat Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="ahmad@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan CS (Notes)</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Keterangan singkat seputar pelanggan..."
                ></textarea>
              </div>

              {/* SECTION VARIABEL KUSTOM (JSONB) FOR BROADCAST */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Variabel Kustom (Custom Fields untuk Broadcast)
                </label>
                <p className="text-[10px] text-slate-400 mb-2">
                  Tambahkan variabel dinamis yang bisa disisipkan pada template broadcast (misal: <code>kota</code>, <code>nominal</code>, <code>kode_voucher</code>).
                </p>

                {/* Input Tambah Variabel Baris */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nama Variabel (misal: kota)"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    className="w-1/2 border border-slate-300 rounded-lg p-1.5 text-xs font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Nilai (misal: Kudus)"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="w-1/2 border border-slate-300 rounded-lg p-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="bg-slate-800 text-white px-3 rounded-lg text-xs font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Daftar Variabel Terpasang */}
                {Object.keys(formData.custom_fields).length > 0 && (
                  <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {Object.entries(formData.custom_fields).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-xs font-mono">
                        <span>
                          <strong className="text-emerald-700">{k}:</strong> {v}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(k)}
                          className="text-rose-600 hover:text-rose-800 text-[10px] font-bold"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data Kontak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}