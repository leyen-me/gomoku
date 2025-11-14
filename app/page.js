'use client';

import { useEffect, useState } from 'react';
import { getSocket, disconnectSocket } from '../lib/socket';
import { createBoard } from '../lib/gameLogic';
import GameBoard from '../components/GameBoard';
import GameInfo from '../components/GameInfo';
import CreateRoom from '../components/CreateRoom';
import RoomList from '../components/RoomList';

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('lobby'); // lobby, waiting, playing, finished
  const [roomId, setRoomId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [playerColor, setPlayerColor] = useState(null);
  const [board, setBoard] = useState(createBoard());
  const [currentPlayer, setCurrentPlayer] = useState('black');
  const [status, setStatus] = useState('waiting');
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    // 监听房间创建
    socketInstance.on('roomCreated', (room) => {
      setRoomId(room.id);
      setPlayerColor(room.players[0].color);
      setPlayers(room.players);
      setBoard(room.board);
      setCurrentPlayer(room.currentPlayer);
      setStatus(room.status);
      setGameState(room.status === 'waiting' ? 'waiting' : 'playing');
    });

    // 监听房间加入
    socketInstance.on('roomJoined', (room) => {
      const myPlayer = room.players.find(p => p.id === socketInstance.id);
      setRoomId(room.id);
      setPlayerColor(myPlayer?.color);
      setPlayers(room.players);
      setBoard(room.board);
      setCurrentPlayer(room.currentPlayer);
      setStatus(room.status);
      setGameState('playing');
    });

    // 监听房间更新
    socketInstance.on('roomUpdated', (room) => {
      setPlayers(room.players);
      setBoard(room.board);
      setCurrentPlayer(room.currentPlayer);
      setStatus(room.status);
      setGameState((prevState) => {
        if (room.status === 'playing' && prevState === 'waiting') {
          return 'playing';
        }
        return prevState;
      });
    });

    // 监听落子
    socketInstance.on('moveMade', (data) => {
      setBoard(data.board);
      setLastMove(data.lastMove);
      setCurrentPlayer(data.currentPlayer);
      setStatus(data.status);
      if (data.status === 'finished') {
        setWinner(data.winner);
        setGameState('finished');
      }
    });

    // 监听游戏重新开始
    socketInstance.on('gameRestarted', (room) => {
      setBoard(room.board);
      setCurrentPlayer(room.currentPlayer);
      setStatus(room.status);
      setLastMove(null);
      setWinner(null);
      setGameState('playing');
    });

    // 监听玩家离开
    socketInstance.on('playerLeft', () => {
      setError('对方已离开房间');
      setGameState('lobby');
      setRoomId(null);
    });

    // 监听房间列表
    socketInstance.on('roomsList', (roomList) => {
      setRooms(roomList);
    });

    // 监听错误
    socketInstance.on('error', (data) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    // 获取房间列表
    socketInstance.emit('getRooms');

    return () => {
      socketInstance.off('roomCreated');
      socketInstance.off('roomJoined');
      socketInstance.off('roomUpdated');
      socketInstance.off('moveMade');
      socketInstance.off('gameRestarted');
      socketInstance.off('playerLeft');
      socketInstance.off('roomsList');
      socketInstance.off('error');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateRoom = (newRoomId, name) => {
    setPlayerName(name);
    setError(null);
    socket.emit('createRoom', { roomId: newRoomId, playerName: name });
  };

  const handleJoinRoom = (targetRoomId, name = null) => {
    const nameToUse = name || playerName;
    if (!nameToUse) {
      setError('请先输入玩家名称');
      return;
    }
    setPlayerName(nameToUse);
    setError(null);
    socket.emit('joinRoom', { roomId: targetRoomId, playerName: nameToUse });
  };

  const handleCellClick = (row, col) => {
    if (!socket || status !== 'playing' || currentPlayer !== playerColor) {
      return;
    }
    socket.emit('makeMove', {
      roomId,
      row,
      col,
      player: playerColor,
    });
  };

  const handleRestart = () => {
    if (!socket || !roomId) return;
    socket.emit('restartGame', { roomId });
  };

  const handleLeaveRoom = () => {
    if (socket && roomId) {
      socket.emit('leaveRoom', { roomId });
    }
    setGameState('lobby');
    setRoomId(null);
    setBoard(createBoard());
    setPlayers([]);
    setLastMove(null);
    setWinner(null);
    setCurrentPlayer('black');
    setStatus('waiting');
    socket.emit('getRooms');
  };

  const handleRefreshRooms = () => {
    if (socket) {
      socket.emit('getRooms');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-4 sm:py-8 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {gameState === 'lobby' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                五子棋游戏
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                创建或加入房间开始游戏
              </p>
            </div>
            <CreateRoom
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
            />
            <RoomList
              rooms={rooms}
              onJoinRoom={handleJoinRoom}
              onRefresh={handleRefreshRooms}
            />
          </div>
        )}

        {(gameState === 'waiting' || gameState === 'playing' || gameState === 'finished') && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  房间 {roomId}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  玩家: {playerName} ({playerColor === 'black' ? '黑方' : '白方'})
                </p>
              </div>
              <button
                onClick={handleLeaveRoom}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors w-full sm:w-auto"
              >
                离开房间
              </button>
            </div>

            <GameInfo
              currentPlayer={currentPlayer}
              status={status}
              winner={winner}
              players={players}
              onRestart={handleRestart}
            />

            <GameBoard
              board={board}
              onCellClick={handleCellClick}
              disabled={status !== 'playing' || currentPlayer !== playerColor}
              lastMove={lastMove}
            />
          </div>
        )}
      </div>
    </div>
  );
}
