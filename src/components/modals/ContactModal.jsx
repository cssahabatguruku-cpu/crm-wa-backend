import React, { useState } from 'react';
import { XIcon, SearchIcon, UserIcon, TagIcon } from '../Icons';

export default function ContactModal({
  isOpen,
  onClose,
  contacts,
  onSelectContact,
  onContactCreated,
  supabaseUrl,
  supabaseKey,
}) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add'
  const [search, setSearch] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('ALL');

  // Form Tambah Kontak Baru
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTag, setNewTag] = useState('Hot Lead');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Format nomor HP agar standar (628xxx)
  const sanitizePhone = (phone) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    if (clean.startsWith('+62')) clean = clean.slice(1);
    return clean;
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const formattedPhone = sanitizePhone(newPhone);
    if (!formattedPhone || formattedPhone.length < 9) {
      setErrorMsg('Nomor WhatsApp tidak valid (minimal 10 digit).');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Simpan kontak baru ke tabel 'contacts' di Supabase
      const payload = {
        name: newName.trim() || formattedPhone,
        phone_number: formattedPhone,
        created_at: new Date().toISOString(),
      };

      const res = await fetch(supabaseUrl + '/rest/v1/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: 'Bearer ' + supabaseKey,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Gagal menyimpan kontak ke Supabase.');
      }

      const createdList = await res.json();
      const createdContact = createdList?.[0] || payload;

      setSuccessMsg('Kontak berhasil ditambahkan!');
      if (onContactCreated) onContactCreated(createdContact);

      setTimeout(() => {
        setSuccessMsg('');
        setNewName('');
        setNewPhone('');
        setNotes('');
        setActiveTab('list');
        // Langsung buka chat dengan kontak yang baru dibuat
        if (onSelectContact) {
          onSelectContact(createdContact);
          onClose();
        }
      }, 900);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchName = (c.name || '').toLowerCase().includes(q);
    const matchPhone = (c.phone_number || '').includes(q);
    return matchName || matchPhone;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow">
              <UserIcon />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">Buku Kontak Pelanggan</h2>
              <p className="text-[11px] text-slate-500">Database Kontak & Inisiasi Obrolan Baru</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <XIcon />
          </button>
        </div>

        {/* Tab Navigasi */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-white">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ' +
                (activeTab === 'list'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
              }
            >
              Daftar Kontak ({contacts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className={
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ' +
                (activeTab === 'add'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200')
              }
            >
              <span>+</span> Tambah Kontak Baru
            </button>
          </div>
        </div>

        {/* Isi Konten */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {/* Kolom Pencarian */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama atau nomor WhatsApp..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                />
              </div>

              {/* List Kontak */}
              <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm max-h-[50vh] overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Tidak ada kontak yang cocok dengan pencarian.
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {(contact.name || contact.phone_number || 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-xs text-slate-800 truncate">
                            {contact.name || contact.phone_number}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">+{contact.phone_number}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectContact(contact);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition shrink-0"
                      >
                        Buka Chat
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Formulir Tambah Kontak */
            <form onSubmit={handleCreateContact} className="max-w-md mx-auto bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Tambah Kontak Pelanggan</h3>
                <p className="text-xs text-slate-500">
                  Simpan nomor baru untuk memulai obrolan atau pengiriman template resmi.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                  {successMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pelanggan / Guru:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso, S.Pd"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp (Indonesia):</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Format otomatis diubah ke kode negara +62</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Label Segmentasi Awal:</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Hot Lead">Hot Lead (Berminat Tinggi)</option>
                  <option value="Pelanggan">Pelanggan Aktif</option>
                  <option value="Alumni Pelatihan">Alumni Pelatihan</option>
                  <option value="Kepala Sekolah">Kepala Sekolah / Yayasan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional):</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Minat materi Kurikulum Merdeka 32 JP"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Mulai Chat'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Sinkronisasi database Supabase CRM</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}