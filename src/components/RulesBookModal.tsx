import React, { useState } from 'react';
import { BookOpen, X, Award, ShieldAlert, Users, Clock, RotateCcw, CheckCircle2 } from 'lucide-react';

interface RulesBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTargetPoints: 15 | 21;
}

export const RulesBookModal: React.FC<RulesBookModalProps> = ({ isOpen, onClose, activeTargetPoints }) => {
  const [activeTab, setActiveTab] = useState<'scoring' | 'service' | 'doubles' | 'intervals' | 'faults'>('scoring');

  if (!isOpen) return null;

  return (
    <div 
      id="rules-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="rules-modal-container"
        className="bg-[#1f222a] border border-white/[0.08] rounded-[28px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/[0.06] bg-[#1a1d24]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Buku Peraturan BWF</h2>
              <p className="text-xs text-slate-400">Panduan rasmi sistem pemarkahan, servis & faul permainan</p>
            </div>
          </div>
          <button
            id="close-rules-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (M3 Filter Chips) */}
        <div className="flex border-b border-white/[0.06] bg-[#16181f] overflow-x-auto text-xs font-medium scrollbar-none px-4 py-2.5 gap-1.5">
          <button
            id="rule-tab-scoring"
            onClick={() => setActiveTab('scoring')}
            className={`px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap text-xs font-bold cursor-pointer ${
              activeTab === 'scoring'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>15 vs 21 & Deuce</span>
          </button>
          <button
            id="rule-tab-service"
            onClick={() => setActiveTab('service')}
            className={`px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap text-xs font-bold cursor-pointer ${
              activeTab === 'service'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Peraturan Servis</span>
          </button>
          <button
            id="rule-tab-doubles"
            onClick={() => setActiveTab('doubles')}
            className={`px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap text-xs font-bold cursor-pointer ${
              activeTab === 'doubles'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Perseorangan / Beregu</span>
          </button>
          <button
            id="rule-tab-intervals"
            onClick={() => setActiveTab('intervals')}
            className={`px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap text-xs font-bold cursor-pointer ${
              activeTab === 'intervals'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Rehat & Gelanggang</span>
          </button>
          <button
            id="rule-tab-faults"
            onClick={() => setActiveTab('faults')}
            className={`px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap text-xs font-bold cursor-pointer ${
              activeTab === 'faults'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Faul & Batal</span>
          </button>
        </div>


        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm leading-relaxed text-slate-300">
          {activeTab === 'scoring' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl">
                <h3 className="font-semibold text-emerald-300 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Sistem Rally Point (Setiap Rali = 1 Mata)
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Pihak yang memenangi rali akan mendapat satu mata secara automatik, tanpa mengira sama ada mereka pihak yang membuat servis ataupun penerima servis. Pemenang rali juga berhak mendapat giliran servis seterusnya.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 21 Points Rules */}
                <div className={`p-4 rounded-xl border ${activeTargetPoints === 21 ? 'bg-slate-800/80 border-emerald-500/50 ring-1 ring-emerald-500/30' : 'bg-slate-800/40 border-slate-700'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-base">Format 21 Mata (BWF Rasmi)</span>
                    {activeTargetPoints === 21 && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-medium">Sedang Dipilih</span>
                    )}
                  </div>
                  <ul className="text-xs space-y-2 text-slate-300 list-disc list-inside">
                    <li>Pemenang perlawanan biasanya ditentukan dalam <strong>Terbaik daripada 3 Set</strong> (Best of 3).</li>
                    <li>Pihak terawal memperoleh <strong>21 mata</strong> memenangi set.</li>
                    <li><strong>Deuce (20-20):</strong> Pihak yang mendahului dengan <strong>beza 2 mata</strong> (cth: 22-20, 24-22) akan menang.</li>
                    <li><strong>Had Maksima (Golden Point 30):</strong> Jika skor terikat pada <strong>29-29</strong>, pihak yang mendapat mata ke-30 (30-29) terus menang.</li>
                  </ul>
                </div>

                {/* 15 Points Rules */}
                <div className={`p-4 rounded-xl border ${activeTargetPoints === 15 ? 'bg-slate-800/80 border-emerald-500/50 ring-1 ring-emerald-500/30' : 'bg-slate-800/40 border-slate-700'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-base">Format 15 Mata (Pantas / Santai)</span>
                    {activeTargetPoints === 15 && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-medium">Sedang Dipilih</span>
                    )}
                  </div>
                  <ul className="text-xs space-y-2 text-slate-300 list-disc list-inside">
                    <li>Pilihan format pantas untuk latihan, perlawanan santai atau kejohanan kompak.</li>
                    <li>Pihak terawal memperoleh <strong>15 mata</strong> memenangi set.</li>
                    <li><strong>Deuce (14-14):</strong> Pihak yang mendahului dengan beza 2 mata menang (cth: 16-14, 18-16).</li>
                    <li><strong>Had Maksima:</strong> Jika permainan berlarutan, mata dihadkan sehingga <strong>21 mata</strong> (20-20, mata ke-21 menang).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="space-y-3.5">
              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                <h3 className="font-bold text-white text-sm mb-2">Penentuan Petak Servis Mengikut Skor Server:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-2">
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                    <div className="font-bold text-emerald-400 text-sm mb-1">Skor Genap (0, 2, 4, 6, ...)</div>
                    <p className="text-slate-300">
                      Pembuat servis berdiri di <strong>Petak Kanan</strong> gelanggang dan menghantar servis secara menyerong (diagonal) ke petak kanan lawan.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40">
                    <div className="font-bold text-indigo-400 text-sm mb-1">Skor Ganjil (1, 3, 5, 7, ...)</div>
                    <p className="text-slate-300">
                      Pembuat servis berdiri di <strong>Petak Kiri</strong> gelanggang dan menghantar servis secara menyerong ke petak kiri lawan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700 text-xs space-y-2">
                <h4 className="font-semibold text-slate-200">Peraturan Semasa Servis Dibuat:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Kedua-dua kaki pembuat servis dan penerima servis mestilah berada di dalam petak masing-masing tanpa memijak garisan sempadan.</li>
                  <li>Bulu tangkis mestilah dipukul di bahagian bawah pinggang (ketinggian maksimum 1.15 meter mengikut peraturan BWF semasa).</li>
                  <li>Kepala raket pembuat servis mesti dihalakan ke bawah semasa sentuhan dibuat.</li>
                  <li>Gerakan raket pembuat servis mestilah berterusan ke hadapan tanpa sebarang hentian palsu (feinting).</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'doubles' && (
            <div className="space-y-3.5">
              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 text-xs space-y-2.5">
                <h3 className="font-bold text-white text-sm">Prinsip Servis & Kedudukan Beregu:</h3>
                <p className="text-slate-300">
                  1. <strong>Bila Pihak Servis Dapat Mata:</strong> Pemain yang sama kekal membuat servis, tetapi berpindah ke petak bersebelahan (dari kanan ke kiri atau sebaliknya) untuk membuat servis kepada pasangan lawan yang berbeza.
                </p>
                <p className="text-slate-300">
                  2. <strong>Bila Pihak Penerima Dapat Mata:</strong> Pihak penerima mendapat mata dan menjadi pembuat servis baharu. <em>Tiada pertukaran petak</em> antara pemain dalam pasukan yang baru menang rali itu — mereka kekal di petak mereka.
                </p>
                <p className="text-slate-300">
                  3. <strong>Siapa Yang Buat Servis Seterusnya?</strong> Ditentukan oleh skor terkini pasukan baharu:
                </p>
                <ul className="list-disc list-inside pl-2 text-slate-300 space-y-1">
                  <li>Jika skor terkini <strong>Genap</strong>: Pemain yang sedia berada di <strong>Petak Kanan</strong> akan membuat servis.</li>
                  <li>Jika skor terkini <strong>Ganjil</strong>: Pemain yang sedia berada di <strong>Petak Kiri</strong> akan membuat servis.</li>
                </ul>
              </div>

              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700 text-xs">
                <h4 className="font-semibold text-slate-200 mb-1.5">Sempadan Gelanggang:</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="p-2 bg-slate-900 rounded">
                    <strong className="text-white block mb-1">Perseorangan (Singles):</strong>
                    Panjang & Sempit: Garisan tepi dalam, garisan belakang luar.
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <strong className="text-white block mb-1">Beregu (Doubles):</strong>
                    Lebar & Pendek (semasa servis): Garisan tepi luar, garisan belakang dalam. Selepas servis kembali luas seluruh gelanggang.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'intervals' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Masa Rehat (Interval)
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li>
                    <strong>Rehat 60 Saat:</strong> Berlaku secara automatik apabila mana-mana pasukan mendahului <strong>11 mata</strong> (untuk format 21 mata) atau <strong>8 mata</strong> (untuk format 15 mata).
                  </li>
                  <li>
                    <strong>Rehat 120 Saat (2 Minit):</strong> Dibenarkan antara setiap set permainan untuk pemain minum air dan berbincang dengan jurulatih.
                  </li>
                </ul>
              </div>

              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-indigo-400" />
                  Pertukaran Gelanggang (Change of Ends)
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li>Pemain bertukar gelanggang pada akhir setiap set pertama dan set kedua.</li>
                  <li>Jika permainan memasuki <strong>Set Penentuan (Set ke-3)</strong>, pemain bertukar gelanggang sekali lagi sebaik sahaja pihak pendahulu mencapai <strong>11 mata</strong> (atau 8 mata bagi permainan 15 mata).</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'faults' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-rose-950/30 border border-rose-800/40 rounded-xl space-y-2">
                <h3 className="font-bold text-rose-300 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Kesalahan Batal (Faults)
                </h3>
                <p className="text-slate-300">Jika berlaku 'Fault', pihak lawan akan mendapat satu mata:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Bulu tangkis mendarat di luar garisan sempadan (Out).</li>
                  <li>Bulu tangkis melalui di bawah jaring atau tersangkut di jaring.</li>
                  <li>Raket, baju, atau tubuh pemain menyentuh jaring atau tiang jaring.</li>
                  <li>Pemain memukul bulu tangkis dua kali berturut-turut (Double hit).</li>
                  <li>Pemain mengganggu atau menghalang raket lawan semasa pukulan di jaring.</li>
                  <li>Kaki pembuat servis atau penerima melangkah keluar dari petak atau memijak garisan sebelum servis disempurnakan.</li>
                </ul>
              </div>

              <div className="p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-xl space-y-1.5">
                <h3 className="font-bold text-amber-300 text-sm">Undang-undang 'Let' (Main Semula)</h3>
                <p className="text-slate-300">
                  Rali diulang semula tanpa ada pertambahan mata sekiranya:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Penerima belum bersedia semasa servis dibuat dan tidak cuba memukul.</li>
                  <li>Bulu tangkis dari gelanggang bersebelahan menceroboh masuk dan mengganggu permainan.</li>
                  <li>Gabus bulu tangkis terpisah daripada bulunya ketika rali berlangsung.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* M3 Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] bg-[#1a1d24] flex items-center justify-between text-xs text-slate-400">
          <span className="truncate pr-2">Rujukan: Undang-undang Badminton BWF</span>
          <button
            id="modal-faham-btn"
            onClick={onClose}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-full transition active:scale-95 shrink-0 cursor-pointer shadow-md"
          >
            Faham & Kembali
          </button>
        </div>
      </div>
    </div>
  );
};
