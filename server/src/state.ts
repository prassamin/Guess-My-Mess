export const gameTimers = new Map<string, NodeJS.Timeout>();
export const activeSockets = new Map<string, Map<string, Set<any>>>();

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
