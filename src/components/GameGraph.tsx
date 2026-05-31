import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import CountUp from 'react-countup';

interface GameGraphProps {
  multiplier: number;
  phase: string;
  crashPoint: number | null;
}

const GameGraph: React.FC<GameGraphProps> = ({ multiplier, phase, crashPoint }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphPoints, setGraphPoints] = useState<{ x: number; y: number }[]>([]);
  const [displayMultiplier, setDisplayMultiplier] = useState(1.00);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (height / 10) * i);
      ctx.lineTo(width, (height / 10) * i);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo((width / 10) * i, 0);
      ctx.lineTo((width / 10) * i, height);
      ctx.stroke();
    }

    // Calculate current point on graph
    const normalizedMultiplier = Math.min(Math.log10(multiplier) / 2.5, 1);
    const currentX = (width * 0.9) * normalizedMultiplier;
    const currentY = height * 0.9 - (height * 0.8) * normalizedMultiplier;

    // Add point to graph
    setGraphPoints(prev => {
      const newPoints = [...prev, { x: currentX, y: currentY }];
      if (newPoints.length > 200) {
        newPoints.shift();
      }
      return newPoints;
    });

    // Draw graph curve
    if (graphPoints.length > 1) {
      const gradient = phase === 'crashed'
        ? ctx.createLinearGradient(0, height, width, 0)
        : ctx.createLinearGradient(0, height, width, 0);

      if (phase === 'crashed') {
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(1, '#ff0000');
      } else {
        gradient.addColorStop(0, '#00d4aa');
        gradient.addColorStop(1, '#6c63ff');
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(width * 0.1, height * 0.9);
      graphPoints.forEach((point, index) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();

      // Fill area under curve
      ctx.lineTo(graphPoints[graphPoints.length - 1]?.x || width * 0.1, height * 0.9);
      ctx.closePath();

      const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
      if (phase === 'crashed') {
        fillGradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
        fillGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      } else {
        fillGradient.addColorStop(0, 'rgba(0, 212, 170, 0.3)');
        fillGradient.addColorStop(1, 'rgba(108, 99, 255, 0)');
      }
      ctx.fillStyle = fillGradient;
      ctx.fill();
    }

    // Draw plane emoji
    if (phase !== 'crashed') {
      const fontSize = 48;
      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Add glow effect
      ctx.shadowColor = '#00d4aa';
      ctx.shadowBlur = 20;
      ctx.fillText('✈️', currentX + 20, currentY - 20);
      ctx.shadowBlur = 0;
    }
  }, [multiplier, phase, crashPoint]);

  // Reset graph on new round
  useEffect(() => {
    if (phase === 'countdown' || phase === 'waiting') {
      setGraphPoints([]);
    }
  }, [phase]);

  useEffect(() => {
    setDisplayMultiplier(multiplier);
  }, [multiplier]);

  return (
    <div className="game-graph">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="graph-canvas"
      />

      <div className={`multiplier-display ${phase === 'crashed' ? 'crashed' : ''}`}>
        <CountUp
          start={displayMultiplier - 0.01}
          end={displayMultiplier}
          duration={0.1}
          decimals={2}
          preserveValue={true}
          suffix="x"
        />
      </div>

      {phase === 'crashed' && (
        <div className="crash-overlay">
          <div className="crash-text">CRASHED!</div>
          <div className="crash-multiplier">{crashPoint?.toFixed(2)}x</div>
        </div>
      )}
    </div>
  );
};

export default GameGraph;
