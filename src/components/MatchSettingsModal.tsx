import React, { useState } from 'react';
import { Settings, X, Check, Volume2, VolumeX, Users, User, Mic, Megaphone } from 'lucide-react';
import { GameState, MatchType, TargetPoints } from '../types';
import { TTSMode } from '../utils/tts';

interface MatchSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onSave: (settings: {
    targetPoints: TargetPoints;
    matchType: MatchType;
    setsToWin: number;
    teamAName: string;
    teamBName: string;
    serverTeam: 'A' | 'B';
    ttsMode: TTSMode;
    ttsAnnounceButtons: boolean;
  }) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  ttsMode: TTSMode;
  ttsAnnounceButtons: boolean;
  onTestTTS: () => void;
}

export const MatchSettingsModal: React.FC<MatchSettingsModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onSave,
  soundEnabled,
  onToggleSound,
  ttsMode: initialTtsMode,
  ttsAnnounceButtons: initialTtsAnnounceButtons,
  onTestTTS,
}) => {
  const [targetPoints, setTargetPoints] = useState<TargetPoints>(gameState.targetPoints);
  const [matchType, setMatchType] = useState<MatchType>(gameState.matchType);
  const [setsToWin, setSetsToWin] = useState<number>(gameState.setsToWin);
  const [teamAName, setTeamAName] = useState<string>(gameState.teamA.name);
  const [teamBName, setTeamBName] = useState<string>(gameState.teamB.name);
  const [serverTeam, setServerTeam] = useState<'A' | 'B'>(gameState.serverTeam);
  const [ttsMode, setTtsMode] = useState<TTSMode>(initialTtsMode);
  const [ttsAnnounceButtons, setTtsAnnounceButtons] = useState<boolean>(initialTtsAnnounceButtons);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      targetPoints,
      matchType,
      setsToWin,
      teamAName: teamAName.trim() || 'Team A',
      teamBName: teamBName.trim() || 'Team B',
      serverTeam,
      ttsMode,
      ttsAnnounceButtons,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1f222a] border border-white/[0.08] rounded-[28px] w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden">
        {/* M3 Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/[0.06] bg-[#1a1d24]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Tetapan Perlawanan</h2>
              <p className="text-xs text-slate-400">Format mata (15/21), kategori & suara TTS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Target Points: 15 or 21 (M3 Segmented Button) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Sasaran Mata (Mata Kemenangan)
            </label>
            <div className="grid grid-cols-2 p-1 bg-[#15171d] rounded-full border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setTargetPoints(21)}
                className={`py-2 px-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  targetPoints === 21
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {targetPoints === 21 && <Check className="w-3.5 h-3.5" />}
                <span>21 Mata (BWF Rasmi)</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetPoints(15)}
                className={`py-2 px-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  targetPoints === 15
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {targetPoints === 15 && <Check className="w-3.5 h-3.5" />}
                <span>15 Mata (Pantas)</span>
              </button>
            </div>
          </div>

          {/* Match Type: Singles vs Doubles (M3 Segmented Button) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Kategori Perlawanan
            </label>
            <div className="grid grid-cols-2 p-1 bg-[#15171d] rounded-full border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setMatchType('singles')}
                className={`py-2 px-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  matchType === 'singles'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Perseorangan (1v1)</span>
              </button>

              <button
                type="button"
                onClick={() => setMatchType('doubles')}
                className={`py-2 px-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  matchType === 'doubles'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Beregu (2v2)</span>
              </button>
            </div>
          </div>

          {/* Sets Format: 1 Set vs Best of 3 */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Format Set Perlawanan
            </label>
            <div className="grid grid-cols-2 p-1 bg-[#15171d] rounded-full border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSetsToWin(2)}
                className={`py-2 px-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  setsToWin === 2
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {setsToWin === 2 && <Check className="w-3.5 h-3.5" />}
                <span>Terbaik drp 3 Set</span>
              </button>

              <button
                type="button"
                onClick={() => setSetsToWin(1)}
                className={`py-2 px-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  setsToWin === 1
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {setsToWin === 1 && <Check className="w-3.5 h-3.5" />}
                <span>1 Set Sahaja</span>
              </button>
            </div>
          </div>

          {/* Team / Player Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Nama Team A / Pemain A
              </label>
              <input
                type="text"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                maxLength={24}
                className="w-full bg-[#15171d] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                placeholder="cth: Lee Zii Jia"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Nama Team B / Pemain B
              </label>
              <input
                type="text"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                maxLength={24}
                className="w-full bg-[#15171d] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition"
                placeholder="cth: Viktor Axelsen"
              />
            </div>
          </div>

          {/* Starting Server */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Pembuat Servis Pertama
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setServerTeam('A')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  serverTeam === 'A'
                    ? 'bg-blue-950/70 border-blue-500 text-blue-200 ring-1 ring-blue-500/50'
                    : 'bg-[#15171d] border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <span>🏸 Servis: {teamAName || 'Team A'}</span>
              </button>
              <button
                type="button"
                onClick={() => setServerTeam('B')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  serverTeam === 'B'
                    ? 'bg-rose-950/70 border-rose-500 text-rose-200 ring-1 ring-rose-500/50'
                    : 'bg-[#15171d] border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <span>🏸 Servis: {teamBName || 'Team B'}</span>
              </button>
            </div>
          </div>

          {/* TTS (Suara Sebutan Bahasa Melayu) - M3 Surface Container */}
          <div className="p-4 rounded-2xl bg-[#16181f] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-white tracking-wide">
                  Suara Pengadil TTS (Bahasa Melayu)
                </span>
              </div>
              <button
                type="button"
                onClick={onTestTTS}
                className="px-2.5 py-1 rounded-full bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-[10px] font-bold transition active:scale-95 cursor-pointer"
              >
                Uji Suara 🔊
              </button>
            </div>

            {/* TTS Mode Selection (M3 3-segment pill) */}
            <div className="grid grid-cols-3 p-1 bg-[#101217] rounded-full border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setTtsMode('auto')}
                className={`py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  ttsMode === 'auto'
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Auto
              </button>

              <button
                type="button"
                onClick={() => setTtsMode('manual')}
                className={`py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  ttsMode === 'manual'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Manual
              </button>

              <button
                type="button"
                onClick={() => setTtsMode('off')}
                className={`py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  ttsMode === 'off'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Senyap
              </button>
            </div>

            {/* Announce Button Clicks Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <div className="text-[11px] text-slate-300 pr-2">
                <span className="font-semibold block text-slate-200">Sebut Tindakan Butang</span>
                <span className="text-[10px] text-slate-400">Sebut tiap kali butang (+1, -1, undo, tukar) ditekan</span>
              </div>
              <button
                type="button"
                onClick={() => setTtsAnnounceButtons(!ttsAnnounceButtons)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  ttsAnnounceButtons ? 'bg-teal-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white block shadow-sm transform transition-transform ${
                    ttsAnnounceButtons ? 'translate-x-6.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sound Setting (M3 Surface Container) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#16181f] border border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-teal-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <div>
                <div className="text-xs font-semibold text-slate-200">Kesan Audio (Sound Effects)</div>
                <div className="text-[10px] text-slate-400">Bunyi klik pemarkahan, wisel rehat & wisel tamat</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleSound}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                soundEnabled ? 'bg-teal-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white block shadow-sm transform transition-transform ${
                  soundEnabled ? 'translate-x-6.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons: M3 Text Button & Filled Button */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/[0.06] font-semibold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              Simpan Tetapan
            </button>
          </div>
        </form>
      </div>
    </div>
  );

};
