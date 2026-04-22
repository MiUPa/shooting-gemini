import { CANVAS_WIDTH, CANVAS_HEIGHT } from './types';
import type { GameState } from './types';

export const createInitialState = (): GameState => ({
  player: {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT * 0.8,
    radius: 15,
    hitRadius: 1.5,
    speed: 4.5,
    slowSpeed: 2.0,
    invincible: 60,
  },
  bullets: [],
  enemies: [],
  score: 0,
  lives: 3,
  frame: 0,
});

export const updateGameState = (
  state: GameState,
  keys: Set<string>
): GameState => {
  const nextState = { ...state, frame: state.frame + 1 };
  const { player } = nextState;

  if (player.invincible > 0) player.invincible--;

  // プレイヤーの移動
  const isSlow = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const speed = isSlow ? player.slowSpeed : player.speed;

  let dx = 0;
  let dy = 0;
  if (keys.has('ArrowLeft')) dx -= 1;
  if (keys.has('ArrowRight')) dx += 1;
  if (keys.has('ArrowUp')) dy -= 1;
  if (keys.has('ArrowDown')) dy += 1;

  if (dx !== 0 && dy !== 0) {
    const norm = Math.sqrt(2);
    dx /= norm;
    dy /= norm;
  }

  player.x = Math.max(player.radius, Math.min(CANVAS_WIDTH - player.radius, player.x + dx * speed));
  player.y = Math.max(player.radius, Math.min(CANVAS_HEIGHT - player.radius, player.y + dy * speed));

  // プレイヤーのショット
  if (keys.has('KeyZ') && nextState.frame % 5 === 0) {
    nextState.bullets.push({
      x: player.x,
      y: player.y - 10,
      vx: 0,
      vy: -12,
      radius: 3,
      active: true,
      color: '#4af',
      isPlayerBullet: true,
    });
  }

  // 弾の更新
  nextState.bullets = nextState.bullets
    .map(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy }))
    .filter(b => b.y > -20 && b.y < CANVAS_HEIGHT + 20 && b.x > -20 && b.x < CANVAS_WIDTH + 20);

  // 敵の生成
  if (nextState.frame % 80 === 0) {
    nextState.enemies.push({
      x: Math.random() * (CANVAS_WIDTH - 60) + 30,
      y: -20,
      radius: 15,
      active: true,
      hp: 6,
      maxHp: 6,
      type: 'basic',
      lastShotTime: 0,
    });
  }

  // 敵の更新と弾幕
  nextState.enemies.forEach(enemy => {
    enemy.y += 0.8;
    
    // 弾幕
    if (nextState.frame % 60 === 0) {
      const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      
      // 自機狙い 3-way (弾速を落とした)
      for (let i = -1; i <= 1; i++) {
        const angle = angleToPlayer + (i * Math.PI) / 16;
        nextState.bullets.push({
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * 2.2,
          vy: Math.sin(angle) * 2.2,
          radius: 4,
          active: true,
          color: '#f44',
          isPlayerBullet: false,
        });
      }
      
      // 円形弾 (方向数を減らし、速度も落とした)
      if (nextState.frame % 180 === 0) {
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          nextState.bullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 1.5,
            vy: Math.sin(angle) * 1.5,
            radius: 5,
            active: true,
            color: '#f84',
            isPlayerBullet: false,
          });
        }
      }
    }
  });

  // 当たり判定
  nextState.enemies = nextState.enemies.filter(enemy => {
    nextState.bullets.forEach(bullet => {
      if (bullet.isPlayerBullet && bullet.active) {
        const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
        if (dist < enemy.radius + bullet.radius) {
          enemy.hp -= 1;
          bullet.active = false;
          if (enemy.hp <= 0) nextState.score += 1000;
        }
      }
    });
    return enemy.hp > 0 && enemy.y < CANVAS_HEIGHT + 40;
  });

  // プレイヤー被弾
  if (player.invincible <= 0) {
    nextState.bullets.forEach(bullet => {
      if (!bullet.isPlayerBullet && bullet.active) {
        const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
        if (dist < player.hitRadius + bullet.radius) {
          bullet.active = false;
          nextState.lives -= 1;
          player.invincible = 120;
          player.x = CANVAS_WIDTH / 2;
          player.y = CANVAS_HEIGHT * 0.8;
        }
      }
    });
  }
  
  nextState.bullets = nextState.bullets.filter(b => b.active);

  return nextState;
};

export const drawGame = (ctx: CanvasRenderingContext2D, state: GameState) => {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 背景の星（簡易）
  ctx.fillStyle = '#333';
  for (let i = 0; i < 20; i++) {
    const x = (Math.sin(i + state.frame * 0.01) * 0.5 + 0.5) * CANVAS_WIDTH;
    const y = ((i * 50 + state.frame * 2) % (CANVAS_HEIGHT + 100)) - 50;
    ctx.fillRect(x, y, 2, 2);
  }

  // プレイヤー
  if (state.player.invincible % 4 < 2) {
    // 外郭
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 魔法陣エフェクト
    ctx.strokeStyle = 'rgba(68, 170, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.radius + 8, state.frame * 0.05, state.frame * 0.05 + Math.PI * 1.5);
    ctx.stroke();
  }

  // 当たり判定
  ctx.fillStyle = '#f00';
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, state.player.hitRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 敵
  state.enemies.forEach(enemy => {
    ctx.fillStyle = '#a4f';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#a4f';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // HPゲージ
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#444';
    ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
    ctx.fillStyle = '#f44';
    ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * (enemy.hp / enemy.maxHp), 4);
  });

  // 弾
  state.bullets.forEach(bullet => {
    ctx.fillStyle = bullet.color;
    ctx.shadowBlur = bullet.isPlayerBullet ? 5 : 12;
    ctx.shadowColor = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    
    if (!bullet.isPlayerBullet) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
  ctx.shadowBlur = 0;
};
