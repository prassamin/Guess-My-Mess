export const gameTimers = new Map<string, NodeJS.Timeout>();
export const activeSockets = new Map<string, Map<string, Set<any>>>();
export const activeDrawers = new Map<string, string>(); // roomId -> drawerId
export const roomCache = new Map<string, any>(); // roomId -> RoomState
export const startingRooms = new Set<string>(); // rooms currently being started (lock)
export const kickedUsers = new Set<string>(); // "roomId:userId" of kicked players

export let appServer: any = null;

export function setAppServer(server: any) {
  appServer = server;
}

export function clearGameTimer(roomId: string) {
  if (gameTimers.has(roomId)) {
    clearTimeout(gameTimers.get(roomId));
    gameTimers.delete(roomId);
  }
}
