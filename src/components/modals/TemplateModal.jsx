import React, { useState } from 'react';
import { XIcon, FileTextIcon, CheckCheckIcon } from '../Icons';

const INITIAL_TEMPLATES = [
{
id: 'tmpl_001',
name: 'promo_pelatihan_guru_v1',
category: 'MARKETING',
language: 'id',
status: 'APPROVED',
quality: 'HIGH',
updated_at: '2026-09-20',
body: 'Halo Bapak/Ibu {{1}},\n\nKabar gembira! Sahabat Guru membuka pendaftaran workshop bersertifikat 32 JP: "{{2}}".\n\nDapatkan diskon khusus alumni sebesar {{3}}% sebelum kuota terpenuhi. Balas pesan ini untuk info pendaftaran lengkap.',
sampleVariables: ['Budi Santoso', 'Kurikulum Merdeka 2026', '35'],
},
{
id: 'tmpl_002',
name: 'notifikasi_resi_pengiriman',
category: 'UTILITY',
language: 'id',
status: 'APPROVED',
quality: 'HIGH',
updated_at: '2026-09-22',
body: 'Halo Kak {{1}},\n\nPesanan buku & modul pelatihan Anda telah diserahkan ke kurir {{2}} dengan nomor resi: {{3}}.\n\nAnda dapat melacak status pengiriman melalui tautan berikut: {{4}}.\nTerima kasih telah berbelanja di Sahabat Guru!',
sampleVariables: ['Ahsanul Umam', 'J&T Express', 'JP9812739123', 'https://cekresi.com'],
},
{
id: 'tmpl_003',
name: 'pengingat_tagihan_workshop',
category: 'UTILITY',
language: 'id',
status: 'APPROVED',
quality: 'MEDIUM',
updated_at: '2026-09-18',
body: 'Yth. {{1}},\n\nIni adalah pengingat ramah bahwa pendaftaran workshop "{{2}}" akan kedaluwarsa dalam {{3}} jam. Total tagihan: Rp {{4}}.\n\nSilakan selesaikan pembayaran untuk mengamankan sertifikat dan link Zoom.',
sampleVariables: ['Siti Rahmawati', 'Digital Class Management', '12', '150.000'],
},
{
id: 'tmpl_004',
name: 'broadcast_fitur_baru_ai',
category: 'MARKETING',
language: 'id',
status: 'PENDING',
quality: 'PENDING',
updated_at: '2026-09-23',
body: 'Halo Bapak/Ibu Guru {{1}},\n\nKini telah hadir asisten AI pembuat RPP & Modul Ajar otomatis di Sahabat Guru. Coba gratis sekarang melalui dashboard Anda: {{2}}.\n\nKetik STOP untuk berhenti berlangganan.',
sampleVariables: ['Guru Hebat', 'https://sahabatguru.id/ai-tools'],
},
{
id: 'tmpl_005',
name: 'broadcast_voucher_diskon_urgent',
category: 'MARKETING',
language: 'id',
status: 'REJECTED',
reason: 'Format nama template mengandung kata terlarang / format teks tidak memenuhi kebijakan penulisan Meta.',
updated_at: '2026-09-15',
body: 'BURUAN DISKON KILAT 90% KHUSUS HARI INI SAJA! Klik link: {{1}}',
sampleVariables: ['https://sahabatguru.id/promo'],
}
];

export default function TemplateModal({ isOpen, onClose, onSelectTemplateForChat }) {
const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create'
const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
const [previewTemplate, setPreviewTemplate] = useState(INITIAL_TEMPLATES[0]);

// Form New Template Submission State
const [newTemplate, setNewTemplate] = useState({
name: '',
category: 'MARKETING',
language: 'id',
headerText: '',
bodyText: '',
footerText: 'Ketik STOP untuk berhenti menerima info ini.',
});
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitSuccess, setSubmitSuccess] = useState(false);

if (!isOpen) return null;

const filteredTemplates = templates.filter((t) => {
if (selectedCategoryFilter === 'ALL') return true;
return t.category === selectedCategoryFilter;
});

const handleCreateTemplate = (e) => {
e.preventDefault();
if (!newTemplate.name || !newTemplate.bodyText) return;

setIsSubmitting(true);
setTimeout(() => {
  const formattedName = newTemplate.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const created = {
    id: `tmpl_${Date.now()}`,
    name: formattedName,
    category: newTemplate.category,
    language: newTemplate.language,
    status: 'PENDING',
    quality: 'PENDING',
    updated_at: new Date().toISOString().split('T')[0],
    body: newTemplate.bodyText,
    sampleVariables: ['[Nama Pelanggan]', '[Detail 1]', '[Detail 2]'],
  };

  setTemplates([created, ...templates]);
  setPreviewTemplate(created);
  setIsSubmitting(false);
  setSubmitSuccess(true);
  setTimeout(() => {
    setSubmitSuccess(false);
    setActiveTab('list');
  }, 1500);
}, 1200);


};

const renderBadge = (status) => {
switch (status) {
case 'APPROVED':
return DISETUJUI (APPROVED);
case 'PENDING':
return MENUNGGU META (PENDING);
case 'REJECTED':
return DITOLAK (REJECTED);
default:
return null;
}
};

