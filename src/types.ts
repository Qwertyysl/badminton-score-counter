export type MatchType = 'singles' | 'doubles';
export type TargetPoints = 15 | 21;
export type TeamId = 'A' | 'B';

export interface Player {
  id: string;
  name: string;
}

export interface Team {
  id: TeamId;
  name: string;
  color: string;
  players: [string, string?]; // 1 player for singles, 2 for doubles
}

export interface SetRecord {
  setNumber: number;
  scoreA: number;
  scoreB: number;
  winner: TeamId;
  durationSeconds: number;
}

export interface GameState {
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  matchType: MatchType;
  targetPoints: TargetPoints;
  setsToWin: number; // 1 (single set) or 2 (best of 3)
  setsWonA: number;
  setsWonB: number;
  currentSet: number;
  completedSets: SetRecord[];
  
  // Serving status
  serverTeam: TeamId;
  // For singles: player index is 0. For doubles: which player index (0 or 1) is currently serving
  serverPlayerIndexA: number; // 0 or 1
  serverPlayerIndexB: number; // 0 or 1
  
  // Court sides: which side Team A is on ('left' | 'right')
  teamAPosition: 'left' | 'right';
  
  // Timer
  secondsElapsed: number;
  isTimerRunning: boolean;
  
  // Game state flags
  isGameOver: boolean;
  matchWinner: TeamId | null;
  setWinner: TeamId | null;
  isInterval?: boolean;
}

export interface HistoryItem {
  scoreA: number;
  scoreB: number;
  serverTeam: TeamId;
  serverPlayerIndexA: number;
  serverPlayerIndexB: number;
  secondsElapsed: number;
  completedSets: SetRecord[];
  setsWonA: number;
  setsWonB: number;
  currentSet: number;
  teamAPosition: 'left' | 'right';
}
