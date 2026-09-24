import React, { useState, useEffect, useCallback } from 'react';

// Konfigurasi Kredensial Meta Graph API
const META_WABA_ID = '163200896887310';
const META_GRAPH_VERSION = 'v20.0';
const META_ACCESS_TOKEN = 'EAAZBLhjrRT18BSoHItgxuRkvZAVg9XXylyw0BZBQcdWBuZCJlOfuHoo69lbVjh5TKiNZA62dSMl411wSggNytzpWwcM0oCjXc410AZBhsKRowuyqnZBWT6vcncEBwgDgZAgF7sriDJocBiBH5VAlKqkA3gtkNGnLCdzN4vyjgvhPrSGIdcwJXTCGZCd1hFMOR8JFJIAZDZD';

// Pilihan Kolom Database Kontak untuk Pemetaan
const CONTACT_FIELDS_OPTIONS = [
  { label: 'Nama Pelanggan (name)', value: 'name', sample: 'Ahmad Supardi' },
  { label: 'Nomor WhatsApp (phone_number)', value: 'phone_number', sample: '6281234567890' },
  { label: 'Instansi / Sekolah (institution)', value: 'institution', sample: 'SMA 1 Kudus' },
  { label: 'Alamat Email (email)', value: 'email', sample: 'ahmad@example.com' },
  { label: 'Kategori / Label (label)', value: 'label', sample: 'Guru' },
  { label: 'Catatan CS (notes)', value: 'notes', sample: 'Siswa Aktif' },
  { label: 'Custom: Kota (custom_fields.kota)', value: 'custom.kota', sample: 'Kudus' },
  { label: 'Custom: Nominal (custom_fields.nominal)', value: 'custom.nominal', sample: 'Rp 150.000' },
  { label: 'Custom: Kode Voucher (custom_fields.voucher)', value: 'custom.voucher', sample: 'PROMO2026' },
];

