import React from 'react';
import { Trophy, ArrowRight, RotateCcw, Award, Clock } from 'lucide-react';
import { GameState, TeamId } from '../types';

interface GameWonModalProps {
  isOpen: boolean;
  isMatchOver: boolean;
  winnerTeamId: TeamId;
  gameState: GameState;
  onNextSet: () => void;
  onResetMatch: () => void;
  formatTime: (seconds: number) => string;
}

export const GameWonModal: React.FC<GameWonModalProps> = ({
  isOpen,
  isMatchOver,
  winnerTeamId,
  gameState,
  onNextSet,
  onResetMatch,
  formatTime,
}) => {
  if (!isOpen) return null;

  const winner = winnerTeamId === 'A' ? gameState.teamA : gameState.teamB;
  const isA = winnerTeamId === 'A';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
    >
      <div className="bg-[#1f222a] border border-white/[0.08] rounded-[28px] w-full max-w-md p-6 sm:p-7 shadow-2xl text-center text-slate-100 relative overflow-hidden">
        {/* Glow effect */}
        <div 
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isA ? 'bg-blue-500' : 'bg-rose-500'
          }`} 
        />

        {/* Trophy / Ribbon */}
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
          <Trophy className="w-8 h-8 animate-bounce" />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {isMatchOver ? 'Juara Perlawanan!' : `Pemenang Set ${gameState.currentSet}!`}
        </h2>

        {/* Winner Tag */}
        <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16181f] border border-white/[0.08] text-sm">
          <span className={`w-3 h-3 rounded-full ${isA ? 'bg-blue-500' : 'bg-rose-500'}`} />
          <span className="font-bold text-white">{winner.name}</span>
        </div>

        {/* Current Set Score Summary */}
        <div className="my-5 p-4 bg-[#16181f] border border-white/[0.08] rounded-2xl">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Skor Akhir Set {gameState.currentSet}
          </div>
          <div className="flex items-center justify-center gap-6 text-3xl sm:text-4xl font-black">
            <span className={gameState.scoreA > gameState.scoreB ? 'text-blue-400' : 'text-slate-400'}>
              {gameState.scoreA}
            </span>
            <span className="text-slate-600 text-2xl font-normal">-</span>
            <span className={gameState.scoreB > gameState.scoreA ? 'text-rose-400' : 'text-slate-400'}>
              {gameState.scoreB}
            </span>
          </div>

          {/* Previous Sets breakdown if any */}
          {gameState.completedSets.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Rekod Set Sebelumnya:</div>
              {gameState.completedSets.map((s) => (
                <div key={s.setNumber} className="text-xs text-slate-300 flex justify-between px-2">
                  <span>Set {s.setNumber}:</span>
                  <span className="font-semibold text-slate-200">
                    {s.scoreA} - {s.scoreB} ({s.winner === 'A' ? gameState.teamA.name : gameState.teamB.name})
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Masa: {formatTime(gameState.secondsElapsed)}</span>
          </div>
        </div>

        {/* Buttons (M3 Pills) */}
        <div className="flex flex-col gap-2.5">
          {!isMatchOver ? (
            <button
              onClick={onNextSet}
              className="w-full py-3.5 px-5 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Mula Set {gameState.currentSet + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onResetMatch}
              className="w-full py-3.5 px-5 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Perlawanan Seterusnya (Reset Penuh)</span>
            </button>
          )}

          {!isMatchOver && (
            <button
              onClick={onResetMatch}
              className="w-full py-2.5 px-4 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.06] font-medium text-xs transition cursor-pointer"
            >
              Tamatkan & Mula Perlawanan Baharu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
