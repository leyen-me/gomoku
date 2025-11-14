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
    <div className="min-h-screen bg-white dark:bg-gray-950 py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {gameState === 'lobby' && (
          <div className="space-y-16 animate-in fade-in duration-200">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-semibold mb-3 text-gray-900 dark:text-white">
                五子棋
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                经典策略 · 在线对战
              </p>
            </div>
            <div className="flex flex-col gap-8 items-center w-full max-w-md mx-auto">
              <CreateRoom
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
              />
              <RoomList
                rooms={rooms}
                onJoinRoom={handleJoinRoom}
                onRefresh={handleRefreshRooms}
                playerName={playerName}
              />
            </div>
          </div>
        )}

        {(gameState === 'waiting' || gameState === 'playing' || gameState === 'finished') && (
          <div className="space-y-12 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold mb-1 text-gray-900 dark:text-white">
                  房间 {roomId}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  玩家: <span className="font-medium">{playerName}</span> · {playerColor === 'black' ? '黑方' : '白方'}
                </p>
              </div>
              <button
                onClick={handleLeaveRoom}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-5 rounded-lg transition-colors duration-200 w-full sm:w-auto"
              >
                离开房间
              </button>
            </div>

            <div className="flex flex-col xl:flex-row gap-12 items-center xl:items-start justify-center">
              <div className="w-full xl:w-80 flex-shrink-0 order-2 xl:order-1">
                <GameInfo
                  currentPlayer={currentPlayer}
                  status={status}
                  winner={winner}
                  players={players}
                  onRestart={handleRestart}
                />
              </div>
              <div className="flex-1 flex justify-center items-center order-1 xl:order-2 min-w-0">
                <GameBoard
                  board={board}
                  onCellClick={handleCellClick}
                  disabled={status !== 'playing' || currentPlayer !== playerColor}
                  lastMove={lastMove}
                  winner={winner}
                  status={status}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
