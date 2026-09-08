/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Undo2,
  Settings,
  BookOpen,
  Volume2,
  VolumeX,
  ArrowLeftRight,
  Trophy,
  Flame,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Megaphone,
} from 'lucide-react';
import { GameState, HistoryItem, MatchType, SetRecord, TargetPoints, TeamId } from './types';
import { sounds } from './utils/audio';
import { tts, TTSMode } from './utils/tts';
import { RulesBookModal } from './components/RulesBookModal';
import { CourtVisualizer } from './components/CourtVisualizer';
import { MatchSettingsModal } from './components/MatchSettingsModal';
import { GameWonModal } from './components/GameWonModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';

const INITIAL_STATE: GameState = {
  teamA: {
    id: 'A',
    name: 'Team A',
    color: '#2563eb',
    players: ['Pemain 1'],
  },
  teamB: {
    id: 'B',
    name: 'Team B',
    color: '#e11d48',
    players: ['Pemain 1'],
  },
  scoreA: 0,
  scoreB: 0,
  matchType: 'singles',
  targetPoints: 21,
  setsToWin: 2, // Best of 3
  setsWonA: 0,
  setsWonB: 0,
  currentSet: 1,
  completedSets: [],
  serverTeam: 'A',
  serverPlayerIndexA: 0,
  serverPlayerIndexB: 0,
  teamAPosition: 'left',
  secondsElapsed: 0,
  isTimerRunning: false,
  isGameOver: false,
  matchWinner: null,
  setWinner: null,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('badminton_counter_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Don't auto-run timer on load
        return { ...parsed, isTimerRunning: false };
      } catch {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCourtVisualizer, setShowCourtVisualizer] = useState<boolean>(true);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState<boolean>(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  // Close settings dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setIsSettingsDropdownOpen(false);
      }
    }
    if (isSettingsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsDropdownOpen]);

  // Free TTS in Malay settings
  const [ttsMode, setTtsMode] = useState<TTSMode>(() => {
    return (localStorage.getItem('badminton_tts_mode') as TTSMode) || 'auto';
  });
  const [ttsAnnounceButtons, setTtsAnnounceButtons] = useState<boolean>(() => {
    return localStorage.getItem('badminton_tts_buttons') !== 'false';
  });

  const timerRef = useRef<number | null>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('badminton_counter_state', JSON.stringify(gameState));
  }, [gameState]);

  // Sync TTS settings
  useEffect(() => {
    tts.options.mode = ttsMode;
    tts.options.announceButtons = ttsAnnounceButtons;
    localStorage.setItem('badminton_tts_mode', ttsMode);
    localStorage.setItem('badminton_tts_buttons', String(ttsAnnounceButtons));
  }, [ttsMode, ttsAnnounceButtons]);

  // Sync sound settings
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Stopwatch timer logic
  useEffect(() => {
    if (gameState.isTimerRunning && !gameState.isGameOver && !gameState.setWinner) {
      timerRef.current = window.setInterval(() => {
        setGameState((prev) => ({
          ...prev,
          secondsElapsed: prev.secondsElapsed + 1,
        }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.isTimerRunning, gameState.isGameOver, gameState.setWinner]);

  // Format seconds into MM:SS or HH:MM:SS
  const formatTime = useCallback((totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }, []);

  // Check if a point is a set-winning point
  const checkSetWin = (scoreA: number, scoreB: number, target: TargetPoints): TeamId | null => {
    const maxScore = target === 21 ? 30 : 21;
    const deuceThreshold = target === 21 ? 20 : 14;

    // Golden point cap
    if (scoreA >= maxScore) return 'A';
    if (scoreB >= maxScore) return 'B';

    // Standard win or win by 2 after deuce
    if (scoreA >= target && scoreA - scoreB >= 2) return 'A';
    if (scoreB >= target && scoreB - scoreA >= 2) return 'B';

    return null;
  };

  // Helper to check for game/match point status
  const getGameStatusText = () => {
    const { scoreA, scoreB, targetPoints, setsWonA, setsWonB, setsToWin } = gameState;
    const deuceThreshold = targetPoints === 21 ? 20 : 14;
    const maxScore = targetPoints === 21 ? 30 : 21;

    if (gameState.isGameOver) return 'Perlawanan Selesai';
    if (gameState.setWinner) return 'Set Selesai';

    // Check deuce
    if (scoreA >= deuceThreshold && scoreB >= deuceThreshold && scoreA === scoreB && scoreA < maxScore - 1) {
      return 'Deuce / Setting (Beza 2 Mata)';
    }

    // Check if Team A has Game / Match Point
    const isTeamAGamePoint = 
      (scoreA >= targetPoints - 1 && scoreA > scoreB) ||
      (scoreA >= deuceThreshold && scoreA - scoreB === 1) ||
      (scoreA === maxScore - 1 && scoreB === maxScore - 1);

    // Check if Team B has Game / Match Point
    const isTeamBGamePoint = 
      (scoreB >= targetPoints - 1 && scoreB > scoreA) ||
      (scoreB >= deuceThreshold && scoreB - scoreA === 1) ||
      (scoreB === maxScore - 1 && scoreA === maxScore - 1);

    if (isTeamAGamePoint) {
      const isMatchPoint = setsWonA + 1 >= setsToWin;
      return isMatchPoint ? `🔥 Match Point untuk ${gameState.teamA.name}!` : `Game Point untuk ${gameState.teamA.name}!`;
    }

    if (isTeamBGamePoint) {
      const isMatchPoint = setsWonB + 1 >= setsToWin;
      return isMatchPoint ? `🔥 Match Point untuk ${gameState.teamB.name}!` : `Game Point untuk ${gameState.teamB.name}!`;
    }

    return null;
  };

  // Manual Trigger to announce current score in Malay clearly
  const handleManualAnnounce = () => {
    const { scoreA, scoreB, targetPoints, setsWonA, setsWonB, setsToWin } = gameState;
    const deuceThreshold = targetPoints === 21 ? 20 : 14;
    const isDeuce = scoreA >= deuceThreshold && scoreB >= deuceThreshold && scoreA === scoreB;
    const isGamePointA = (scoreA >= targetPoints - 1 && scoreA > scoreB) || (scoreA >= deuceThreshold && scoreA - scoreB === 1);
    const isGamePointB = (scoreB >= targetPoints - 1 && scoreB > scoreA) || (scoreB >= deuceThreshold && scoreB - scoreA === 1);
    const isMatchPointA = isGamePointA && setsWonA + 1 >= setsToWin;
    const isMatchPointB = isGamePointB && setsWonB + 1 >= setsToWin;

    tts.announceScore(
      scoreA,
      scoreB,
      gameState.teamA.name,
      gameState.teamB.name,
      gameState.serverTeam,
      isGamePointA || isGamePointB,
      isMatchPointA || isMatchPointB,
      isDeuce,
      true // Force speak manually
    );
  };

  // Test TTS function
  const handleTestTTS = () => {
    tts.speak('Ujian suara pengadil badminton. Satu, kosong. Servis bersedia.', true);
  };

  // Record history snapshot before mutating
  const pushHistory = (state: GameState) => {
    setHistory((prev) => [
      ...prev.slice(-25), // keep last 25 states
      {
        scoreA: state.scoreA,
        scoreB: state.scoreB,
        serverTeam: state.serverTeam,
        serverPlayerIndexA: state.serverPlayerIndexA,
        serverPlayerIndexB: state.serverPlayerIndexB,
        secondsElapsed: state.secondsElapsed,
        completedSets: [...state.completedSets],
        setsWonA: state.setsWonA,
        setsWonB: state.setsWonB,
        currentSet: state.currentSet,
        teamAPosition: state.teamAPosition,
      },
    ]);
  };

  // Add point to Team A or B
  const addPoint = (scoringTeam: TeamId) => {
    if (gameState.isGameOver || gameState.setWinner) return;

    pushHistory(gameState);

    const newScoreA = scoringTeam === 'A' ? gameState.scoreA + 1 : gameState.scoreA;
    const newScoreB = scoringTeam === 'B' ? gameState.scoreB + 1 : gameState.scoreB;
    const target = gameState.targetPoints;
    const serverTeam = scoringTeam;

    // Check if this point wins the set
    const wonBy = checkSetWin(newScoreA, newScoreB, target);

    if (wonBy) {
      sounds.playWin();
      const newSetsWonA = wonBy === 'A' ? gameState.setsWonA + 1 : gameState.setsWonA;
      const newSetsWonB = wonBy === 'B' ? gameState.setsWonB + 1 : gameState.setsWonB;
      const isMatchOver = newSetsWonA >= gameState.setsToWin || newSetsWonB >= gameState.setsToWin;
      const winnerName = wonBy === 'A' ? gameState.teamA.name : gameState.teamB.name;

      if (ttsMode === 'auto') {
        if (isMatchOver) {
          tts.speak(`Perlawanan tamat! Tahniah, ${winnerName} muncul juara perlawanan!`, true);
        } else {
          tts.speak(`Set tamat! ${winnerName} memenangi set ${gameState.currentSet} dengan skor ${newScoreA} berbalas ${newScoreB}.`, true);
        }
      }

      setGameState((prev) => ({
        ...prev,
        scoreA: newScoreA,
        scoreB: newScoreB,
        serverTeam,
        isTimerRunning: false,
        setWinner: wonBy,
        isGameOver: isMatchOver,
        matchWinner: isMatchOver ? wonBy : null,
        setsWonA: newSetsWonA,
        setsWonB: newSetsWonB,
      }));
      return;
    }

    // Audio feedback: Check if it's game point or normal point
    const deuceThreshold = target === 21 ? 20 : 14;
    const isNearWin = 
      (newScoreA >= target - 1 && newScoreA > newScoreB) ||
      (newScoreB >= target - 1 && newScoreB > newScoreA) ||
      (newScoreA >= deuceThreshold && Math.abs(newScoreA - newScoreB) === 1);
    
    const isMatchPoint = 
      (scoringTeam === 'A' && gameState.setsWonA + 1 >= gameState.setsToWin && isNearWin) ||
      (scoringTeam === 'B' && gameState.setsWonB + 1 >= gameState.setsToWin && isNearWin);

    const isDeuce = newScoreA >= deuceThreshold && newScoreB >= deuceThreshold && newScoreA === newScoreB;

    if (isNearWin) {
      sounds.playGamePoint();
    } else {
      sounds.playPoint();
    }

    // DIRECT TTS TRIGGER: In auto mode, immediately speak the score upon adding point!
    if (ttsMode === 'auto') {
      tts.announceScore(
        newScoreA, 
        newScoreB, 
        gameState.teamA.name, 
        gameState.teamB.name, 
        serverTeam, 
        isNearWin, 
        isMatchPoint, 
        isDeuce,
        true // force speak immediately
      );
    } else if (ttsAnnounceButtons) {
      const teamName = scoringTeam === 'A' ? gameState.teamA.name : gameState.teamB.name;
      tts.announceAction(`Tambah satu mata untuk ${teamName}`);
    }

    setGameState((prev) => ({
      ...prev,
      scoreA: newScoreA,
      scoreB: newScoreB,
      serverTeam,
      isTimerRunning: true,
    }));
  };

  // Deduct point (quick minus)
  const minusPoint = (team: TeamId) => {
    if (gameState.isGameOver || gameState.setWinner) return;

    if (team === 'A' && gameState.scoreA <= 0) return;
    if (team === 'B' && gameState.scoreB <= 0) return;

    pushHistory(gameState);
    sounds.playUndo();

    const teamName = team === 'A' ? gameState.teamA.name : gameState.teamB.name;
    const newScoreA = team === 'A' ? Math.max(0, gameState.scoreA - 1) : gameState.scoreA;
    const newScoreB = team === 'B' ? Math.max(0, gameState.scoreB - 1) : gameState.scoreB;

    if (ttsMode === 'auto') {
      tts.speak(`Tolak satu mata ${teamName}. Skor ${newScoreA}, ${newScoreB}.`, true);
    } else if (ttsAnnounceButtons) {
      tts.announceAction(`Tolak satu mata ${teamName}`);
    }

    setGameState((prev) => ({
      ...prev,
      scoreA: newScoreA,
      scoreB: newScoreB,
    }));
  };

  // Undo last action
  const handleUndo = () => {
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    sounds.playUndo();

    if (ttsMode === 'auto') {
      tts.speak(`Buat asal skor. ${gameState.teamA.name} ${previous.scoreA}, ${gameState.teamB.name} ${previous.scoreB}.`);
    } else if (ttsAnnounceButtons) {
      tts.announceAction('Buat asal skor');
    }

    setGameState((prev) => ({
      ...prev,
      scoreA: previous.scoreA,
      scoreB: previous.scoreB,
      serverTeam: previous.serverTeam,
      serverPlayerIndexA: previous.serverPlayerIndexA,
      serverPlayerIndexB: previous.serverPlayerIndexB,
      completedSets: previous.completedSets,
      setsWonA: previous.setsWonA,
      setsWonB: previous.setsWonB,
      currentSet: previous.currentSet,
      teamAPosition: previous.teamAPosition,
      isGameOver: false,
      setWinner: null,
      matchWinner: null,
    }));
  };

  // Switch server manually
  const handleToggleServer = (specificTeam?: TeamId) => {
    pushHistory(gameState);
    sounds.playPoint();
    const newServer = specificTeam || (gameState.serverTeam === 'A' ? 'B' : 'A');
    const newServerName = newServer === 'A' ? gameState.teamA.name : gameState.teamB.name;
    const serverScore = newServer === 'A' ? gameState.scoreA : gameState.scoreB;
    const courtSide = serverScore % 2 === 0 ? 'Petak Kanan' : 'Petak Kiri';

    if (ttsAnnounceButtons || ttsMode === 'auto') {
      tts.speak(`Tukar servis kepada ${newServerName}, ${courtSide}.`);
    }

    setGameState((prev) => ({
      ...prev,
      serverTeam: newServer,
    }));
  };

  // Swap ends (Tukar Gelanggang)
  const handleSwapEnds = () => {
    pushHistory(gameState);
    sounds.playPoint();
    if (ttsAnnounceButtons || ttsMode === 'auto') {
      tts.speak('Tukar gelanggang.');
    }
    setGameState((prev) => ({
      ...prev,
      teamAPosition: prev.teamAPosition === 'left' ? 'right' : 'left',
    }));
  };

  // Advance to next set
  const handleNextSet = () => {
    if (!gameState.setWinner) return;

    const completedRecord: SetRecord = {
      setNumber: gameState.currentSet,
      scoreA: gameState.scoreA,
      scoreB: gameState.scoreB,
      winner: gameState.setWinner,
      durationSeconds: gameState.secondsElapsed,
    };

    const nextSetNumber = gameState.currentSet + 1;
    if (ttsAnnounceButtons || ttsMode === 'auto') {
      tts.speak(`Mula set ke-${nextSetNumber}. Kosong sama. Servis bersedia.`);
    }

    setGameState((prev) => ({
      ...prev,
      scoreA: 0,
      scoreB: 0,
      currentSet: nextSetNumber,
      completedSets: [...prev.completedSets, completedRecord],
      // Swap ends at end of set
      teamAPosition: prev.teamAPosition === 'left' ? 'right' : 'left',
      // Winner of previous set serves first in next set
      serverTeam: prev.setWinner || 'A',
      setWinner: null,
      isGameOver: false,
      isTimerRunning: true,
    }));
    setHistory([]);
  };

  // Reset current set only (0-0)
  const handleResetCurrentSet = () => {
    pushHistory(gameState);
    sounds.playUndo();
    if (ttsAnnounceButtons || ttsMode === 'auto') {
      tts.speak('Skor set semasa diset semula. Kosong sama.');
    }
    setGameState((prev) => ({
      ...prev,
      scoreA: 0,
      scoreB: 0,
      isGameOver: false,
      setWinner: null,
      matchWinner: null,
    }));
  };

  // Reset entire match
  const handleResetMatch = () => {
    sounds.playWhistle();
    if (ttsAnnounceButtons || ttsMode === 'auto') {
      tts.speak('Perlawanan baharu dimulakan. Kosong sama. Servis bersedia.');
    }
    setGameState((prev) => ({
      ...INITIAL_STATE,
      teamA: prev.teamA,
      teamB: prev.teamB,
      targetPoints: prev.targetPoints,
      matchType: prev.matchType,
      setsToWin: prev.setsToWin,
    }));
    setHistory([]);
  };

  // Toggle timer play / pause
  const toggleTimer = () => {
    const willRun = !gameState.isTimerRunning;
    if (ttsAnnounceButtons) {
      tts.announceAction(willRun ? 'Pemasa perlawanan diteruskan' : 'Pemasa perlawanan dijeda');
    }
    setGameState((prev) => ({
      ...prev,
      isTimerRunning: willRun,
    }));
  };

  // Reset timer
  const resetTimer = () => {
    if (ttsAnnounceButtons) {
      tts.announceAction('Pemasa diset semula');
    }
    setGameState((prev) => ({
      ...prev,
      secondsElapsed: 0,
      isTimerRunning: false,
    }));
  };

  // Fast target points toggle (15 <-> 21)
  const handleToggleTargetPoints = (target: TargetPoints) => {
    pushHistory(gameState);
    if (ttsAnnounceButtons) {
      tts.announceAction(`Format ${target} mata dipilih`);
    }
    setGameState((prev) => ({
      ...prev,
      targetPoints: target,
    }));
  };

  // Keyboard shortcuts (Space/A for Team A, B/L for Team B, U for Undo, P for Pause, S for Sebut)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        addPoint('A');
      } else if (e.key === 'b' || e.key === 'B' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        addPoint('B');
      } else if (e.key === 'u' || e.key === 'U' || (e.ctrlKey && e.key === 'z')) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        toggleTimer();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleManualAnnounce();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Calculate court side for serving team
  const serverScore = gameState.serverTeam === 'A' ? gameState.scoreA : gameState.scoreB;
  const isServerScoreEven = serverScore % 2 === 0;
  const serverCourtSide = isServerScoreEven ? 'Petak Kanan (Skor Genap)' : 'Petak Kiri (Skor Ganjil)';

  // Left vs Right display mapping according to teamAPosition
  const isTeamALeft = gameState.teamAPosition === 'left';
  const leftTeamId: TeamId = isTeamALeft ? 'A' : 'B';
  const rightTeamId: TeamId = isTeamALeft ? 'B' : 'A';
  const leftTeam = isTeamALeft ? gameState.teamA : gameState.teamB;
  const rightTeam = isTeamALeft ? gameState.teamB : gameState.teamA;
  const leftScore = isTeamALeft ? gameState.scoreA : gameState.scoreB;
  const rightScore = isTeamALeft ? gameState.scoreB : gameState.scoreA;
  const leftSetsWon = isTeamALeft ? gameState.setsWonA : gameState.setsWonB;
  const rightSetsWon = isTeamALeft ? gameState.setsWonB : gameState.setsWonA;
  const isLeftServer = gameState.serverTeam === leftTeamId;
  const isRightServer = gameState.serverTeam === rightTeamId;

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#e2e8f0] flex flex-col font-sans select-none antialiased">
      {/* Material 3 Top App Bar */}
      <header className="bg-[#16181f]/95 border-b border-white/[0.08] backdrop-blur-md px-2.5 sm:px-5 py-2 sm:py-2.5 shrink-0 z-20 sticky top-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Brand & Match Details */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center text-xs sm:text-base shadow-sm shrink-0">
              🏸
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <h1 className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight text-white truncate">
                  Badminton Counter
                </h1>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#242833] text-teal-300 border border-white/[0.06] shrink-0">
                  Set {gameState.currentSet}
                  <span className="hidden sm:inline">
                    {gameState.setsToWin > 1 && ` drp ${gameState.setsToWin === 2 ? '3' : gameState.setsToWin}`}
                  </span>
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                <span className="truncate">{gameState.matchType === 'doubles' ? 'Beregu' : 'Perseorangan'}</span>
                <span>•</span>
                {/* 15 vs 21 M3 Segmented Pill */}
                <div className="inline-flex rounded-full bg-[#101217] p-0.5 border border-white/[0.08]">
                  <button
                    onClick={() => handleToggleTargetPoints(21)}
                    className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold transition cursor-pointer ${
                      gameState.targetPoints === 21
                        ? 'bg-teal-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    21
                  </button>
                  <button
                    onClick={() => handleToggleTargetPoints(15)}
                    className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold transition cursor-pointer ${
                      gameState.targetPoints === 15
                        ? 'bg-teal-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    15
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Center Match Stopwatch (M3 Assist Chip) */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-[#1b1e26] border border-white/[0.08] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-inner shrink-0">
            <button
              onClick={toggleTimer}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer ${
                gameState.isTimerRunning
                  ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                  : 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30'
              }`}
              title={gameState.isTimerRunning ? 'Jeda Masa' : 'Mula Masa'}
              aria-label="Toggle Timer"
            >
              {gameState.isTimerRunning ? <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 translate-x-0.2" />}
            </button>
            <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-slate-100 score-display">
              {formatTime(gameState.secondsElapsed)}
            </span>
            <button
              onClick={resetTimer}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
              title="Reset Masa"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Right: Action Tools - Dropdown starts directly from TTS button */}
          <div className="relative shrink-0" ref={settingsDropdownRef}>
            <button
              id="header-tts-dropdown-btn"
              onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
              className={`h-7 sm:h-8.5 px-2 sm:px-3 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center gap-1 sm:gap-1.5 transition active:scale-95 cursor-pointer border shadow-xs ${
                ttsMode === 'auto'
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/35 hover:bg-teal-500/25'
                  : ttsMode === 'manual'
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35 hover:bg-indigo-500/25'
                    : 'bg-[#1b1e26] text-slate-400 border-white/[0.08] hover:bg-[#252934]'
              }`}
              title="Pilihan & Tetapan (Bermula dari TTS)"
              aria-label="Pilihan & Tetapan"
              aria-expanded={isSettingsDropdownOpen}
            >
              <Megaphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-teal-400" />
              <span className="capitalize hidden xs:inline">TTS: {ttsMode}</span>
              <span className="capitalize xs:hidden">{ttsMode === 'auto' ? 'Auto' : ttsMode === 'manual' ? 'Man' : 'Off'}</span>
              <ChevronDown
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 transition-transform duration-200 ${
                  isSettingsDropdownOpen ? 'rotate-180 text-teal-300' : ''
                }`}
              />
            </button>

            {/* Material 3 Compact Dropdown Menu */}
            {isSettingsDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 max-w-[calc(100vw-1.5rem)] bg-[#1a1d26] border border-white/[0.12] rounded-2xl shadow-2xl p-2 z-50 text-xs text-slate-200 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  {/* Dropdown Header */}
                  <div className="px-3 py-1.5 border-b border-white/[0.06] mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pilihan & Tetapan</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 font-mono">BWF</span>
                  </div>

                  {/* 1. Tetapan Penuh Perlawanan */}
                  <button
                    onClick={() => {
                      setIsSettingsDropdownOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-left transition cursor-pointer text-slate-200 hover:text-white"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-300 flex items-center justify-center shrink-0">
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs">Tetapan Perlawanan</div>
                      <div className="text-[10px] text-slate-400 truncate">Nama pemain, warna & format set</div>
                    </div>
                  </button>

                  {/* 2. Mod Suara TTS (Segmented Controls) */}
                  <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04] my-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                        <Megaphone className="w-3 h-3 text-teal-400" />
                        <span>Sebut Skor (TTS)</span>
                      </div>
                      <span className="text-[10px] font-bold text-teal-400 uppercase">
                        {ttsMode === 'auto' ? 'Automatik' : ttsMode === 'manual' ? 'Manual' : 'Senyap'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#12141a] rounded-lg border border-white/[0.04]">
                      <button
                        onClick={() => {
                          setTtsMode('auto');
                          tts.announceAction('Mod automatik aktif. Skor akan disebut setiap mata.', true);
                        }}
                        className={`py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          ttsMode === 'auto'
                            ? 'bg-teal-500 text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Auto
                      </button>
                      <button
                        onClick={() => {
                          setTtsMode('manual');
                          tts.announceAction('Mod manual aktif', true);
                        }}
                        className={`py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          ttsMode === 'manual'
                            ? 'bg-indigo-500 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Manual
                      </button>
                      <button
                        onClick={() => {
                          setTtsMode('off');
                        }}
                        className={`py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          ttsMode === 'off'
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Mati
                      </button>
                    </div>
                  </div>

                  {/* 3. Kesan Bunyi Audio (Toggle) */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.04] transition">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${soundEnabled ? 'bg-teal-500/15 text-teal-300' : 'bg-slate-800 text-slate-500'}`}>
                        {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-semibold text-xs">Kesan Bunyi Audio</div>
                        <div className="text-[10px] text-slate-400">Wisel & nada mata</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                        soundEnabled ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-white/[0.06] text-slate-500'
                      }`}
                    >
                      {soundEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* 4. Format Mata (15 vs 21) */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.04] transition">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/[0.06] text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {gameState.targetPoints}
                      </div>
                      <div>
                        <div className="font-semibold text-xs">Sasaran Mata Set</div>
                        <div className="text-[10px] text-slate-400">Piawaian 21 atau pantas 15</div>
                      </div>
                    </div>
                    <div className="inline-flex rounded-full bg-[#101217] p-0.5 border border-white/[0.08]">
                      <button
                        onClick={() => handleToggleTargetPoints(21)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                          gameState.targetPoints === 21
                            ? 'bg-teal-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        21
                      </button>
                      <button
                        onClick={() => handleToggleTargetPoints(15)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                          gameState.targetPoints === 15
                            ? 'bg-teal-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        15
                      </button>
                    </div>
                  </div>

                  {/* 5. Buku Panduan Peraturan BWF */}
                  <button
                    onClick={() => {
                      setIsSettingsDropdownOpen(false);
                      setIsRulesOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-left transition cursor-pointer text-slate-200 hover:text-white"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-300 flex items-center justify-center shrink-0">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs">Buku Peraturan BWF</div>
                      <div className="text-[10px] text-slate-400 truncate">Sistem 21 mata, deuce & servis</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-white/[0.06]" />

                  {/* 6. Reset Perlawanan */}
                  <button
                    onClick={() => {
                      setIsSettingsDropdownOpen(false);
                      setIsResetConfirmOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 text-left transition cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs">Reset Perlawanan</div>
                      <div className="text-[10px] text-rose-400/70 truncate">Set semula semua mata & pemasa</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
        </div>
      </header>

      {/* Main Single-Screen Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-2 sm:p-4 flex flex-col justify-between gap-2 sm:gap-2.5 overflow-hidden">
        {/* Material 3 Status Bar / Sets Tracker / Serving Notification */}
        <div className="bg-[#181b22] border border-white/[0.08] rounded-2xl sm:rounded-3xl px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between shadow-xs shrink-0 gap-1.5 sm:gap-2 min-w-0">
          {/* Sets Tracker with M3 tonal chips */}
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 hidden xs:inline shrink-0">Set:</span>
            <div className="flex items-center gap-1 font-bold text-[10px] sm:text-xs min-w-0">
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 truncate max-w-[65px] xs:max-w-[100px] sm:max-w-none shrink-0">
                {gameState.teamA.name}: {gameState.setsWonA}
              </span>
              <span className="text-slate-600 font-normal shrink-0">-</span>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 truncate max-w-[65px] xs:max-w-[100px] sm:max-w-none shrink-0">
                {gameState.teamB.name}: {gameState.setsWonB}
              </span>
            </div>
          </div>

          {/* Dynamic Match State Label (Deuce, Game Point, etc.) - Only if active */}
          {getGameStatusText() && (
            <div className="text-[10px] sm:text-xs font-bold text-teal-300 px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 animate-pulse text-center truncate max-w-[110px] xs:max-w-[180px] sm:max-w-none shrink-0">
              {getGameStatusText()}
            </div>
          )}

          {/* Court Visualizer Toggle Button */}
          <button
            onClick={() => setShowCourtVisualizer(!showCourtVisualizer)}
            className="px-2 sm:px-2.5 py-1 rounded-full bg-[#242833] hover:bg-[#2d3240] text-[10px] sm:text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition cursor-pointer shrink-0 border border-white/[0.06]"
          >
            <span className="hidden xs:inline">Gelanggang</span>
            <span className="xs:hidden">Gel</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showCourtVisualizer ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Compact Court Visualizer (Toggleable) */}
        {showCourtVisualizer && (
          <div className="shrink-0 transition-all">
            <CourtVisualizer gameState={gameState} onSelectServer={handleToggleServer} />
          </div>
        )}

        {/* Material 3 Big Dual Scoreboard Cards */}
        <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-4 min-h-[200px]">
          {/* Left Team Card */}
          <div
            className={`relative rounded-2xl sm:rounded-3xl border flex flex-col justify-between p-2.5 sm:p-4 transition shadow-lg overflow-hidden m3-pressable min-w-0 ${
              leftTeamId === 'A'
                ? isLeftServer
                  ? 'bg-[#162038] border-blue-500/70 shadow-blue-950/50 ring-2 ring-blue-500/20'
                  : 'bg-[#181b22] border-white/[0.08] hover:border-white/[0.15]'
                : isLeftServer
                  ? 'bg-[#2d1820] border-rose-500/70 shadow-rose-950/50 ring-2 ring-rose-500/20'
                  : 'bg-[#181b22] border-white/[0.08] hover:border-white/[0.15]'
            }`}
          >
            {/* Top Team Info & Server Badge */}
            <div className="flex items-center justify-between gap-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                <span
                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${leftTeamId === 'A' ? 'bg-blue-400' : 'bg-rose-400'}`}
                />
                <span className="font-extrabold text-xs sm:text-base md:text-lg text-white truncate min-w-0 flex-1">
                  {leftTeam.name}
                </span>
                {leftSetsWon > 0 && (
                  <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 shrink-0">
                    {leftSetsWon}S
                  </span>
                )}
              </div>

              {/* Server Indicator Pill */}
              {isLeftServer ? (
                <div className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] sm:text-[10px] font-black tracking-tight flex items-center gap-0.5 sm:gap-1 shadow-xs shrink-0 animate-pulse">
                  <span>🏸</span>
                  <span className="hidden xs:inline">SERVIS</span>
                </div>
              ) : (
                <button
                  onClick={() => handleToggleServer(leftTeamId)}
                  className="px-1.5 sm:px-2 py-0.5 rounded-full bg-[#262a36] hover:bg-[#323746] text-[9px] sm:text-[10px] text-slate-400 hover:text-white transition cursor-pointer border border-white/[0.06] shrink-0 active:scale-95 whitespace-nowrap"
                  title="Tukar giliran servis kepada pasukan ini"
                >
                  Servis
                </button>
              )}
            </div>

            {/* Serving Court Info for Left Team */}
            {isLeftServer && (
              <div className="mt-0.5 text-[9px] sm:text-[10px] font-medium text-amber-300/90 flex items-center gap-1 truncate">
                <span className="truncate">{serverCourtSide}</span>
              </div>
            )}

            {/* Giant Score Tap Zone (+1 Mata) */}
            <div
              id={`score-card-${leftTeamId}`}
              onClick={() => addPoint(leftTeamId)}
              className="flex-1 flex flex-col items-center justify-center cursor-pointer group my-0.5 sm:my-1 select-none active:scale-98 transition-transform min-h-0"
              title="Klik untuk tambah mata (+1)"
            >
              <div className="font-mono font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter text-white transition-transform group-hover:scale-105 leading-none score-display drop-shadow-md">
                {leftScore}
              </div>
              <span className="text-[9px] sm:text-xs font-semibold text-slate-400 group-hover:text-teal-300 mt-0.5 sm:mt-1 transition text-center truncate max-w-full px-1">
                Ketik untuk +1
              </span>
            </div>

            {/* Subtraction (-1) and +1 Pill Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 pt-1.5 border-t border-white/[0.08] w-full min-w-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  minusPoint(leftTeamId);
                }}
                disabled={leftScore <= 0}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#242833] hover:bg-[#2e3342] disabled:opacity-20 disabled:cursor-not-allowed border border-white/[0.08] text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center transition active:scale-90 cursor-pointer shrink-0"
                title="Tolak 1 mata (-1)"
                aria-label="Tolak 1 mata"
              >
                -1
              </button>
              <button
                onClick={() => addPoint(leftTeamId)}
                className={`flex-1 h-8 sm:h-9 px-1 sm:px-2 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-sm transition active:scale-95 cursor-pointer truncate min-w-0 ${
                  leftTeamId === 'A'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/40'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                }`}
              >
                <span>+1</span>
                <span className="hidden xs:inline">Mata</span>
              </button>
            </div>
          </div>

          {/* Right Team Card */}
          <div
            className={`relative rounded-2xl sm:rounded-3xl border flex flex-col justify-between p-2.5 sm:p-4 transition shadow-lg overflow-hidden m3-pressable min-w-0 ${
              rightTeamId === 'B'
                ? isRightServer
                  ? 'bg-[#2d1820] border-rose-500/70 shadow-rose-950/50 ring-2 ring-rose-500/20'
                  : 'bg-[#181b22] border-white/[0.08] hover:border-white/[0.15]'
                : isRightServer
                  ? 'bg-[#162038] border-blue-500/70 shadow-blue-950/50 ring-2 ring-blue-500/20'
                  : 'bg-[#181b22] border-white/[0.08] hover:border-white/[0.15]'
            }`}
          >
            {/* Top Team Info & Server Badge */}
            <div className="flex items-center justify-between gap-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                <span
                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${rightTeamId === 'B' ? 'bg-rose-400' : 'bg-blue-400'}`}
                />
                <span className="font-extrabold text-xs sm:text-base md:text-lg text-white truncate min-w-0 flex-1">
                  {rightTeam.name}
                </span>
                {rightSetsWon > 0 && (
                  <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 shrink-0">
                    {rightSetsWon}S
                  </span>
                )}
              </div>

              {/* Server Indicator Pill */}
              {isRightServer ? (
                <div className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] sm:text-[10px] font-black tracking-tight flex items-center gap-0.5 sm:gap-1 shadow-xs shrink-0 animate-pulse">
                  <span>🏸</span>
                  <span className="hidden xs:inline">SERVIS</span>
                </div>
              ) : (
                <button
                  onClick={() => handleToggleServer(rightTeamId)}
                  className="px-1.5 sm:px-2 py-0.5 rounded-full bg-[#262a36] hover:bg-[#323746] text-[9px] sm:text-[10px] text-slate-400 hover:text-white transition cursor-pointer border border-white/[0.06] shrink-0 active:scale-95 whitespace-nowrap"
                  title="Tukar giliran servis kepada pasukan ini"
                >
                  Servis
                </button>
              )}
            </div>

            {/* Serving Court Info for Right Team */}
            {isRightServer && (
              <div className="mt-0.5 text-[9px] sm:text-[10px] font-medium text-amber-300/90 flex items-center gap-1 truncate">
                <span className="truncate">{serverCourtSide}</span>
              </div>
            )}

            {/* Giant Score Tap Zone (+1 Mata) */}
            <div
              id={`score-card-${rightTeamId}`}
              onClick={() => addPoint(rightTeamId)}
              className="flex-1 flex flex-col items-center justify-center cursor-pointer group my-0.5 sm:my-1 select-none active:scale-98 transition-transform min-h-0"
              title="Klik untuk tambah mata (+1)"
            >
              <div className="font-mono font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter text-white transition-transform group-hover:scale-105 leading-none score-display drop-shadow-md">
                {rightScore}
              </div>
              <span className="text-[9px] sm:text-xs font-semibold text-slate-400 group-hover:text-teal-300 mt-0.5 sm:mt-1 transition text-center truncate max-w-full px-1">
                Ketik untuk +1
              </span>
            </div>

            {/* Subtraction (-1) and +1 Pill Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 pt-1.5 border-t border-white/[0.08] w-full min-w-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  minusPoint(rightTeamId);
                }}
                disabled={rightScore <= 0}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#242833] hover:bg-[#2e3342] disabled:opacity-20 disabled:cursor-not-allowed border border-white/[0.08] text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center transition active:scale-90 cursor-pointer shrink-0"
                title="Tolak 1 mata (-1)"
                aria-label="Tolak 1 mata"
              >
                -1
              </button>
              <button
                onClick={() => addPoint(rightTeamId)}
                className={`flex-1 h-8 sm:h-9 px-1 sm:px-2 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-sm transition active:scale-95 cursor-pointer truncate min-w-0 ${
                  rightTeamId === 'B'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/40'
                }`}
              >
                <span>+1</span>
                <span className="hidden xs:inline">Mata</span>
              </button>
            </div>
          </div>
        </div>

        {/* Material 3 Floating Bottom Action Bar (Thumb-friendly & Safe Area) */}
        <div className="bg-[#1a1d24]/95 border border-white/[0.1] rounded-2xl sm:rounded-full p-1.5 sm:p-2 shadow-2xl shrink-0 backdrop-blur-md pb-safe">
          <div className="grid grid-cols-5 gap-1 sm:gap-2 w-full items-center">
            {/* 1. Undo Button (M3 Tonal Pill) */}
            <button
              id="undo-point-btn"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="h-8 sm:h-9 px-1 sm:px-3 rounded-xl sm:rounded-full bg-[#262a36] hover:bg-[#303544] disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.08] text-slate-200 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer truncate min-w-0"
              title="Buat Asal Mata Terakhir (Keyboard: U)"
            >
              <Undo2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden xs:inline truncate">Undo</span>
              {history.length > 0 && (
                <span className="text-[9px] bg-slate-700 text-teal-300 font-extrabold px-1 py-0.2 rounded-full shrink-0">
                  {history.length}
                </span>
              )}
            </button>

            {/* 2. Tukar Gelanggang (Switch Ends) */}
            <button
              id="switch-ends-btn"
              onClick={handleSwapEnds}
              className="h-8 sm:h-9 px-1 sm:px-3 rounded-xl sm:rounded-full bg-[#262a36] hover:bg-[#303544] border border-white/[0.08] text-slate-200 text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer truncate min-w-0"
              title="Tukar kedudukan gelanggang kiri/kanan"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="hidden sm:inline truncate">Tukar Sisi</span>
              <span className="sm:hidden hidden xs:inline truncate">Sisi</span>
            </button>

            {/* 3. Tukar Servis Manual */}
            <button
              id="toggle-server-btn"
              onClick={() => handleToggleServer()}
              className="h-8 sm:h-9 px-1 sm:px-3 rounded-xl sm:rounded-full bg-[#262a36] hover:bg-[#303544] border border-white/[0.08] text-slate-200 text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer truncate min-w-0"
              title="Tukar giliran servis antara Team A dan Team B"
            >
              <span className="text-xs shrink-0">🏸</span>
              <span className="hidden sm:inline truncate">Tukar Servis</span>
              <span className="sm:hidden hidden xs:inline truncate">Servis</span>
            </button>

            {/* 4. Manual Announce Score Button (📢 Sebut Skor) */}
            <button
              id="manual-announce-score-btn"
              onClick={handleManualAnnounce}
              className="h-8 sm:h-9 px-1 sm:px-3 rounded-xl sm:rounded-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-xs truncate min-w-0"
              title="Sebut Skor Terkini dalam Bahasa Melayu (Keyboard: S)"
            >
              <Megaphone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="hidden xs:inline truncate">Sebut</span>
            </button>

            {/* 5. Reset Button (M3 Tonal Destructive Pill) */}
            <button
              id="reset-match-btn"
              onClick={() => {
                if (ttsAnnounceButtons) tts.announceAction('Pilihan reset');
                setIsResetConfirmOpen(true);
              }}
              className="h-8 sm:h-9 px-1 sm:px-3 rounded-xl sm:rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-100 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer truncate min-w-0"
              title="Pilihan Reset Skor / Perlawanan Seterusnya"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="hidden xs:inline truncate">Reset</span>
            </button>
          </div>
        </div>
      </main>

      {/* Rules Book Modal */}
      <RulesBookModal
        isOpen={isRulesOpen}
        onClose={() => {
          if (ttsAnnounceButtons) tts.announceAction('Menutup buku peraturan');
          setIsRulesOpen(false);
        }}
        activeTargetPoints={gameState.targetPoints}
      />

      {/* Match Settings Modal */}
      <MatchSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          if (ttsAnnounceButtons) tts.announceAction('Menutup tetapan');
          setIsSettingsOpen(false);
        }}
        gameState={gameState}
        onSave={(newSettings) => {
          pushHistory(gameState);
          setTtsMode(newSettings.ttsMode);
          setTtsAnnounceButtons(newSettings.ttsAnnounceButtons);
          setGameState((prev) => ({
            ...prev,
            targetPoints: newSettings.targetPoints,
            matchType: newSettings.matchType,
            setsToWin: newSettings.setsToWin,
            serverTeam: newSettings.serverTeam,
            teamA: { ...prev.teamA, name: newSettings.teamAName },
            teamB: { ...prev.teamB, name: newSettings.teamBName },
          }));
          tts.speak('Tetapan perlawanan disimpan.');
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        ttsMode={ttsMode}
        ttsAnnounceButtons={ttsAnnounceButtons}
        onTestTTS={handleTestTTS}
      />

      {/* Game / Set Won Modal */}
      <GameWonModal
        isOpen={Boolean(gameState.setWinner || gameState.isGameOver)}
        isMatchOver={gameState.isGameOver}
        winnerTeamId={gameState.matchWinner || gameState.setWinner || 'A'}
        gameState={gameState}
        onNextSet={handleNextSet}
        onResetMatch={handleResetMatch}
        formatTime={formatTime}
      />

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onResetSet={handleResetCurrentSet}
        onResetMatch={handleResetMatch}
      />
    </div>
  );
}