return (



    {/* Modal Header */}
    <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow">
          <FileTextIcon />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800">Manajemen Template Siaran (Meta HSM)</h2>
          <p className="text-[11px] text-slate-500">Persetujuan & Pengajuan Template Broadcast WhatsApp Cloud API</p>
        </div>
      </div>
      <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition">
        <XIcon />
      </button>
    </div>

    {/* Tab Navigasi & Filter */}
    <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-white">
      <div className="flex gap-1.5">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'list'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Daftar Template Meta ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'create'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <span>+</span> Ajukan Template Baru
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
          {['ALL', 'MARKETING', 'UTILITY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                selectedCategoryFilter === cat
                  ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>

    {/* Modal Body */}
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Kolom Daftar Template (Kiri) */}
          <div className="md:col-span-6 space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
            {filteredTemplates.map((item) => {
              const isSelected = previewTemplate?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setPreviewTemplate(item)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-slate-800 truncate block">
                      {item.name}
                    </span>
                    {renderBadge(item.status)}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                      {item.category}
                    </span>
                    <span>• Bahasa: {item.language.toUpperCase()}</span>
                    <span>• Tgl: {item.updated_at}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Kolom Pratinjau Gelembung WhatsApp (Kanan) */}
          <div className="md:col-span-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm sticky top-0">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Pratinjau Tampilan di WhatsApp
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {previewTemplate?.id}
                </span>
              </div>

              {/* Simulasi WhatsApp Chat Bubble */}
              <div className="bg-[#efeae2] p-4 rounded-xl shadow-inner min-h-[200px] flex flex-col justify-center">
                <div className="bg-white rounded-lg p-3.5 shadow-sm max-w-sm ml-auto border border-black/5 text-xs text-slate-800 leading-relaxed space-y-2">
                  <p className="whitespace-pre-line">
                    {previewTemplate?.body.replace(/\{\{(\d+)\}\}/g, (match, num) => {
                      const idx = parseInt(num, 10) - 1;
                      return previewTemplate.sampleVariables?.[idx] || match;
                    })}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Pesan Resmi WhatsApp Business</span>
                    <span>12:00</span>
                  </div>
                </div>
              </div>

              {/* Keterangan Status / Alasan Penolakan */}
              <div className="mt-3.5 space-y-2 text-xs">
                {previewTemplate?.status === 'REJECTED' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                    <strong className="block font-semibold mb-0.5">Catatan Penolakan Meta:</strong>
                    {previewTemplate.reason}
                  </div>
                )}
                {previewTemplate?.status === 'APPROVED' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectTemplateForChat) {
                          onSelectTemplateForChat(previewTemplate.body);
                        }
                        onClose();
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5"
                    >
                      <CheckCheckIcon color="text-white" />
                      Gunakan Isi Template ke Ruang Obrolan
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Tab Form Pengajuan Template Baru ke Meta */
        <form onSubmit={handleCreateTemplate} className="max-w-2xl mx-auto bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Formulir Pengajuan Template Meta</h3>
            <p className="text-xs text-slate-500">Template yang diajukan akan ditinjau otomatis oleh sistem Meta AI dalam 1-15 menit.</p>
          </div>

          {submitSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              Template berhasil dikirim ke Meta! Status saat ini: PENDING.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Template (Huruf kecil & garis bawah):
              </label>
              <input
                type="text"
                required
                placeholder="contoh: promo_gajian_desember"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Template Meta:
              </label>
              <select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="MARKETING">MARKETING (Promosi, Diskon, Tawaran)</option>
                <option value="UTILITY">UTILITY (Konfirmasi Transaksi, Resi, Tagihan)</option>
                <option value="AUTHENTICATION">AUTHENTICATION (Kode OTP / Sandi)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Isi Pesan (Body):
              </label>
              <span className="text-[11px] text-slate-400">
                Gunakan <code className="text-emerald-700 bg-emerald-50 px-1 rounded">{'{{1}}'}</code>, <code className="text-emerald-700 bg-emerald-50 px-1 rounded">{'{{2}}'}</code> untuk teks variabel
              </span>
            </div>
            <textarea
              rows={5}
              required
              placeholder={'Halo Kak {{1}},\n\nTerima kasih telah mendaftar di program {{2}}. Mohon selesaikan pembayaran sebelum jam {{3}}.'}
              value={newTemplate.bodyText}
              onChange={(e) => setNewTemplate({ ...newTemplate, bodyText: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Teks Kaki (Footer Opt-out / Edukasi):
            </label>
            <input
              type="text"
              value={newTemplate.footerText}
              onChange={(e) => setNewTemplate({ ...newTemplate, footerText: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Mengirim ke Meta API...' : 'Ajukan Template ke Meta'}
            </button>
          </div>
        </form>
      )}
    </div>

    {/* Modal Footer */}
    <div className="p-3.5 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
      <span>WhatsApp Cloud API Standard v18.0</span>
      <button onClick={onClose} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition">
        Tutup
      </button>
    </div>

  </div>
</div>


);
}