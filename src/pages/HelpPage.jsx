import React, { useState } from 'react';

export default function HelpPage({ onNavigateSettings }) {
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'billing' | 'coexistence'

  return (
    <div className="flex-1 p-6 bg-slate-50 min-h-screen overflow-y-auto">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pusat Bantuan & Panduan Sistem</h1>
          <p className="text-slate-500 text-sm">
            Petunjuk lengkap pendaftaran WABA, konfigurasi pembayaran, dan mode Coexistence
          </p>
        </div>

        <button
          onClick={onNavigateSettings}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
        >
          ⚙️ Buka Pengaturan Nomor
        </button>
      </div>

      {/* Tab Segment Switcher */}
      <div className="flex gap-2 bg-slate-200 p-1.5 rounded-2xl mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('register')}
          className={
            'px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ' +
            (activeTab === 'register'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900')
          }
        >
          📝 1. Pendaftaran WABA Mandiri
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={
            'px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ' +
            (activeTab === 'billing'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900')
          }
        >
          💳 2. Tutorial Pembayaran & Billing
        </button>
        <button
          onClick={() => setActiveTab('coexistence')}
          className={
            'px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ' +
            (activeTab === 'coexistence'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900')
          }
        >
          📱 3. Panduan Mode Coexistence
        </button>
      </div>

      {/* TAB 1: PENDAFTARAN WABA MANDIRI */}
      {activeTab === 'register' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span>🚀 Langkah Pendaftaran Akun WABA Mandiri di Meta Portal</span>
            </h2>

            <ol className="space-y-4 text-xs text-slate-600 leading-relaxed list-decimal pl-4">
              <li>
                <strong className="text-slate-800 font-semibold block text-sm mb-1">
                  1. Buat Aplikasi di Meta for Developers
                </strong>
                Buka portal <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">Meta for Developers</a>, login dengan akun Facebook Anda, lalu buat aplikasi baru bertipe <strong>Business</strong>.
              </li>

              <li>
                <strong className="text-slate-800 font-semibold block text-sm mb-1">
                  2. Tambahkan Produk WhatsApp Cloud API
                </strong>
                Pada dasbor aplikasi, tambahkan produk <strong>WhatsApp</strong> $\rightarrow$ klik <strong>Setup (Penataan)</strong>.
              </li>

              <li>
                <strong className="text-slate-800 font-semibold block text-sm mb-1">
                  3. Daftarkan Nomor Telepon Baru
                </strong>
                Di menu <strong>API Setup</strong>, klik tombol <strong>Add Phone Number</strong>. Masukkan Nama Tampilan WhatsApp Business (contoh: <em>Sahabat Guru Official</em>) dan masukkan nomor HP yang aktif untuk menerima SMS verifikasi OTP.
              </li>

              <li>
                <strong className="text-slate-800 font-semibold block text-sm mb-1">
                  4. Salin Kredensial WABA ID & Phone Number ID
                </strong>
                Setelah nomor terverifikasi, salin dua ID berikut dari halaman <em>API Setup</em>:
                <div className="bg-slate-900 text-emerald-400 font-mono p-3 rounded-xl my-2 space-y-1 text-[11px]">
                  <p>• Phone Number ID (contoh: 4326818007572416)</p>
                  <p>• WhatsApp Business Account ID / WABA ID (contoh: 163200896887310)</p>
                </div>
              </li>

              <li>
                <strong className="text-slate-800 font-semibold block text-sm mb-1">
                  5. Buat Permanent System User Access Token
                </strong>
                Buka <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">Meta Business Suite $\rightarrow$ System Users</a>. Buat Pengguna Sistem dengan role <strong>Admin</strong>, klik <strong>Generate Token</strong>, lalu centang izin:
                <ul className="list-disc pl-5 mt-1 font-mono text-slate-700">
                  <li>whatsapp_business_management</li>
                  <li>whatsapp_business_messaging</li>
                </ul>
              </li>

              <li>
                <strong className="text-slate-800 font-semibold block text-sm mb-1">
                  6. Masukkan Data ke WebApp CRM Ini
                </strong>
                Buka menu <strong>Pengaturan (⚙️)</strong> pada sidebar kiri aplikasi ini, klik <strong>+ Tambah Nomor WhatsApp Baru</strong>, lalu tempelkan data WABA ID, Phone Number ID, dan Permanent Access Token tersebut.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 2: TUTORIAL PEMBAYARAN & BILLING */}
      {activeTab === 'billing' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span>💳 Panduan Sistem Penagihan & Kartu Pembayaran Meta</span>
            </h2>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-900 leading-relaxed">
              <strong>💡 Konsep Penting Meta Direct:</strong> Meta Cloud API menggunakan sistem penagihan pascabayar (<em>Postpaid / Pay-as-you-go</em>). Anda tidak perlu melakukan top-up saldo deposit. Meta akan secara otomatis memotong biaya dari Kartu Kredit/Debit yang Anda daftarkan di Meta Business Suite setiap kali ambang batas tagihan tercapai.
            </div>

            <h3 className="font-bold text-slate-800 text-sm pt-2">Langkah Menambahkan Kartu Visa / Debit di Meta:</h3>
            <ol className="space-y-3 text-xs text-slate-600 leading-relaxed list-decimal pl-4">
              <li>
                Buka <a href="https://business.facebook.com/billing_hub" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">Meta Business Suite $\rightarrow$ Penagihan & Pembayaran</a>.
              </li>
              <li>Pilih tab <strong>Metode Pembayaran</strong> di sidebar kiri.</li>
              <li>Pilih nama WABA Mandiri Baru Anda dari dropdown aset.</li>
              <li>Klik <strong>Tambahkan Metode Pembayaran</strong>, masukkan detail kartu Visa/Mastercard (Jenius, Jago, BCA, Mandiri, dll), lalu simpan.</li>
            </ol>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 leading-relaxed">
              <strong>⚠️ Solusi Mengatasi Tombol "Metode Pembayaran" Terkunci (Gembok Shared Credit Line):</strong>
              <p className="mt-1">
                Jika tombol pembayaran berwarna abu-abu dengan keterangan <em>"Menggunakan lini kredit bersama"</em>, itu artinya WABA tersebut terikat dengan BSP lama (Barantum).
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Opsi Fast Track:</strong> Gunakan WABA Mandiri Baru yang dibuat langsung di Meta for Developers (WABA baru otomatis bebas gembok).</li>
                <li><strong>Opsi Unlink:</strong> Kirim pesan ke CS Barantum untuk melakukan <em>revoke/deallocate Shared Credit Line</em> pada WABA ID Anda.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MODE COEXISTENCE */}
      {activeTab === 'coexistence' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span>📱 Panduan WhatsApp Cloud API Coexistence Mode</span>
            </h2>

            <p className="text-xs text-slate-600 leading-relaxed">
              Mode <strong>Coexistence</strong> memungkinkan Anda untuk menggunakan <strong>satu nomor telepon yang sama</strong> pada aplikasi WhatsApp Business di HP (Android/iOS) sekaligus terhubung ke Meta Cloud API di dashboard CRM webapp ini.
            </p>

            <div className="bg-slate-900 text-white p-4 rounded-xl text-xs leading-relaxed space-y-2">
              <h3 className="font-bold text-emerald-400">Aturan Kerja Mode Coexistence:</h3>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li><strong>Pesan Masuk (Inbound):</strong> Balasan pelanggan akan masuk secara bersamaan ke aplikasi HP Anda dan ke dasbor CRM WebApp ini.</li>
                <li><strong>Broadcast Massal (Outbound):</strong> Dilakukan dari WebApp CRM menggunakan Meta Cloud API agar tidak memicu pemblokiran nomor oleh Meta.</li>
                <li><strong>Balasan Personal:</strong> CS dapat membalas percakapan langsung dari WebApp CRM atau dari HP tanpa mengganggu status sinkronisasi.</li>
              </ul>
            </div>

            <h3 className="font-bold text-slate-800 text-sm pt-2">Langkah Mengaktifkan Mode Coexistence:</h3>
            <ol className="space-y-3 text-xs text-slate-600 leading-relaxed list-decimal pl-4">
              <li>
                Pastikan nomor telepon Anda telah terdaftar di aplikasi <strong>WhatsApp Business</strong> di smartphone Anda.
              </li>
              <li>
                Saat mendaftarkan nomor di Meta for Developers (API Setup), pilih mode integrasi <strong>Cloud API Coexistence</strong>.
              </li>
              <li>
                Meta akan mengirimkan kode verifikasi OTP langsung ke dalam aplikasi WhatsApp Business di HP Anda (bukan via SMS biasa).
              </li>
              <li>
                Masukkan kode verifikasi tersebut di portal Meta. Nomor HP Anda kini resmi berjalan ganda (*Coexistence*)!
              </li>
            </ol>

            <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-xl text-xs text-cyan-900 leading-relaxed">
              <strong>✨ Keuntungan Mode Coexistence:</strong> Tim lapangan/sales tetap bisa melihat dan membalas obrolan dari HP saat bepergian, sementara tim admin/CS pusat menjalankan broadcast ribuan pesan otomatis dari dasbor CRM WebApp ini.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}