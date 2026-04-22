import { useEffect, useRef, useState } from 'react';
import './App.css';
import { createInitialState, updateGameState, drawGame } from './game/engine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './game/types';
import type { GameState } from './game/types';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 矢印キーとスペースキーでのスクロールを防止
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
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
      currentState = updateGameState(currentState, keysRef.current);
      setGameState({ ...currentState });

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
          <p>Score: <span className="value">{gameState.score}</span></p>
          <p>Lives: <span className="value">{gameState.lives >= 0 ? '★'.repeat(gameState.lives) : 'NONE'}</span></p>
        </div>
        <div className="controls">
          <h3>Controls</h3>
          <ul>
            <li><span>Arrow Keys</span>: Move</li>
            <li><span>Z Key</span>: Shot</li>
            <li><span>Shift</span>: Slow Move</li>
            <li><span>R Key</span>: Restart (Game Over)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
