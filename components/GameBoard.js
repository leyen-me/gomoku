'use client';

import { useEffect, useRef, useState } from 'react';
import ParticleEffect from './ParticleEffect';

const BOARD_SIZE = 15;
const CELL_SIZE = 42; // 增大棋盘尺寸，更符合国际标准
const BOARD_PADDING = 30;

export default function GameBoard({ board, onCellClick, disabled, lastMove, winner, status }) {
  const canvasRef = useRef(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = BOARD_SIZE * CELL_SIZE + BOARD_PADDING * 2;
    canvas.width = size;
    canvas.height = size;

    // 绘制棋盘背景 - 使用更精致的木纹色
    const bgGradient = ctx.createLinearGradient(0, 0, size, size);
    bgGradient.addColorStop(0, '#F5E6D3');
    bgGradient.addColorStop(1, '#E8D5B7');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, size, size);

    // 添加边框
    ctx.strokeStyle = '#D4A574';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, size, size);

    // 绘制网格线 - 更精致的线条
    ctx.strokeStyle = '#8B6F47';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < BOARD_SIZE; i++) {
      const pos = BOARD_PADDING + i * CELL_SIZE;

      // 横线
      ctx.beginPath();
      ctx.moveTo(BOARD_PADDING, pos);
      ctx.lineTo(size - BOARD_PADDING, pos);
      ctx.stroke();

      // 竖线
      ctx.beginPath();
      ctx.moveTo(pos, BOARD_PADDING);
      ctx.lineTo(pos, size - BOARD_PADDING);
      ctx.stroke();
    }

    // 绘制天元和星位 - 更精致的星位标记
    const starPositions = [
      [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
    ];
    starPositions.forEach(([row, col]) => {
      const x = BOARD_PADDING + col * CELL_SIZE;
      const y = BOARD_PADDING + row * CELL_SIZE;
      // 外圈
      ctx.fillStyle = '#6B4423';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      // 内圈
      ctx.fillStyle = '#8B6F47';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 绘制棋子
    board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell) {
          const x = BOARD_PADDING + colIndex * CELL_SIZE;
          const y = BOARD_PADDING + rowIndex * CELL_SIZE;
          const stoneRadius = CELL_SIZE / 2 - 3;

          // 绘制棋子阴影
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.arc(x + 2, y + 2, stoneRadius, 0, Math.PI * 2);
          ctx.fill();

          // 绘制棋子 - 更精致的3D效果
          const gradient = ctx.createRadialGradient(
            x - stoneRadius * 0.3, y - stoneRadius * 0.3, 0,
            x, y, stoneRadius
          );
          
          // 先填充棋子
          if (cell === 'black') {
            gradient.addColorStop(0, '#4A4A4A');
            gradient.addColorStop(0.5, '#2A2A2A');
            gradient.addColorStop(1, '#0A0A0A');
          } else {
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.5, '#F5F5F5');
            gradient.addColorStop(1, '#E0E0E0');
          }
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, stoneRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // 然后添加高光和边框
          if (cell === 'black') {
            // 黑棋高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(x - stoneRadius * 0.3, y - stoneRadius * 0.3, stoneRadius * 0.4, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // 白棋边框
            ctx.strokeStyle = '#D0D0D0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, stoneRadius, 0, Math.PI * 2);
            ctx.stroke();
          }

          // 高亮最后一步 - 极简标记
          if (lastMove && lastMove.row === rowIndex && lastMove.col === colIndex) {
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, stoneRadius + 1, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });
    });

    // 绘制悬停效果 - 极简预览
    if (hoveredCell && !disabled && !board[hoveredCell.row][hoveredCell.col]) {
      const x = BOARD_PADDING + hoveredCell.col * CELL_SIZE;
      const y = BOARD_PADDING + hoveredCell.row * CELL_SIZE;
      const previewRadius = CELL_SIZE / 2 - 3;
      // 半透明预览棋子
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, previewRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [board, hoveredCell, disabled, lastMove]);

  const handleMouseMove = (e) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.round((x - BOARD_PADDING) / CELL_SIZE);
    const row = Math.round((y - BOARD_PADDING) / CELL_SIZE);

    if (
      row >= 0 && row < BOARD_SIZE &&
      col >= 0 && col < BOARD_SIZE &&
      !board[row][col]
    ) {
      setHoveredCell({ row, col });
    } else {
      setHoveredCell(null);
    }
  };

  const handleClick = (e) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.round((x - BOARD_PADDING) / CELL_SIZE);
    const row = Math.round((y - BOARD_PADDING) / CELL_SIZE);

    if (
      row >= 0 && row < BOARD_SIZE &&
      col >= 0 && col < BOARD_SIZE &&
      !board[row][col]
    ) {
      onCellClick(row, col);
    }
  };

  const showParticles = status === 'finished' && winner && winner !== 'draw';

  return (
    <div className="flex justify-center items-center py-4 sm:py-8 px-2 sm:px-4 w-full">
      <div className="relative">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onMouseLeave={() => setHoveredCell(null)}
          className="cursor-pointer shadow-sm rounded-lg touch-none"
          style={{ 
            maxWidth: '100%', 
            height: 'auto'
          }}
        />
        {disabled && (
          <div className="absolute inset-0 bg-black/5 rounded-lg pointer-events-none" />
        )}
        <ParticleEffect show={showParticles} winner={winner} />
      </div>
    </div>
  );
}

