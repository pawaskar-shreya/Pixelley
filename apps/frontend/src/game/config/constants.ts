export const GAME_CONFIG = {
  TILE_SIZE: 32,
  PLAYER_SPEED: 128,
  COLORS: {
    // Kawaii pastel palette — matches the UI theme
    BACKGROUND: '#c9e8f5',   // soft pastel sky blue
    PLAYER: 0xa87fff,        // pastel purple (local player)
    REMOTE_PLAYER: 0xff88c2, // pastel pink (remote players)
    WALL: 0x8ecae6,          // muted pastel blue
    GROUND: 0xa8d8b9,        // soft mint green
  },
  DEPTHS: {
    GROUND: 0,
    WALLS: 10,
    SHADOWS: 20,
    PLAYERS: 30,
    UI: 100,
  }
};
