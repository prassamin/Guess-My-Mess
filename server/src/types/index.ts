export type Player = {
  id: string;
  name: string;
  avatar: string;
  score: number;
  lastRoundPoints?: number;
  db_player_id?: string;
};

export type RoomState = {
  id: string;
  db_game_id?: string;
  hostId: string;
  status: "waiting" | "playing" | "finished";
  lastActivity?: number;
  settings?: {
    maxPlayers: number;
    rounds: number;
    drawTime: number;
    wordCount?: number;
    customWords?: string;
    customWordsOnly?: boolean;
    [key: string]: any;
  };
  players: Player[];
  abandonedPlayers?: Player[];
  kickVotes?: Record<string, string[]>;
  kickVotesNo?: Record<string, string[]>;
  serverMutedUsers?: string[];
  gameState?: {
    currentRound: number;
    currentTurnIndex: number;
    phase: "choosing" | "drawing" | "round_end";
    turnEndTime: number;
    guessedCorrectly: string[];
    wordLength: number;

    serverOnlyCurrentWord?: string;
    serverOnlyWordChoices?: string[];
    serverOnlyGuessedTimes?: Record<string, number>;
    serverOnlyHintIndices?: number[];
    lastSentHint?: string;
  };
};
