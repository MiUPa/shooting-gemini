export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800;

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  radius: number;
  active: boolean;
}

export interface Bullet extends Entity {
  vx: number;
  vy: number;
  color: string;
  isPlayerBullet: boolean;
}

export interface Enemy extends Entity {
  hp: number;
  maxHp: number;
  type: string;
  lastShotTime: number;
  shotOffset: number;
}

export type GameStatus = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface GameState {
  player: {
    x: number;
    y: number;
    radius: number;
    hitRadius: number;
    speed: number;
    slowSpeed: number;
    invincible: number;
  };
  bullets: Bullet[];
  enemies: Enemy[];
  score: number;
  lives: number;
  frame: number;
  status: GameStatus;
}
