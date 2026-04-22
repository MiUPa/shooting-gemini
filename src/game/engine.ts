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
  isGameOver: false,
});

export const updateGameState = (
  state: GameState,
  keys: Set<string>
): GameState => {
  if (state.isGameOver) {
    if (keys.has('KeyR')) return createInitialState();
    return state;
  }

  const nextState = { ...state, frame: state.frame + 1 };
  const { player } = nextState;

  if (player.invincible > 0) player.invincible--;

  // 移動
  const isSlow = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const speed = isSlow ? player.slowSpeed : player.speed;
  let dx = 0, dy = 0;
  if (keys.has('ArrowLeft')) dx -= 1;
  if (keys.has('ArrowRight')) dx += 1;
  if (keys.has('ArrowUp')) dy -= 1;
  if (keys.has('ArrowDown')) dy += 1;

  if (dx !== 0 && dy !== 0) {
    dx *= 0.7071; dy *= 0.7071;
  }

  player.x = Math.max(player.radius, Math.min(CANVAS_WIDTH - player.radius, player.x + dx * speed));
  player.y = Math.max(player.radius, Math.min(CANVAS_HEIGHT - player.radius, player.y + dy * speed));

  // ショット (軽量化のため間隔を少し調整)
  if (keys.has('KeyZ') && nextState.frame % 5 === 0) {
    nextState.bullets.push({
      x: player.x, y: player.y - 10, vx: 0, vy: -12,
      radius: 3, active: true, color: '#4af', isPlayerBullet: true,
    });
  }

  // 弾更新
  nextState.bullets = nextState.bullets
    .map(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy }))
    .filter(b => b.y > -20 && b.y < CANVAS_HEIGHT + 20 && b.x > -20 && b.x < CANVAS_WIDTH + 20);

  // 敵生成
  if (nextState.frame % 90 === 0) {
    nextState.enemies.push({
      x: Math.random() * (CANVAS_WIDTH - 60) + 30, y: -20,
      radius: 15, active: true, hp: 6, maxHp: 6,
      type: 'basic', lastShotTime: 0, shotOffset: Math.floor(Math.random() * 60),
    });
  }

  // 敵更新と弾幕 (タイミング分散)
  nextState.enemies.forEach(enemy => {
    enemy.y += 0.8;
    
    // 発射タイミングを敵ごとにずらす
    if ((nextState.frame + enemy.shotOffset) % 60 === 0) {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      for (let i = -1; i <= 1; i++) {
        const a = angle + (i * Math.PI) / 16;
        nextState.bullets.push({
          x: enemy.x, y: enemy.y, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2,
          radius: 4, active: true, color: '#f44', isPlayerBullet: false,
        });
      }
      
      if ((nextState.frame + enemy.shotOffset) % 180 === 0) {
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI * 2) / 8;
          nextState.bullets.push({
            x: enemy.x, y: enemy.y, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5,
            radius: 5, active: true, color: '#f84', isPlayerBullet: false,
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
          enemy.hp -= 1; bullet.active = false;
          if (enemy.hp <= 0) nextState.score += 1000;
        }
      }
    });
    return enemy.hp > 0 && enemy.y < CANVAS_HEIGHT + 40;
  });

  if (player.invincible <= 0) {
    nextState.bullets.forEach(bullet => {
      if (!bullet.isPlayerBullet && bullet.active) {
        const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
        if (dist < player.hitRadius + bullet.radius) {
          bullet.active = false;
          nextState.lives -= 1;
          if (nextState.lives < 0) nextState.isGameOver = true;
          else {
            player.invincible = 120;
            player.x = CANVAS_WIDTH / 2; player.y = CANVAS_HEIGHT * 0.8;
          }
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

  // 背景の星 (軽量化)
  ctx.fillStyle = '#444';
  for (let i = 0; i < 15; i++) {
    const x = ((i * 137 + state.frame * 0.5) % CANVAS_WIDTH);
    const y = ((i * 163 + state.frame * 2) % CANVAS_HEIGHT);
    ctx.fillRect(x, y, 1, 1);
  }

  if (!state.isGameOver) {
    if (state.player.invincible % 4 < 2) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(state.player.x, state.player.y, state.player.radius, 0, Math.PI * 2); ctx.stroke();
      
      ctx.strokeStyle = 'rgba(68, 170, 255, 0.3)';
      ctx.beginPath(); ctx.arc(state.player.x, state.player.y, state.player.radius + 6, state.frame * 0.05, state.frame * 0.05 + Math.PI * 1.5); ctx.stroke();
    }
    ctx.fillStyle = '#f00';
    ctx.beginPath(); ctx.arc(state.player.x, state.player.y, state.player.hitRadius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.stroke();
  }

  // 敵 (影を削除)
  state.enemies.forEach(enemy => {
    ctx.fillStyle = '#a4f';
    ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#444'; ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 2);
    ctx.fillStyle = '#f44'; ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * (enemy.hp / enemy.maxHp), 2);
  });

  // 弾 (影を削除し、二重円で軽量に光を表現)
  state.bullets.forEach(bullet => {
    // 外側の円（色付き）
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 内側の円（白っぽくして発光感を出す）
    if (!bullet.isPlayerBullet) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = bullet.color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  if (state.isGameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.font = '20px sans-serif'; ctx.fillStyle = '#4af';
    ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  }
};
