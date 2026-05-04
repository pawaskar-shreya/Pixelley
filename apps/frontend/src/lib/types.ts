export interface User {
  id: string;
  username: string;
  name: string;
  avatarId: string;
  gender: 'Female' | 'Male';
  avatar: Avatar
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
  gender: string;
  idleUrl: string;
  leftUrl: string;
  rightUrl: string;
  upUrl: string;
  downUrl: string;
}

export function avatarToKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ''); // "Black Widow" -> "blackwidow"
}

export interface Space {
  id: string;
  name: string;
  width: string;
  height: string;
  thumbnail: string;
}

export interface Element {
  id: string;
  name: string;
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
