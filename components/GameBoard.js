'use client';

import { useEffect, useRef, useState } from 'react';

const BOARD_SIZE = 15;
const CELL_SIZE = 30;
const BOARD_PADDING = 20;

export default function GameBoard({ board, onCellClick, disabled, lastMove }) {
  const canvasRef = useRef(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = BOARD_SIZE * CELL_SIZE + BOARD_PADDING * 2;
    canvas.width = size;
    canvas.height = size;

    // 绘制棋盘背景
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, size, size);

    // 绘制网格线
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;

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

    // 绘制天元和星位
    const starPositions = [
      [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
    ];
    ctx.fillStyle = '#8B4513';
    starPositions.forEach(([row, col]) => {
      const x = BOARD_PADDING + col * CELL_SIZE;
      const y = BOARD_PADDING + row * CELL_SIZE;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 绘制棋子
    board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell) {
          const x = BOARD_PADDING + colIndex * CELL_SIZE;
          const y = BOARD_PADDING + rowIndex * CELL_SIZE;

          // 绘制棋子阴影
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.arc(x + 1, y + 1, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
          ctx.fill();

          // 绘制棋子
          const gradient = ctx.createRadialGradient(
            x - 3, y - 3, 0,
            x, y, CELL_SIZE / 2 - 2
          );
          if (cell === 'black') {
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(1, '#000');
          } else {
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ddd');
          }
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
          ctx.fill();

          // 高亮最后一步
          if (lastMove && lastMove.row === rowIndex && lastMove.col === colIndex) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, CELL_SIZE / 2, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });
    });

    // 绘制悬停效果
    if (hoveredCell && !disabled && !board[hoveredCell.row][hoveredCell.col]) {
      const x = BOARD_PADDING + hoveredCell.col * CELL_SIZE;
      const y = BOARD_PADDING + hoveredCell.row * CELL_SIZE;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
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

  return (
    <div className="flex justify-center items-center p-2 sm:p-4 overflow-x-auto">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => setHoveredCell(null)}
        className="cursor-pointer shadow-lg rounded-lg touch-none"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}

