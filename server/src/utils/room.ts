import { RoomState } from "../types";

export const calculateTTL = (room: RoomState | null) => {
  if (!room?.settings) return 7200;
  const p = room.settings.maxPlayers || 8;
  const r = room.settings.rounds || 3;
  const d = room.settings.drawTime || 80;
  return p * r * d + 1800;
};
