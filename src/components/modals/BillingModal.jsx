import React from 'react';
import { XIcon, CreditCardIcon } from '../Icons';

export default function BillingModal({ isOpen, onClose }) {
if (!isOpen) return null;

// Data representasi akun Meta Business Manager Sahabat Guru
const billingInfo = {
accountName: 'Sahabat Guru Indonesia (WABA ID: 294810293810)',
currency: 'IDR (Rupiah)',
prepaidBalance: 485000, // Saldo deposit aktif saat ini
creditLimit: 1500000,
status: 'ACTIVE',
qualityRating: 'GREEN (HIGH)',
currentTier: 'Tier 2 (10.000 nomor penerima / 24 jam)',
tierProgress: 2450, // Pesan terkirim dalam 24 jam terakhir
tierMax: 10000,
// Tarif resmi Meta untuk Indonesia (est. 2026)
rates: {
marketing: 465, // Biaya per percakapan marketing
utility: 235,   // Biaya per notifikasi resi / konfirmasi bayar
service: 0,     // Gratis jika pelanggan kirim pesan duluan (jendela 24 jam)
}
};

const estimatedMarketingBroadcasts = Math.floor(billingInfo.prepaidBalance / billingInfo.rates.marketing);
const estimatedUtilityBroadcasts = Math.floor(billingInfo.prepaidBalance / billingInfo.rates.utility);

return (



    {/* Header */}
    <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow">
          <CreditCardIcon />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800">Saldo & Tagihan Meta WABA</h2>
          <p className="text-[11px] text-slate-500">Kredit Akun WhatsApp Business & Estimasi Biaya Siaran</p>
        </div>
      </div>
      <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition">
        <XIcon />
      </button>
    </div>

    {/* Isi Tagihan / Saldo */}
    <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
      
      {/* Kartu Saldo Utama */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold">
            Sisa Saldo Deposit Iklan / Siaran Meta
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 mb-3">
            Rp {billingInfo.prepaidBalance.toLocaleString('id-ID')}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-white/10">
            <div>
              <span className="text-slate-400 block text-[10px]">Kapasitas Siaran Marketing:</span>
              <span className="font-bold text-emerald-400">~{estimatedMarketingBroadcasts} pesan</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Kapasitas Siaran Utility (Resi):</span>
              <span className="font-bold text-cyan-400">~{estimatedUtilityBroadcasts} pesan</span>
            </div>
          </div>
        </div>

        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Kuota Limit Harian (Tiering Meta) */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">Status Batas Pesan 24 Jam (Tier Meta):</span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
            {billingInfo.currentTier}
          </span>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-emerald-600 h-2.5 rounded-full transition-all"
            style={{ width: `${(billingInfo.tierProgress / billingInfo.tierMax) * 100}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Terpakai: {billingInfo.tierProgress} nomor</span>
          <span>Kapasitas: {billingInfo.tierMax} nomor unik/hari</span>
        </div>
      </div>

      {/* Rincian Tarif Meta Indonesia */}
      <div>
        <h3 className="text-xs font-bold text-slate-700 mb-2">Tabel Tarif Resmi Meta (Wilayah Indonesia):</h3>
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <div className="grid grid-cols-3 bg-slate-100 p-2.5 font-bold text-slate-600 border-b border-slate-200">
            <span>Kategori Pesan</span>
            <span>Tarif / Percakapan</span>
            <span>Fungsi Penggunaan</span>
          </div>
          <div className="grid grid-cols-3 p-2.5 border-b border-slate-100 items-center">
            <span className="font-semibold text-emerald-700">MARKETING</span>
            <span className="font-bold text-slate-800">Rp {billingInfo.rates.marketing}</span>
            <span className="text-slate-500 text-[11px]">Promo, penawaran diskon, pengumuman massal</span>
          </div>
          <div className="grid grid-cols-3 p-2.5 border-b border-slate-100 items-center">
            <span className="font-semibold text-blue-700">UTILITY</span>
            <span className="font-bold text-slate-800">Rp {billingInfo.rates.utility}</span>
            <span className="text-slate-500 text-[11px]">Resi pengiriman, tagihan bayar, bukti transaksi</span>
          </div>
          <div className="grid grid-cols-3 p-2.5 items-center bg-emerald-50/40">
            <span className="font-semibold text-emerald-900">SERVICE (Balasan CS)</span>
            <span className="font-bold text-emerald-700">GRATIS</span>
            <span className="text-slate-500 text-[11px]">Balas pesan pelanggan dalam jendela 24 jam</span>
          </div>
        </div>
      </div>

      {/* Kualitas Reputasi Nomor & Top Up Link */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
        <div>
          <span className="font-semibold text-amber-900 block">Kualitas Nomor Pengirim:</span>
          <p className="text-[11px] text-amber-700">Skor: {billingInfo.qualityRating}. Reputasi nomor aman dari pemblokiran massal.</p>
        </div>
        <a
          href="https://business.facebook.com/wa/manage/phone-numbers/"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-[11px] transition shadow shrink-0"
        >
          Isi Ulang Saldo Meta
        </a>
      </div>

    </div>

    {/* Footer */}
    <div className="p-3.5 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
      <span>Sinkronisasi otomatis dengan Meta Business Suite</span>
      <button
        onClick={onClose}
        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition"
      >
        Selesai
      </button>
    </div>

  </div>
</div>


);
}