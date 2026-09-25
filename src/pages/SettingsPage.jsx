import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const META_GRAPH_VERSION = 'v20.0';

export default function SettingsPage({
  supabaseUrl,
  supabaseKey,
  activeChannel,
  onSelectChannel,
  onChannelsUpdated,
}) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  // States Modal Tambah / Edit Channel
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    waba_id: '',
    phone_number_id: '',
    access_token: '',
    is_active: true,
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, msg: string }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Seluruh Akun Channel dari Supabase
  const fetchChannels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal mengambil data channels:', error.message);
    } else {
      setChannels(data || []);
      if (onChannelsUpdated) onChannelsUpdated(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      fetchChannels();
    }
  }, [supabaseUrl, supabaseKey]);

  // 2. Open Modal Tambah
  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setTestResult(null);
    setFormData({
      name: '',
      phone_number: '',
      waba_id: '',
      phone_number_id: '',
      access_token: '',
      is_active: true,
    });
    setShowModal(true);
  };

  // 3. Open Modal Edit
  const handleOpenEdit = (ch) => {
    setModalMode('edit');
    setEditingId(ch.id);
    setTestResult(null);
    setFormData({
      name: ch.name || '',
      phone_number: ch.phone_number || '',
      waba_id: ch.waba_id || '',
      phone_number_id: ch.phone_number_id || '',
      access_token: ch.access_token || '',
      is_active: ch.is_active ?? true,
    });
    setShowModal(true);
  };

  // 4. Uji Koneksi Meta API
  const handleTestConnection = async () => {
    if (!formData.waba_id.trim() || !formData.access_token.trim()) {
      alert('Isi WABA ID dan Permanent Access Token terlebih dahulu!');
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${formData.waba_id.trim()}?fields=id,name,account_review_status&access_token=${formData.access_token.trim()}`;
      const res = await fetch(url);
      const result = await res.json();

      if (result.error) {
        throw new Error(result.error.message || 'Gagal terhubung ke Meta API.');
      }

      setTestResult({
        success: true,
        msg: `✅ Koneksi Berhasil! Terhubung ke WABA: "${result.name || result.id}" (Status Review: ${result.account_review_status || 'VERIFIED'})`,
      });
    } catch (err) {
      setTestResult({
        success: false,
        msg: `❌ Uji Koneksi Gagal: ${err.message}`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // 5. Submit Form Simpan/Update Ke Supabase
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.waba_id.trim() ||
      !formData.phone_number_id.trim() ||
      !formData.access_token.trim()
    ) {
      alert('Harap lengkapi semua field yang wajib diisi!');
      return;
    }

    setIsSubmitting(true);

    const cleanPhone = formData.phone_number.replace(/[^0-9]/g, '');

    const payload = {
      name: formData.name.trim(),
      phone_number: cleanPhone,
      waba_id: formData.waba_id.trim(),
      phone_number_id: formData.phone_number_id.trim(),
      access_token: formData.access_token.trim(),
      is_active: formData.is_active,
    };

    if (modalMode === 'add') {
      const { error } = await supabase.from('channels').insert([payload]);
      if (error) {
        alert('Gagal menyimpan nomor baru: ' + error.message);
      } else {
        alert('Nomor WhatsApp baru berhasil ditambahkan!');
        setShowModal(false);
        fetchChannels();
      }
    } else {
      const { error } = await supabase.from('channels').update(payload).eq('id', editingId);
      if (error) {
        alert('Gagal memperbarui data nomor: ' + error.message);
      } else {
        alert('Data nomor berhasil diperbarui!');
        setShowModal(false);
        fetchChannels();
      }
    }
    setIsSubmitting(false);
  };

  // 6. Hapus Channel Nomor
  const handleDeleteChannel = async (id, name) => {
    if (!confirm(`Hapus nomor/channel "${name}" dari sistem?`)) return;

    const { error } = await supabase.from('channels').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus nomor: ' + error.message);
    } else {
      fetchChannels();
    }
  };

  // 7. Toggle Active Status Quick Switch
  const handleToggleActive = async (ch) => {
    const updatedStatus = !ch.is_active;
    const { error } = await supabase
      .from('channels')
      .update({ is_active: updatedStatus })
      .eq('id', ch.id);

    if (error) {
      alert('Gagal mengubah status: ' + error.message);
    } else {
      fetchChannels();
    }
  };

  return (
    <div className="flex-1 p-6 bg-slate-50 min-h-screen overflow-y-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pengaturan & Multi-Nomor WhatsApp</h1>
          <p className="text-slate-500 text-sm">
            Kelola seluruh akun WhatsApp Business (WABA Mandiri & Partner) dalam satu dasbor
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-md flex items-center gap-2"
        >
          <span>+ Tambah Nomor WhatsApp Baru</span>
        </button>
      </div>

      {/* Info Guide Box */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl mb-6 shadow-sm leading-relaxed text-xs">
        <h2 className="font-bold text-sm text-emerald-400 mb-1">💡 Panduan Integrasi WABA Mandiri</h2>
        <p className="text-slate-300">
          Anda bisa menambahkan nomor WhatsApp baru yang Anda daftarkan murni secara mandiri di Portal Meta Developer.
          Setiap nomor yang didaftarkan secara mandiri dapat dihubungkan langsung ke kartu Visa/Debit internal Anda di Meta Business Suite tanpa terkendala Lini Kredit mitra.
        </p>
      </div>

      {/* Daftar Nomor / Channels Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
            Daftar Akun WhatsApp Terhubung ({channels.length})
          </h2>
          <button
            onClick={fetchChannels}
            className="text-xs text-slate-600 hover:text-emerald-600 font-semibold flex items-center gap-1"
          >
            🔄 Sync Data
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <th className="p-4">Nama Akun</th>
                <th className="p-4">Nomor HP</th>
                <th className="p-4">WABA ID</th>
                <th className="p-4">Phone Number ID</th>
                <th className="p-4 text-center">Status Aset</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-slate-400">
                    Memuat daftar akun WhatsApp...
                  </td>
                </tr>
              ) : channels.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-slate-400">
                    Belum ada akun WhatsApp terdaftar. Klik "+ Tambah Nomor WhatsApp Baru" di atas.
                  </td>
                </tr>
              ) : (
                channels.map((ch) => {
                  const isSelected = activeChannel?.id === ch.id;
                  return (
                    <tr
                      key={ch.id}
                      className={
                        'hover:bg-slate-50 transition ' + (isSelected ? 'bg-emerald-50/60' : '')
                      }
                    >
                      <td className="p-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span>{ch.name}</span>
                          {isSelected && (
                            <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                              Aktif Didepan
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-mono">
                        {ch.phone_number ? `+${ch.phone_number}` : '-'}
                      </td>
                      <td className="p-4 font-mono text-slate-500">{ch.waba_id}</td>
                      <td className="p-4 font-mono text-slate-500">{ch.phone_number_id}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleActive(ch)}
                          className={
                            'px-2.5 py-1 rounded-full text-[10px] font-bold border transition ' +
                            (ch.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200')
                          }
                        >
                          {ch.is_active ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onSelectChannel && onSelectChannel(ch)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg font-bold shadow-sm"
                            title="Gunakan Nomor Ini"
                          >
                            Gunakan
                          </button>
                          <button
                            onClick={() => handleOpenEdit(ch)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] px-2.5 py-1.5 rounded-lg font-medium border"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteChannel(ch.id, ch.name)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] px-2 py-1.5 rounded-lg font-medium border border-rose-200"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah / Edit Nomor Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">
                {modalMode === 'add'
                  ? '➕ Hubungkan Nomor WhatsApp Business Baru'
                  : '✏️ Edit Kredensial Akun WhatsApp'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Label Akun *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sahabat Guru (Mandiri Baru)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Telepon WhatsApp (Gunakan Format 62...)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 6281234567890"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp Business Account ID (WABA ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 163200896887310"
                    value={formData.waba_id}
                    onChange={(e) => setFormData({ ...formData, waba_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 4326818007572416"
                    value={formData.phone_number_id}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number_id: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Permanent Access Token (Meta System User Token) *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="EAAZBLhjrRT1..."
                  value={formData.access_token}
                  onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                ></textarea>
              </div>

              {/* Tombol Test Connection */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span>{testingConnection ? 'Memeriksa Token Meta...' : '🔌 Uji Koneksi Meta Token'}</span>
                </button>

                {testResult && (
                  <div
                    className={
                      'mt-2 p-2.5 rounded-lg text-xs font-medium border leading-relaxed ' +
                      (testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200')
                    }
                  >
                    {testResult.msg}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kredensial Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}