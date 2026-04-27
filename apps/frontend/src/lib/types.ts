export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  type?: 'admin' | 'user';
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
  imageUrl: string;
  name: string;
}

export interface Space {
  id: string;
  name: string;
  dimensions: string;
  thumbnail?: string;
}

export interface Element {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  static: boolean;
}

export interface SpaceElement {
  id: string;
  element: Element;
  x: number;
  y: number;
}

export interface SpaceData {
  dimensions: string;
  elements: SpaceElement[];
}
