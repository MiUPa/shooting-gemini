import { useEffect, useRef, useState } from 'react';
import './App.css';
import { createInitialState, updateGameState, drawGame } from './game/engine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './game/types';
import type { GameState } from './game/types';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const keysRef = useRef<Set<string>>(new Set());
  const prevKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Escape'].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current.add(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let currentState = createInitialState();

    const loop = () => {
      // 状態更新
      currentState = updateGameState(currentState, keysRef.current, prevKeysRef.current);
      setGameState({ ...currentState });
      
      // 前回のキー状態を更新
      prevKeysRef.current = new Set(keysRef.current);

      // 描画
      drawGame(ctx, currentState);

      animationFrameId = window.requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="game-container">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />
      </div>
      <div className="ui-panel">
        <h1>Shooting Gemini</h1>
        <div className="stats">
          <p><span className="label">Score</span><span className="value">{gameState.score.toLocaleString().padStart(10, '0')}</span></p>
          <p><span className="label">Player</span><span className="value lives-value">{gameState.lives >= 0 ? '★'.repeat(gameState.lives) : 'NONE'}</span></p>
          <p><span className="label">Power</span><span className="value">MAX</span></p>
          <p><span className="label">Graze</span><span className="value">0</span></p>
        </div>
        <div className="controls">
          <h3>Spell Card Controls</h3>
          <ul>
            <li><span>Move</span><span className="key">Arrow Keys</span></li>
            <li><span>Shot</span><span className="key">Z Key</span></li>
            <li><span>Slow</span><span className="key">Shift</span></li>
            <li><span>Pause</span><span className="key">Esc / P</span></li>
            <li><span>Start</span><span className="key">Space</span></li>
            <li><span>Restart</span><span className="key">R Key</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
