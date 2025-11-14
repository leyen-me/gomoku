// Socket.io 服务器
import { Server } from 'socket.io';
import { checkWin, checkDraw } from '../lib/gameLogic.js';

// 存储房间信息
const rooms = new Map();

// 存储对局记录
const gameRecords = [];

export default function initializeSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);

    // 创建房间
    socket.on('createRoom', (data) => {
      const { roomId, playerName, preferredColor } = data;
      const room = {
        id: roomId,
        players: [{ id: socket.id, name: playerName, color: preferredColor || 'black' }],
        board: Array(15).fill(null).map(() => Array(15).fill(null)),
        currentPlayer: 'black',
        status: 'waiting',
        lastMove: null,
        moveHistory: [], // 用于悔棋
        waitingForColorChoice: false, // 是否等待选择颜色
        startTime: new Date().toISOString(), // 对局开始时间
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit('roomCreated', room);
      io.to(roomId).emit('roomUpdated', room);
    });

    // 加入房间
    socket.on('joinRoom', (data) => {
      const { roomId, playerName, preferredColor } = data;
      const room = rooms.get(roomId);

      if (!room) {
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      if (room.players.length >= 2) {
        socket.emit('error', { message: '房间已满' });
        return;
      }

      // 如果房间在等待颜色选择，使用选择的颜色
      const otherPlayerColor = room.players[0].color;
      const newPlayerColor = preferredColor || (otherPlayerColor === 'black' ? 'white' : 'black');
      
      room.players.push({ id: socket.id, name: playerName, color: newPlayerColor });
      
      // 确保黑方先手
      if (newPlayerColor === 'black') {
        room.currentPlayer = 'black';
      }
      
      room.status = 'playing';
      room.waitingForColorChoice = false;
      room.startTime = new Date().toISOString();
      socket.join(roomId);
      socket.emit('roomJoined', room);
      io.to(roomId).emit('roomUpdated', room);
    });

    // 获取房间列表
    socket.on('getRooms', () => {
      const roomList = Array.from(rooms.values())
        .filter(room => room.players.length < 2)
        .map(room => ({
          id: room.id,
          playerCount: room.players.length,
          status: room.status,
        }));
      socket.emit('roomsList', roomList);
    });

    // 落子
    socket.on('makeMove', (data) => {
      const { roomId, row, col, player } = data;
      const room = rooms.get(roomId);

      if (!room) {
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      if (room.status !== 'playing') {
        socket.emit('error', { message: '游戏未开始' });
        return;
      }

      if (room.currentPlayer !== player) {
        socket.emit('error', { message: '不是你的回合' });
        return;
      }

      // 检查位置是否合法
      if (room.board[row][col] !== null) {
        socket.emit('error', { message: '该位置已有棋子' });
        return;
      }

      // 保存历史状态用于悔棋
      room.moveHistory.push({
        board: room.board.map(r => [...r]),
        lastMove: room.lastMove ? { ...room.lastMove } : null,
        currentPlayer: room.currentPlayer,
      });

      // 更新棋盘
      room.board[row][col] = player;
      room.lastMove = { row, col, player };
      room.currentPlayer = player === 'black' ? 'white' : 'black';

      // 检查胜负
      if (checkWin(room.board, row, col, player)) {
        room.status = 'finished';
        room.winner = player;
        // 记录输家（另一方）
        room.lastLoser = player === 'black' ? 'white' : 'black';
        
        // 保存对局记录
        const record = {
          id: Date.now().toString(),
          roomId: room.id,
          startTime: room.startTime || new Date().toISOString(),
          endTime: new Date().toISOString(),
          players: room.players.map(p => ({ name: p.name, color: p.color })),
          winner: player,
          moves: room.moveHistory.map((h, idx) => ({
            moveNumber: idx + 1,
            ...h.lastMove,
          })).filter(m => m !== null).concat([{ moveNumber: room.moveHistory.length + 1, row, col, player }]),
        };
        gameRecords.push(record);
        room.lastRecordId = record.id;
      } else if (checkDraw(room.board)) {
        room.status = 'finished';
        room.winner = 'draw';
        // 平局时没有输家，不设置 lastLoser
        
        // 保存对局记录
        const record = {
          id: Date.now().toString(),
          roomId: room.id,
          startTime: room.startTime || new Date().toISOString(),
          endTime: new Date().toISOString(),
          players: room.players.map(p => ({ name: p.name, color: p.color })),
          winner: 'draw',
          moves: room.moveHistory.map((h, idx) => ({
            moveNumber: idx + 1,
            ...h.lastMove,
          })).filter(m => m !== null).concat([{ moveNumber: room.moveHistory.length + 1, row, col, player }]),
        };
        gameRecords.push(record);
        room.lastRecordId = record.id;
      }

      io.to(roomId).emit('moveMade', {
        board: room.board,
        lastMove: room.lastMove,
        currentPlayer: room.currentPlayer,
        status: room.status,
        winner: room.winner,
        canUndo: room.moveHistory.length > 0,
        lastLoser: room.lastLoser,
      });
    });

    // 投降
    socket.on('surrender', (data) => {
      const { roomId } = data;
      const room = rooms.get(roomId);

      if (!room || room.status !== 'playing') {
        socket.emit('error', { message: '无法投降' });
        return;
      }

      const surrenderingPlayer = room.players.find(p => p.id === socket.id);
      if (!surrenderingPlayer) {
        socket.emit('error', { message: '玩家不在房间中' });
        return;
      }

      // 投降方输，另一方赢
      const winner = surrenderingPlayer.color === 'black' ? 'white' : 'black';
      room.status = 'finished';
      room.winner = winner;
      room.surrendered = true;
      room.surrenderingPlayer = surrenderingPlayer.color;

      // 保存对局记录
      const record = {
        id: Date.now().toString(),
        roomId: room.id,
        startTime: room.startTime || new Date().toISOString(),
        endTime: new Date().toISOString(),
        players: room.players.map(p => ({ name: p.name, color: p.color })),
        winner: winner,
        surrendered: true,
        surrenderingPlayer: surrenderingPlayer.color,
        moves: room.moveHistory.map((h, idx) => ({
          moveNumber: idx + 1,
          ...h.lastMove,
        })).filter(m => m !== null),
      };
      gameRecords.push(record);
      room.lastRecordId = record.id;
      room.lastLoser = surrenderingPlayer.color;

      io.to(roomId).emit('gameSurrendered', {
        status: room.status,
        winner: room.winner,
        surrenderingPlayer: surrenderingPlayer.color,
        lastLoser: room.lastLoser,
      });
    });

    // 悔棋
    socket.on('undoMove', (data) => {
      const { roomId } = data;
      const room = rooms.get(roomId);

      if (!room || room.status !== 'playing') {
        socket.emit('error', { message: '无法悔棋' });
        return;
      }

      // 检查是否是当前玩家的回合
      const player = room.players.find(p => p.id === socket.id);
      if (!player) {
        socket.emit('error', { message: '玩家不在房间中' });
        return;
      }

      // 需要对方同意才能悔棋（或者当前玩家悔自己的上一步）
      // 简化实现：只要有历史记录就可以悔棋
      if (room.moveHistory.length === 0) {
        socket.emit('error', { message: '没有可悔棋的步骤' });
        return;
      }

      // 恢复上一状态
      const previousState = room.moveHistory.pop();
      room.board = previousState.board.map(r => [...r]);
      room.lastMove = previousState.lastMove ? { ...previousState.lastMove } : null;
      room.currentPlayer = previousState.currentPlayer;

      io.to(roomId).emit('moveUndone', {
        board: room.board,
        lastMove: room.lastMove,
        currentPlayer: room.currentPlayer,
        canUndo: room.moveHistory.length > 0,
      });
    });

    // 重新开始游戏
    socket.on('restartGame', (data) => {
      const { roomId } = data;
      const room = rooms.get(roomId);

      if (!room || room.players.length < 2) {
        socket.emit('error', { message: '无法重新开始' });
        return;
      }

      // 如果输家还没有选择颜色，不允许重新开始
      if (room.lastLoser && room.waitingForColorChoice) {
        socket.emit('error', { message: '请先选择颜色' });
        return;
      }

      room.board = Array(15).fill(null).map(() => Array(15).fill(null));
      room.currentPlayer = 'black';
      room.status = 'playing';
      room.lastMove = null;
      room.winner = null;
      room.moveHistory = [];
      room.startTime = new Date().toISOString();
      room.surrendered = false;
      room.surrenderingPlayer = null;
      room.waitingForColorChoice = false;
      room.lastLoser = null; // 清除上一局的输家记录

      io.to(roomId).emit('gameRestarted', room);
    });

    // 选择颜色（用于输家优先选边权）
    socket.on('chooseColor', (data) => {
      const { roomId, color } = data;
      const room = rooms.get(roomId);

      if (!room) {
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.color !== room.lastLoser) {
        socket.emit('error', { message: '你没有选择颜色的权限' });
        return;
      }

      const otherPlayer = room.players.find(p => p.id !== socket.id);
      if (otherPlayer) {
        player.color = color;
        otherPlayer.color = color === 'black' ? 'white' : 'black';
        room.waitingForColorChoice = false;
        
        io.to(roomId).emit('colorChosen', {
          players: room.players,
        });
      }
    });

    // 重新开始游戏（带颜色选择）
    socket.on('restartWithColor', (data) => {
      const { roomId, color } = data;
      const room = rooms.get(roomId);

      if (!room || room.players.length < 2) {
        socket.emit('error', { message: '无法重新开始' });
        return;
      }

      // 如果有输家优先选边权且提供了颜色
      if (room.lastLoser && color) {
        const loser = room.players.find(p => p.color === room.lastLoser);
        const otherPlayer = room.players.find(p => p.color !== room.lastLoser);
        
        if (loser && loser.id === socket.id && otherPlayer) {
          // 交换颜色
          loser.color = color;
          otherPlayer.color = color === 'black' ? 'white' : 'black';
        }
      }

      room.board = Array(15).fill(null).map(() => Array(15).fill(null));
      room.currentPlayer = 'black';
      room.status = 'playing';
      room.lastMove = null;
      room.winner = null;
      room.moveHistory = [];
      room.startTime = new Date().toISOString();
      room.surrendered = false;
      room.surrenderingPlayer = null;
      room.waitingForColorChoice = false;
      room.lastLoser = null; // 清除上一局的输家记录

      io.to(roomId).emit('gameRestarted', room);
    });

    // 获取对局记录
    socket.on('getGameRecords', () => {
      // 返回最近50条记录
      const recentRecords = gameRecords.slice(-50).reverse();
      socket.emit('gameRecords', recentRecords);
    });

    // 离开房间
    socket.on('leaveRoom', (data) => {
      const { roomId } = data;
      socket.leave(roomId);
      
      const room = rooms.get(roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit('playerLeft', { playerId: socket.id });
        }
      }
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log('用户断开连接:', socket.id);
      
      // 清理房间
      for (const [roomId, room] of rooms.entries()) {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit('playerLeft', { playerId: socket.id });
          }
          break;
        }
      }
    });
  });

  return io;
}

// 导出对局记录（可选，用于持久化）
export function getGameRecords() {
  return gameRecords;
}

