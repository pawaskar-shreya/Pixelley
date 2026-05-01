export interface User {
  id: string;
  username: string;
  name: string;
  avatarId: string;
  gender: 'Female' | 'Male';
}

export interface PlayerState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GameState {
  players: Record<string, PlayerState>;
}

export interface Avatar {
  id: string;
  name: string;
  idleUrl: string;
}

export interface Space {
  id: string;
  name: string;
  width: string;
  height: string;
  tilemapUrl: string;
  thumbnail: string;
}

export interface Element {
  id: string;
  spaceId: string;
  imageUrl: string;
  width: number;
  height: number;
  isCollidable: boolean;
}

export interface SpaceElement {
  id: string;
  element: Element;
  x: number;
  y: number;
}

export interface SpaceData {
  width: string;
  height: string;
  elements: SpaceElement[];
}
