import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

export default function BroadcastListsPage({ supabaseUrl, supabaseKey, onSelectContact }) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // States Utama
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [listContacts, setListContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal Buat Paket Baru
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Pilih dari Master Kontak
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [masterContacts, setMasterContacts] = useState([]);
  const [selectedMasterIds, setSelectedMasterIds] = useState([]);
  const [searchMaster, setSearchMaster] = useState('');

  // States Pencarian & Import
  const [searchDetail, setSearchDetail] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // 1. Fetch Daftar Seluruh Paket Broadcast
  const fetchLists = async () => {
    setLoading(true);
    const { data: listsData, error: listsErr } = await supabase
      .from('broadcast_lists')
      .select('*')
      .order('created_at', { ascending: false });

    if (listsErr) {
      console.error('Error fetching broadcast lists:', listsErr);
      setLoading(false);
      return;
    }

    // Hitung jumlah kontak per paket via pivot table
    const { data: pivotData } = await supabase
      .from('broadcast_list_contacts')
      .select('list_id');

    const countsMap = {};
    (pivotData || []).forEach((item) => {
      countsMap[item.list_id] = (countsMap[item.list_id] || 0) + 1;
    });

    const formatted = (listsData || []).map((item) => ({
      ...item,
      total_contacts: countsMap[item.id] || 0,
    }));

    setLists(formatted);
    setLoading(false);
  };

  // 2. Fetch Detail Kontak dalam Paket Tertentu
  const fetchListContacts = async (listId) => {
    setLoadingDetail(true);
    const { data: pivot, error: pivotErr } = await supabase
      .from('broadcast_list_contacts')
      .select('id, contact_id')
      .eq('list_id', listId);

    if (pivotErr || !pivot || pivot.length === 0) {
      setListContacts([]);
      setLoadingDetail(false);
      return;
    }

    const contactIds = pivot.map((p) => p.contact_id);
    const pivotMap = {};
    pivot.forEach((p) => (pivotMap[p.contact_id] = p.id));

    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .in('id', contactIds);

    const merged = (contactsData || []).map((c) => ({
      ...c,
      pivot_id: pivotMap[c.id],
    }));

    setListContacts(merged);
    setLoadingDetail(false);
  };

  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      fetchLists();
    }
  }, [supabaseUrl, supabaseKey]);

  useEffect(() => {
    if (selectedList?.id) {
      fetchListContacts(selectedList.id);
    }
  }, [selectedList]);

  // 3. Buat Paket Broadcast Baru
  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('broadcast_lists')
      .insert([{ name: newListName.trim(), description: newListDesc.trim() }])
      .select();

    if (error) {
      alert('Gagal membuat paket: ' + error.message);
    } else {
      setNewListName('');
      setNewListDesc('');
      setShowCreateModal(false);
      fetchLists();
      if (data && data[0]) setSelectedList(data[0]);
    }
    setIsSubmitting(false);
  };

  // 4. Hapus Paket Broadcast
  const handleDeleteList = async (listId, listName) => {
    if (!confirm(`Hapus paket broadcast "${listName}"?`)) return;

    const { error } = await supabase.from('broadcast_lists').delete().eq('id', listId);
    if (error) {
      alert('Gagal menghapus paket: ' + error.message);
    } else {
      if (selectedList?.id === listId) setSelectedList(null);
      fetchLists();
    }
  };

  // 5. Hapus Kontak dari Paket (Hanya menghapus link pivot, kontak master tetap aman)
  const handleRemoveContactFromList = async (pivotId) => {
    const { error } = await supabase
      .from('broadcast_list_contacts')
      .delete()
      .eq('id', pivotId);

    if (error) {
      alert('Gagal menghapus kontak dari paket: ' + error.message);
    } else {
      fetchListContacts(selectedList.id);
      fetchLists();
    }
  };

  // 6. Buka Modal Tambah Kontak dari Master
  const handleOpenMasterPicker = async () => {
    setShowAddContactModal(true);
    const { data } = await supabase.from('contacts').select('*').order('name', { ascending: true });
    setMasterContacts(data || []);
    setSelectedMasterIds([]);
  };

  // Simpan Kontak Terpilih dari Master ke Paket
  const handleAddSelectedFromMaster = async () => {
    if (selectedMasterIds.length === 0 || !selectedList) return;
    setIsSubmitting(true);

    const payload = selectedMasterIds.map((cid) => ({
      list_id: selectedList.id,
      contact_id: cid,
    }));

    const { error } = await supabase
      .from('broadcast_list_contacts')
      .upsert(payload, { onConflict: 'list_id,contact_id' });

    if (error) {
      alert('Gagal menambahkan kontak: ' + error.message);
    } else {
      alert(`Berhasil menambahkan ${selectedMasterIds.length} kontak ke paket!`);
      setShowAddContactModal(false);
      setSelectedMasterIds([]);
      fetchListContacts(selectedList.id);
      fetchLists();
    }
    setIsSubmitting(false);
  };

  // 7. Direct Import Excel / CSV Langsung ke Paket ini
  const sanitizePhone = (phone) => {
    let clean = String(phone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return clean;
  };

  const handleDirectImport = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedList) return;

    setIsImporting(true);
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processAndSaveDirectImport(results.data),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processAndSaveDirectImport(data);
      };
      reader.readAsBinaryString(file);
    }
    e.target.value = null;
  };

  const processAndSaveDirectImport = async (rawData) => {
    const formattedContacts = rawData
      .map((row) => {
        const rawPhone =
          row.Phone || row.phone || row['No WA'] || row['no wa'] || row.WhatsApp || row.phone_number || '';
        return {
          phone_number: sanitizePhone(rawPhone),
          name: row.Name || row.name || row.Nama || row.nama || 'Tanpa Nama',
          label: row.Label || row.label || row.Kategori || row.kategori || 'General',
          institution: row.Institution || row.instansi || row.Instansi || row.Sekolah || '',
          email: row.Email || row.email || '',
        };
      })
      .filter((item) => item.phone_number.length >= 10);

    if (formattedContacts.length === 0) {
      alert('Tidak ada kontak valid ditemukan pada file.');
      setIsImporting(false);
      return;
    }

    // Upsert ke Kontak Master
    const { error: upsertErr } = await supabase
      .from('contacts')
      .upsert(formattedContacts, { onConflict: 'phone_number' });

    if (upsertErr) {
      alert('Gagal menyimpan kontak master: ' + upsertErr.message);
      setIsImporting(false);
      return;
    }

    // Ambil ID kontak yang baru/sudah ada
    const phoneNumbers = formattedContacts.map((c) => c.phone_number);
    const { data: allTargetContacts } = await supabase
      .from('contacts')
      .select('id')
      .in('phone_number', phoneNumbers);

    if (allTargetContacts && allTargetContacts.length > 0) {
      const pivotPayload = allTargetContacts.map((c) => ({
        list_id: selectedList.id,
        contact_id: c.id,
      }));

      await supabase
        .from('broadcast_list_contacts')
        .upsert(pivotPayload, { onConflict: 'list_id,contact_id' });
    }

    alert(`Berhasil mengimpor & memasukkan ${formattedContacts.length} kontak ke paket broadcast!`);
    fetchListContacts(selectedList.id);
    fetchLists();
    setIsImporting(false);
  };

  // Filter Lokal Detail Paket
  const filteredListContacts = listContacts.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(searchDetail.toLowerCase()) ||
      (c.phone_number || '').includes(searchDetail)
  );

  return (
    <div className="flex-1 p-6 bg-slate-50 min-h-screen overflow-y-auto">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Paket Broadcast (Grup Kirim Massal)</h1>
          <p className="text-slate-500 text-sm">
            Kelola himpunan kontak tersegmen untuk pengiriman pesan broadcast WhatsApp
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm"
        >
          + Buat Paket Broadcast Baru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Daftar Paket Broadcast */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="font-bold text-slate-800 text-sm mb-3 uppercase tracking-wider">
            Daftar Paket ({lists.length})
          </h2>

          {loading ? (
            <p className="text-slate-400 text-sm py-4 text-center">Memuat paket broadcast...</p>
          ) : lists.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <p>Belum ada paket broadcast.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-emerald-600 font-semibold mt-2 hover:underline"
              >
                + Buat Paket Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {lists.map((list) => {
                const isSelected = selectedList?.id === list.id;
                return (
                  <div
                    key={list.id}
                    onClick={() => setSelectedList(list)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">{list.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {list.description || 'Tanpa deskripsi'}
                      </p>
                      <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        👥 {list.total_contacts} Kontak
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteList(list.id, list.name);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-white"
                      title="Hapus Paket"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Detail & Isi Kontak dalam Paket */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          {selectedList ? (
            <>
              {/* Header Detail Paket */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-100 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{selectedList.name}</h2>
                  <p className="text-xs text-slate-500">{selectedList.description || 'Tanpa deskripsi'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenMasterPicker}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 py-2 rounded-lg font-medium transition"
                  >
                    + Dari Master Kontak
                  </button>

                  <label className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-lg font-medium transition cursor-pointer">
                    <span>{isImporting ? 'Mengimpor...' : '📂 Direct Upload Excel'}</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                      onChange={handleDirectImport}
                      disabled={isImporting}
                    />
                  </label>
                </div>
              </div>

              {/* Search in Package */}
              <div className="my-4">
                <input
                  type="text"
                  placeholder="Cari kontak dalam paket ini..."
                  value={searchDetail}
                  onChange={(e) => setSearchDetail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Tabel Kontak Paket */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <th className="p-3">Nama</th>
                      <th className="p-3">Nomor WhatsApp</th>
                      <th className="p-3">Label</th>
                      <th className="p-3">Instansi</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingDetail ? (
                      <tr>
                        <td colSpan="5" className="text-center p-6 text-slate-400">
                          Memuat kontak paket...
                        </td>
                      </tr>
                    ) : filteredListContacts.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center p-6 text-slate-400">
                          Paket ini masih kosong. Tambahkan dari Master Kontak atau Upload Excel.
                        </td>
                      </tr>
                    ) : (
                      filteredListContacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-800">{contact.name}</td>
                          <td className="p-3 text-slate-600">+{contact.phone_number}</td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded border">
                              {contact.label || 'General'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{contact.institution || '-'}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleRemoveContactFromList(contact.pivot_id)}
                              className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition"
                              title="Keluarkan dari paket"
                            >
                              Keluarkan
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400 text-sm">
              <p>👈 Pilih paket broadcast di sebelah kiri untuk melihat dan mengelola isinya.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Buat Paket Broadcast Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-base mb-3">Buat Paket Broadcast Baru</h3>
            <form onSubmit={handleCreateList} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Paket *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Promo Webinar Guru Nov 2026"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label>
                <textarea
                  placeholder="Keterangan singkat paket..."
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  rows="3"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Buat Paket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Pilih Kontak dari Master Data */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl max-h-[85vh] flex flex-col">
            <h3 className="font-bold text-slate-800 text-base mb-2">Pilih dari Master Kontak</h3>

            <input
              type="text"
              placeholder="Cari nama atau nomor..."
              value={searchMaster}
              onChange={(e) => setSearchMaster(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs mb-3"
            />

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {masterContacts
                .filter(
                  (c) =>
                    (c.name || '').toLowerCase().includes(searchMaster.toLowerCase()) ||
                    (c.phone_number || '').includes(searchMaster)
                )
                .map((contact) => {
                  const isChecked = selectedMasterIds.includes(contact.id);
                  return (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedMasterIds((prev) =>
                            isChecked
                              ? prev.filter((id) => id !== contact.id)
                              : [...prev, contact.id]
                          );
                        }}
                        className="rounded text-emerald-600"
                      />
                      <div>
                        <p className="font-bold text-slate-800">{contact.name}</p>
                        <p className="text-slate-500">+{contact.phone_number}</p>
                      </div>
                    </label>
                  );
                })}
            </div>

            <div className="flex justify-between items-center pt-4">
              <span className="text-xs text-slate-500">
                <strong>{selectedMasterIds.length}</strong> kontak dipilih
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddContactModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddSelectedFromMaster}
                  disabled={isSubmitting || selectedMasterIds.length === 0}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Menambahkan...' : 'Tambahkan ke Paket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}