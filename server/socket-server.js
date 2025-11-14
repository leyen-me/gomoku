// Socket.io 服务器
import { Server } from 'socket.io';
import { checkWin, checkDraw } from '../lib/gameLogic.js';

// 存储房间信息
const rooms = new Map();

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
      const { roomId, playerName } = data;
      const room = {
        id: roomId,
        players: [{ id: socket.id, name: playerName, color: 'black' }],
        board: Array(15).fill(null).map(() => Array(15).fill(null)),
        currentPlayer: 'black',
        status: 'waiting',
        lastMove: null,
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit('roomCreated', room);
      io.to(roomId).emit('roomUpdated', room);
    });

    // 加入房间
    socket.on('joinRoom', (data) => {
      const { roomId, playerName } = data;
      const room = rooms.get(roomId);

      if (!room) {
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      if (room.players.length >= 2) {
        socket.emit('error', { message: '房间已满' });
        return;
      }

      room.players.push({ id: socket.id, name: playerName, color: 'white' });
      room.status = 'playing';
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

      // 更新棋盘
      room.board[row][col] = player;
      room.lastMove = { row, col, player };
      room.currentPlayer = player === 'black' ? 'white' : 'black';

      // 检查胜负
      if (checkWin(room.board, row, col, player)) {
        room.status = 'finished';
        room.winner = player;
      } else if (checkDraw(room.board)) {
        room.status = 'finished';
        room.winner = 'draw';
      }

      io.to(roomId).emit('moveMade', {
        board: room.board,
        lastMove: room.lastMove,
        currentPlayer: room.currentPlayer,
        status: room.status,
        winner: room.winner,
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

      room.board = Array(15).fill(null).map(() => Array(15).fill(null));
      room.currentPlayer = 'black';
      room.status = 'playing';
      room.lastMove = null;
      room.winner = null;

      io.to(roomId).emit('gameRestarted', room);
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

