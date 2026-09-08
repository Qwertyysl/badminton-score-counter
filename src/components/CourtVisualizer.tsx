import React from 'react';
import { GameState } from '../types';

interface CourtVisualizerProps {
  gameState: GameState;
  onSelectServer?: (team: 'A' | 'B') => void;
}

export const CourtVisualizer: React.FC<CourtVisualizerProps> = ({ gameState, onSelectServer }) => {
  const { 
    teamA, 
    teamB, 
    scoreA, 
    scoreB, 
    serverTeam, 
    teamAPosition, 
    matchType 
  } = gameState;

  // Determine which side is Team A and Team B
  const leftTeam = teamAPosition === 'left' ? teamA : teamB;
  const rightTeam = teamAPosition === 'left' ? teamB : teamA;
  const leftScore = teamAPosition === 'left' ? scoreA : scoreB;
  const rightScore = teamAPosition === 'left' ? scoreB : scoreA;
  const leftIsTeamA = teamAPosition === 'left';

  const isLeftServer = (serverTeam === 'A' && leftIsTeamA) || (serverTeam === 'B' && !leftIsTeamA);
  const serverScore = serverTeam === 'A' ? scoreA : scoreB;
  const isServerScoreEven = serverScore % 2 === 0;

  // Position of server:
  // If Left team serves:
  //   Even score -> Bottom-left box (Right court of left team)
  //   Odd score -> Top-left box (Left court of left team)
  // If Right team serves:
  //   Even score -> Top-right box (Right court of right team)
  //   Odd score -> Bottom-right box (Left court of right team)
  const isServerTopLeft = isLeftServer && !isServerScoreEven;
  const isServerBottomLeft = isLeftServer && isServerScoreEven;
  const isServerTopRight = !isLeftServer && isServerScoreEven;
  const isServerBottomRight = !isLeftServer && !isServerScoreEven;

  // Receiver diagonal
  const isReceiverTopLeft = isServerBottomRight;
  const isReceiverBottomLeft = isServerTopRight;
  const isReceiverTopRight = isServerBottomLeft;
  const isReceiverBottomRight = isServerTopLeft;

  const serverTeamName = serverTeam === 'A' ? teamA.name : teamB.name;
  const serverCourtText = isServerScoreEven ? 'Petak Kanan (Genap)' : 'Petak Kiri (Ganjil)';

  return (
    <div className="w-full bg-[#1b1e26] border border-white/[0.08] rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-md transition-all">
      {/* M3 Header bar for court */}
      <div className="flex items-center justify-between gap-1.5 text-xs mb-1.5 px-0.5 min-w-0">
        <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <div className="flex items-center gap-1 truncate text-[10px] sm:text-xs min-w-0">
            <span className="text-slate-400 font-medium shrink-0">Servis:</span>
            <span className="text-amber-300 font-bold truncate max-w-[90px] xs:max-w-[130px] sm:max-w-none">{serverTeamName}</span>
            <span className="hidden xs:inline text-slate-500 shrink-0">•</span>
            <span className="text-slate-400 hidden xs:inline truncate">{serverCourtText}</span>
          </div>
        </div>

        {onSelectServer && (
          <button
            onClick={() => onSelectServer(serverTeam === 'A' ? 'B' : 'A')}
            className="px-2 py-0.5 sm:py-1 rounded-full bg-[#262a36] hover:bg-[#323746] text-amber-300 hover:text-amber-200 border border-white/[0.08] text-[9px] sm:text-[11px] font-semibold transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
            title="Tukar giliran servis"
          >
            <span className="hidden xs:inline">Tukar Servis</span>
            <span className="xs:hidden">Servis</span>
            <span className="text-[10px]">⇄</span>
          </button>
        )}
      </div>

      {/* SVG Court Graphic */}
      <div className="relative w-full h-20 sm:h-26 bg-[#0e4834] rounded-xl border border-emerald-400/30 overflow-hidden shadow-inner flex items-center justify-center select-none">
        <svg 
          viewBox="0 0 400 160" 
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Green Court background */}
          <rect x="0" y="0" width="400" height="160" fill="#0d523a" />

          {/* Outer Boundary */}
          <rect x="15" y="10" width="370" height="140" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.85" />

          {/* Singles Sidelines */}
          <line x1="15" y1="22" x2="385" y2="22" stroke="#ffffff" strokeWidth="1.2" opacity="0.65" />
          <line x1="15" y1="138" x2="385" y2="138" stroke="#ffffff" strokeWidth="1.2" opacity="0.65" />

          {/* Doubles Long Service Lines */}
          <line x1="38" y1="10" x2="38" y2="150" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
          <line x1="362" y1="10" x2="362" y2="150" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />

          {/* Short Service Lines */}
          <line x1="155" y1="10" x2="155" y2="150" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
          <line x1="245" y1="10" x2="245" y2="150" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />

          {/* Center Lines */}
          <line x1="15" y1="80" x2="155" y2="80" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
          <line x1="245" y1="80" x2="385" y2="80" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />

          {/* The NET */}
          <rect x="198" y="4" width="4" height="152" fill="#f1f5f9" />
          <line x1="200" y1="4" x2="200" y2="156" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />

          {/* Diagonal Service Line Arrow Indicator */}
          {isLeftServer ? (
            <path
              d={
                isServerBottomLeft
                  ? "M 100 115 Q 200 80 300 45"
                  : "M 100 45 Q 200 80 300 115"
              }
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="5,3"
              className="animate-pulse"
            />
          ) : (
            <path
              d={
                isServerTopRight
                  ? "M 300 45 Q 200 80 100 115"
                  : "M 300 115 Q 200 80 100 45"
              }
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="5,3"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* Team labels */}
        <div className="absolute left-2.5 top-1.5 text-[9px] sm:text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full pointer-events-none backdrop-blur-xs">
          {leftTeam.name} ({leftScore})
        </div>

        <div className="absolute right-2.5 top-1.5 text-[9px] sm:text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full pointer-events-none backdrop-blur-xs">
          {rightTeam.name} ({rightScore})
        </div>

        <div className="absolute top-1 text-[8px] font-bold text-slate-300 bg-slate-900/90 px-1.5 py-0.2 rounded-full border border-white/10 pointer-events-none">
          JARING
        </div>

        {/* 4 Interactive Service Boxes with M3 rounded styling */}
        {/* Box: Top Left */}
        <div 
          onClick={() => onSelectServer && onSelectServer(leftIsTeamA ? 'A' : 'B')}
          className={`absolute left-[10%] top-[12%] w-[25%] h-[36%] rounded-lg flex items-center justify-center transition cursor-pointer ${
            isServerTopLeft 
              ? 'bg-amber-400/40 border-2 border-amber-300 shadow-md shadow-amber-950/40' 
              : isReceiverTopLeft 
                ? 'bg-sky-400/25 border border-dashed border-sky-300' 
                : 'hover:bg-white/10'
          }`}
        >
          {isServerTopLeft && (
            <div className="flex flex-col items-center">
              <span className="text-sm sm:text-base leading-none">🏸</span>
              <span className="text-[8px] font-extrabold text-amber-200 bg-black/70 px-1.5 py-0.2 rounded-full mt-0.5">
                SERVE
              </span>
            </div>
          )}
          {isReceiverTopLeft && (
            <span className="text-[8px] font-bold text-sky-200 bg-black/60 px-1.5 py-0.2 rounded-full">
              TERIMA
            </span>
          )}
        </div>

        {/* Box: Bottom Left */}
        <div 
          onClick={() => onSelectServer && onSelectServer(leftIsTeamA ? 'A' : 'B')}
          className={`absolute left-[10%] bottom-[12%] w-[25%] h-[36%] rounded-lg flex items-center justify-center transition cursor-pointer ${
            isServerBottomLeft 
              ? 'bg-amber-400/40 border-2 border-amber-300 shadow-md shadow-amber-950/40' 
              : isReceiverBottomLeft 
                ? 'bg-sky-400/25 border border-dashed border-sky-300' 
                : 'hover:bg-white/10'
          }`}
        >
          {isServerBottomLeft && (
            <div className="flex flex-col items-center">
              <span className="text-sm sm:text-base leading-none">🏸</span>
              <span className="text-[8px] font-extrabold text-amber-200 bg-black/70 px-1.5 py-0.2 rounded-full mt-0.5">
                SERVE
              </span>
            </div>
          )}
          {isReceiverBottomLeft && (
            <span className="text-[8px] font-bold text-sky-200 bg-black/60 px-1.5 py-0.2 rounded-full">
              TERIMA
            </span>
          )}
        </div>

        {/* Box: Top Right */}
        <div 
          onClick={() => onSelectServer && onSelectServer(leftIsTeamA ? 'B' : 'A')}
          className={`absolute right-[10%] top-[12%] w-[25%] h-[36%] rounded-lg flex items-center justify-center transition cursor-pointer ${
            isServerTopRight 
              ? 'bg-amber-400/40 border-2 border-amber-300 shadow-md shadow-amber-950/40' 
              : isReceiverTopRight 
                ? 'bg-sky-400/25 border border-dashed border-sky-300' 
                : 'hover:bg-white/10'
          }`}
        >
          {isServerTopRight && (
            <div className="flex flex-col items-center">
              <span className="text-sm sm:text-base leading-none">🏸</span>
              <span className="text-[8px] font-extrabold text-amber-200 bg-black/70 px-1.5 py-0.2 rounded-full mt-0.5">
                SERVE
              </span>
            </div>
          )}
          {isReceiverTopRight && (
            <span className="text-[8px] font-bold text-sky-200 bg-black/60 px-1.5 py-0.2 rounded-full">
              TERIMA
            </span>
          )}
        </div>

        {/* Box: Bottom Right */}
        <div 
          onClick={() => onSelectServer && onSelectServer(leftIsTeamA ? 'B' : 'A')}
          className={`absolute right-[10%] bottom-[12%] w-[25%] h-[36%] rounded-lg flex items-center justify-center transition cursor-pointer ${
            isServerBottomRight 
              ? 'bg-amber-400/40 border-2 border-amber-300 shadow-md shadow-amber-950/40' 
              : isReceiverBottomRight 
                ? 'bg-sky-400/25 border border-dashed border-sky-300' 
                : 'hover:bg-white/10'
          }`}
        >
          {isServerBottomRight && (
            <div className="flex flex-col items-center">
              <span className="text-sm sm:text-base leading-none">🏸</span>
              <span className="text-[8px] font-extrabold text-amber-200 bg-black/70 px-1.5 py-0.2 rounded-full mt-0.5">
                SERVE
              </span>
            </div>
          )}
          {isReceiverBottomRight && (
            <span className="text-[8px] font-bold text-sky-200 bg-black/60 px-1.5 py-0.2 rounded-full">
              TERIMA
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
        <span>Petak {isServerScoreEven ? 'Ganjil' : 'Genap'}</span>
        <span className="text-emerald-400/90 font-medium">
          {matchType === 'doubles' ? 'Beregu' : 'Perseorangan'}
        </span>
        <span>Petak {isServerScoreEven ? 'Genap' : 'Ganjil'}</span>
      </div>
    </div>
  );
};

