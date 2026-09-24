import React, { useState, useEffect, useCallback } from 'react';

// Konfigurasi Kredensial Meta Graph API
const META_WABA_ID = '163200896887310';
const META_GRAPH_VERSION = 'v20.0';

// Isikan Permanent System User Token dari Meta Business Suite Anda di sini
const META_ACCESS_TOKEN = process.env.REACT_APP_META_TOKEN || 'ISIKAN_PERMANENT_META_TOKEN_ANDA_DI_SINI';

export default function TemplatesPage({ onSelectTemplateForChat }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // States Variabel Pratinjau (misal: {{1}}, {{2}})
  const [variables, setVariables] = useState({});

  // States Modal Ajukan Template Baru
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTmplName, setNewTmplName] = useState('');
  const [newTmplCategory, setNewTmplCategory] = useState('MARKETING');
  const [newTmplLanguage, setNewTmplLanguage] = useState('id');
  const [newTmplBody, setNewTmplBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Template Langsung dari Server Meta Graph API
  const fetchMetaTemplates = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_WABA_ID}/message_templates?limit=100&access_token=${META_ACCESS_TOKEN}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message || 'Gagal terhubung ke Meta Graph API.');
      }

      // Format data dari respons Meta API
      const formatted = (result.data || []).map((item) => {
        const bodyComp = item.components?.find((c) => c.type === 'BODY');
        return {
          id: item.id,
          name: item.name,
          category: item.category,
          language: item.language,
          status: item.status, // APPROVED, PENDING, REJECTED
          body: bodyComp ? bodyComp.text : 'Tidak ada isi teks body.',
        };
      });

      setTemplates(formatted);
      if (formatted.length > 0 && !selectedTemplate) {
        setSelectedTemplate(formatted[0]);
      }
    } catch (err) {
      console.error('Meta API Error:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    fetchMetaTemplates();
  }, [fetchMetaTemplates]);

  // 2. Ekstrak placeholder {{1}}, {{2}} untuk input uji coba variabel
  useEffect(() => {
    if (selectedTemplate?.body) {
      const matches = selectedTemplate.body.match(/\{\{\d+\}\}/g) || [];
      const initialVars = {};
      matches.forEach((placeholder, idx) => {
        const defaultSample =
          idx === 0
            ? 'Budi Santoso'
            : idx === 1
            ? 'Kurikulum Merdeka 2026'
            : `Nilai ${idx + 1}`;
        initialVars[placeholder] = defaultSample;
      });
      setVariables(initialVars);
    }
  }, [selectedTemplate]);

  // Hasilkan Teks Pratinjau dengan Variabel Terisi
  const getRenderedPreview = () => {
    if (!selectedTemplate) return '';
    let rendered = selectedTemplate.body;
    Object.keys(variables).forEach((placeholder) => {
      rendered = rendered.replace(
        new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
        variables[placeholder] || placeholder
      );
    });
    return rendered;
  };

  // 3. Ajukan Template Baru ke Meta Graph API (POST)
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTmplName.trim() || !newTmplBody.trim()) return;

    setIsSubmitting(true);
    const formattedName = newTmplName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    const payload = {
      name: formattedName,
      category: newTmplCategory,
      language: newTmplLanguage,
      components: [
        {
          type: 'BODY',
          text: newTmplBody.trim(),
        },
      ],
    };

    try {
      const response = await fetch(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_WABA_ID}/message_templates`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${META_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const resData = await response.json();

      if (resData.error) {
        throw new Error(resData.error.message);
      }

      alert(
        `Berhasil! Template "${formattedName}" telah diajukan ke Meta (ID: ${resData.id}). Status saat ini: PENDING.`
      );
      setNewTmplName('');
      setNewTmplBody('');
      setShowCreateModal(false);
      fetchMetaTemplates();
    } catch (err) {
      alert('Gagal mengajukan template ke Meta: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Lokal
  const filteredTemplates = templates.filter((t) => {
    const matchCategory =
      selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.body.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex-1 p-6 bg-slate-50 min-h-screen overflow-y-auto">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Manajemen Template Siaran (Meta HSM)
          </h1>
          <p className="text-slate-500 text-sm">
            Status persetujuan, pengajuan, dan pengujian template langsung dari WhatsApp Cloud API
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMetaTemplates}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition border border-slate-300"
            title="Segarkan data dari Meta"
          >
            🔄 Sync Meta
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm"
          >
            + Ajukan Template Baru
          </button>
        </div>
      </div>

      {/* Warning jika Token Belum Dipasang */}
      {META_ACCESS_TOKEN.includes('ISIKAN_PERMANENT') && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 text-xs leading-relaxed">
          <strong>💡 Catatan Integrasi:</strong> Untuk terhubung ke server Meta, pastikan Anda telah memasukkan <strong>Permanent Meta Access Token</strong> pada variabel <code>META_ACCESS_TOKEN</code> di dalam file <code>TemplatesPage.jsx</code>.
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl mb-6 text-xs font-medium">
          ❌ Meta API Connection Error: {errorMsg}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <input
          type="text"
          placeholder="Cari nama atau isi template Meta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'MARKETING', 'UTILITY', 'AUTHENTICATION'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ' +
                (selectedCategory === cat
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Daftar Template dari Meta */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="text-slate-400 text-sm py-12 text-center bg-white rounded-xl border p-4">
              Menghubungkan ke Meta Cloud API...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border p-4">
              Tidak ada template yang ditemukan di akun WABA Anda.
            </div>
          ) : (
            filteredTemplates.map((tmpl) => {
              const isSelected = selectedTemplate?.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-4 rounded-xl border bg-white transition cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm font-mono">
                        {tmpl.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {tmpl.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          • Bahasa: {tmpl.language.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge Meta */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                        tmpl.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : tmpl.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {tmpl.status === 'APPROVED'
                        ? 'DISETUJUI (APPROVED)'
                        : tmpl.status === 'PENDING'
                        ? 'MENUNGGU (PENDING)'
                        : 'DITOLAK (REJECTED)'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                    {tmpl.body}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Kolom Kanan: Pratinjau Tampilan di WhatsApp & Input Variabel */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-6 self-start">
          <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
            PRATINJAU TAMPILAN DI WHATSAPP
          </h2>

          {selectedTemplate ? (
            <>
              {/* Dynamic Variable Inputs */}
              {Object.keys(variables).length > 0 && (
                <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Isi Variabel Uji Coba:
                  </span>
                  {Object.keys(variables).map((placeholder) => (
                    <div key={placeholder} className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-700 w-10">
                        {placeholder}
                      </span>
                      <input
                        type="text"
                        value={variables[placeholder]}
                        onChange={(e) =>
                          setVariables({
                            ...variables,
                            [placeholder]: e.target.value,
                          })
                        }
                        className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Bubble Simulation */}
              <div className="bg-slate-200/60 p-4 rounded-2xl mb-4 border border-slate-300/50 shadow-inner">
                <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm text-xs text-slate-800 space-y-3 leading-relaxed">
                  <p className="whitespace-pre-line">{getRenderedPreview()}</p>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1 border-t border-slate-50">
                    <span>Pesan Resmi WhatsApp Business</span>
                    <span>12:00</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                disabled={selectedTemplate.status !== 'APPROVED'}
                onClick={() => {
                  if (onSelectTemplateForChat) {
                    onSelectTemplateForChat(getRenderedPreview());
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
              >
                <span>✔ Gunakan Isi Template ke Ruang Obrolan</span>
              </button>

              {selectedTemplate.status !== 'APPROVED' && (
                <p className="text-[10px] text-rose-500 text-center mt-2">
                  * Hanya template berstatus APPROVED yang dapat digunakan untuk berkirim pesan.
                </p>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p>Pilih template di sebelah kiri untuk melihat pratinjau.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Ajukan Template Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-base mb-1">
              Ajukan Template Siaran Baru ke Meta
            </h3>
            <p className="text-slate-500 text-xs mb-4">
              Template akan dikirim langsung ke WhatsApp Cloud API untuk proses tinjauan otomatis Meta.
            </p>

            <form onSubmit={handleCreateTemplate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Template (Huruf Kecil & Underscore) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: promo_tahun_baru_2026"
                  value={newTmplName}
                  onChange={(e) => setNewTmplName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={newTmplCategory}
                    onChange={(e) => setNewTmplCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="MARKETING">MARKETING</option>
                    <option value="UTILITY">UTILITY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Bahasa *
                  </label>
                  <select
                    value={newTmplLanguage}
                    onChange={(e) => setNewTmplLanguage(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="id">Indonesian (id)</option>
                    <option value="en_US">English (en_US)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Isi Pesan Template (Gunakan {"{{1}}"}, {"{{2}}"} untuk variabel) *
                </label>
                <textarea
                  required
                  rows="4"
                  placeholder="Halo Bapak/Ibu {{1}}, terima kasih telah mendaftar di {{2}}..."
                  value={newTmplBody}
                  onChange={(e) => setNewTmplBody(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
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
                  {isSubmitting ? 'Mengirim ke Meta...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}