export default function TemplatesPage({ onSelectTemplateForChat }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // State Pemetaan Variabel
  const [mappings, setMappings] = useState({});

  // States Modal Ajukan Template Baru
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTmplName, setNewTmplName] = useState('');
  const [newTmplCategory, setNewTmplCategory] = useState('UTILITY');
  const [newTmplLanguage, setNewTmplLanguage] = useState('id');
  const [newTmplBody, setNewTmplBody] = useState('');
  const [varSamples, setVarSamples] = useState({});
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
        throw new Error(result.error.error_user_msg || result.error.message || 'Gagal terhubung ke Meta API.');
      }

      const formatted = (result.data || []).map((item) => {
        const bodyComp = item.components?.find((c) => c.type === 'BODY');
        return {
          id: item.id,
          name: item.name,
          category: item.category,
          language: item.language,
          status: item.status,
          body: bodyComp ? bodyComp.text : 'Tidak ada isi teks body.',
        };
      });

      setTemplates(formatted);
      if (formatted.length > 0) {
        setSelectedTemplate(formatted[0]);
      }
    } catch (err) {
      console.error('Meta API Error:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetaTemplates();
  }, [fetchMetaTemplates]);

  // 2. Deteksi Placeholder {{1}}, {{2}} untuk Pemetaan
  useEffect(() => {
    if (selectedTemplate?.body) {
      const matches = selectedTemplate.body.match(/\{\{\d+\}\}/g) || [];
      const initialMap = {};

      matches.forEach((placeholder, idx) => {
        if (idx === 0) initialMap[placeholder] = 'name';
        else if (idx === 1) initialMap[placeholder] = 'institution';
        else if (idx === 2) initialMap[placeholder] = 'email';
        else initialMap[placeholder] = 'notes';
      });

      setMappings(initialMap);
    }
  }, [selectedTemplate]);

  // Sync Input Contoh Variabel Saat User Mengetik Pesan
  useEffect(() => {
    const rawMatches = newTmplBody.match(/\{\{\d+\}\}/g) || [];
    const uniqueNums = Array.from(
      new Set(rawMatches.map((m) => parseInt(m.replace(/[^\d]/g, ''), 10)))
    ).sort((a, b) => a - b);

    const updatedSamples = { ...varSamples };
    uniqueNums.forEach((num) => {
      if (!updatedSamples[num]) {
        updatedSamples[num] = num === 1 ? 'Ahmad' : num === 2 ? 'SD Al Husna' : `Nilai ${num}`;
      }
    });

    setVarSamples(updatedSamples);
  }, [newTmplBody]);

  // 3. Render Pratinjau Teks Pesan
  const getRenderedPreview = () => {
    if (!selectedTemplate) return '';
    let rendered = selectedTemplate.body;

    Object.keys(mappings).forEach((placeholder) => {
      const fieldKey = mappings[placeholder];
      const fieldObj = CONTACT_FIELDS_OPTIONS.find((f) => f.value === fieldKey);
      const sampleVal = fieldObj ? fieldObj.sample : `[${fieldKey}]`;

      rendered = rendered.replace(
        new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
        sampleVal
      );
    });

    return rendered;
  };

  // 4. Ajukan Template Baru ke Meta Graph API (Validasi Diperketat)
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTmplName.trim() || !newTmplBody.trim()) return;

    setIsSubmitting(true);
    const formattedName = newTmplName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    // Deteksi variabel {{1}}, {{2}}, dst.
    const rawMatches = newTmplBody.match(/\{\{\d+\}\}/g) || [];
    const varNumbers = Array.from(
      new Set(rawMatches.map((m) => parseInt(m.replace(/[^\d]/g, ''), 10)))
    ).sort((a, b) => a - b);

    // Validasi Urutan Variabel
    if (varNumbers.length > 0) {
      if (varNumbers[0] !== 1) {
        alert('Variabel wajib dimulai dari {{1}}!');
        setIsSubmitting(false);
        return;
      }
      for (let i = 0; i < varNumbers.length; i++) {
        if (varNumbers[i] !== i + 1) {
          alert(`Nomor variabel harus berurutan tanpa lompatan (Seharusnya {{${i + 1}}}).`);
          setIsSubmitting(false);
          return;
        }
      }
    }

    let finalBodyText = newTmplBody.trim();

    // Auto-fix Meta Rule: Jika diakhiri variabel {{x}}, tambahkan titik di akhir
    if (/\{\{\d+\}\}$/.test(finalBodyText)) {
      finalBodyText += '.';
    }

    const bodyComponent = {
      type: 'BODY',
      text: finalBodyText,
    };

    // Sertakan parameter example.body_text jika ada variabel
    if (varNumbers.length > 0) {
      const sampleValuesArr = varNumbers.map((num) =>
        String(varSamples[num] || `Contoh ${num}`).trim()
      );
      bodyComponent.example = {
        body_text: [sampleValuesArr],
      };
    }

    const payload = {
      name: formattedName,
      category: newTmplCategory,
      language: newTmplLanguage,
      components: [bodyComponent],
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
        const detailMsg =
          resData.error.error_user_msg ||
          resData.error.error_data?.details ||
          resData.error.message;
        throw new Error(detailMsg);
      }

      alert(`Berhasil! Template "${formattedName}" telah terkirim ke Meta (ID: ${resData.id}).`);
      setNewTmplName('');
      setNewTmplBody('');
      setVarSamples({});
      setShowCreateModal(false);
      fetchMetaTemplates();
    } catch (err) {
      alert('Gagal mengajukan template ke Meta:\n' + err.message);
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

  const uniqueVarNumbersInModal = Array.from(
    new Set(
      (newTmplBody.match(/\{\{\d+\}\}/g) || []).map((m) =>
        parseInt(m.replace(/[^\d]/g, ''), 10)
      )
    )
  ).sort((a, b) => a - b);

  return (
    <div className="flex-1 p-6 bg-slate-50 min-h-screen overflow-y-auto">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Manajemen Template Siaran (Meta HSM)
          </h1>
          <p className="text-slate-500 text-sm">
            Petakan variabel template Meta dengan kolom kontak database Supabase
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

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl mb-6 text-xs font-medium">
          ❌ Meta API Error: {errorMsg}
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
        {/* Kolom Kiri: Daftar Template Meta */}
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

        {/* Kolom Kanan: Pemetaan Variabel ke Field Kontak & Pratinjau Chat */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-6 self-start">
          <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
            PEMETAAN VARIABEL & PRATINJAU
          </h2>

          {selectedTemplate ? (
            <>
              {Object.keys(mappings).length > 0 ? (
                <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                  <span className="text-[11px] font-bold text-slate-600 uppercase block">
                    Pilih Kolom Kontak untuk Tiap Variabel:
                  </span>

                  {Object.keys(mappings).map((placeholder) => (
                    <div key={placeholder} className="space-y-1">
                      <label className="text-xs font-mono font-bold text-emerald-700 block">
                        Variabel {placeholder} diisi oleh:
                      </label>
                      <select
                        value={mappings[placeholder]}
                        onChange={(e) =>
                          setMappings({
                            ...mappings,
                            [placeholder]: e.target.value,
                          })
                        }
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {CONTACT_FIELDS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mb-4 italic">
                  Template ini tidak memiliki variabel dinamis (seperti {"{{1}}"}).
                </p>
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
              <p>Pilih template di sebelah kiri untuk mengatur pemetaan variabel.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Ajukan Template Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-base mb-1">
              Ajukan Template Siaran Baru ke Meta
            </h3>
            <p className="text-slate-500 text-xs mb-3">
              Template akan dikirim langsung ke WhatsApp Cloud API untuk proses tinjauan otomatis Meta.
            </p>

            <form onSubmit={handleCreateTemplate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Template Unik (Huruf Kecil & Underscore) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: undangan_webinar_v2"
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
                    <option value="UTILITY">UTILITY</option>
                    <option value="MARKETING">MARKETING</option>
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
                  placeholder="Selamat pagi pak {{1}}, izin mengirimkan undangan untuk {{2}}."
                  value={newTmplBody}
                  onChange={(e) => setNewTmplBody(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                ></textarea>
                <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                  💡 <strong>Aturan Meta:</strong> Akhiri pesan dengan tanda titik <code>.</code> setelah variabel terakhir (misal: <code>... untuk {{2}}.</code>) agar tidak ditolak sistem Meta.
                </p>
              </div>

              {/* Form Input Contoh Variabel */}
              {uniqueVarNumbersInModal.length > 0 && (
                <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-emerald-800 block">
                    Wajib: Isikan Contoh Nilai Variabel untuk Meta Reviewer
                  </span>
                  {uniqueVarNumbersInModal.map((num) => (
                    <div key={num} className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-700 w-12">
                        {"{{" + num + "}}"}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={`Contoh isi variabel {{${num}}}`}
                        value={varSamples[num] || ''}
                        onChange={(e) =>
                          setVarSamples({ ...varSamples, [num]: e.target.value })
                        }
                        className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

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