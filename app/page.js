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
  const [canUndo, setCanUndo] = useState(false);
  const [lastLoser, setLastLoser] = useState(null);
  const [waitingForColorChoice, setWaitingForColorChoice] = useState(false);
  const [gameRecords, setGameRecords] = useState([]);
  const [showRecords, setShowRecords] = useState(false);

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
      setCanUndo(false);
      setLastLoser(null);
      setWaitingForColorChoice(false);
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
      setCanUndo(false);
      setLastLoser(null);
      setWaitingForColorChoice(false);
      setGameState('playing');
    });

    // 监听房间更新
    socketInstance.on('roomUpdated', (room) => {
      setPlayers(room.players);
      setBoard(room.board);
      setCurrentPlayer(room.currentPlayer);
      setStatus(room.status);
      setCanUndo(false);
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
      setCanUndo(data.canUndo || false);
      if (data.status === 'finished') {
        setWinner(data.winner);
        setLastLoser(data.lastLoser || null);
        setWaitingForColorChoice(data.lastLoser ? true : false);
        setGameState('finished');
      }
    });

    // 监听悔棋
    socketInstance.on('moveUndone', (data) => {
      setBoard(data.board);
      setLastMove(data.lastMove);
      setCurrentPlayer(data.currentPlayer);
      setCanUndo(data.canUndo || false);
    });

    // 监听投降
    socketInstance.on('gameSurrendered', (data) => {
      setStatus(data.status);
      setWinner(data.winner);
      setGameState('finished');
      setLastLoser(data.lastLoser);
      setWaitingForColorChoice(true);
    });

    // 监听颜色选择
    socketInstance.on('colorChosen', (data) => {
      setPlayers(data.players);
      const myPlayer = data.players.find(p => p.id === socketInstance.id);
      if (myPlayer) {
        setPlayerColor(myPlayer.color);
      }
      // 颜色已选择，清除等待状态
      setWaitingForColorChoice(false);
    });

    // 监听对局记录
    socketInstance.on('gameRecords', (records) => {
      setGameRecords(records);
    });

    // 监听游戏重新开始
    socketInstance.on('gameRestarted', (room) => {
      setBoard(room.board);
      setCurrentPlayer(room.currentPlayer);
      setStatus(room.status);
      setLastMove(null);
      setWinner(null);
      setCanUndo(false);
      setLastLoser(null);
      setWaitingForColorChoice(false);
      setGameState('playing');
      const myPlayer = room.players.find(p => p.id === socketInstance.id);
      if (myPlayer) {
        setPlayerColor(myPlayer.color);
      }
      setPlayers(room.players);
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
      socketInstance.off('moveUndone');
      socketInstance.off('gameSurrendered');
      socketInstance.off('colorChosen');
      socketInstance.off('gameRecords');
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

  const handleSurrender = () => {
    if (!socket || !roomId || status !== 'playing') return;
    if (confirm('确定要投降吗？')) {
      socket.emit('surrender', { roomId });
    }
  };

  const handleUndo = () => {
    if (!socket || !roomId || status !== 'playing') return;
    socket.emit('undoMove', { roomId });
  };

  const handleChooseColor = (color) => {
    if (!socket || !roomId) return;
    socket.emit('chooseColor', { roomId, color });
    // 选择颜色后，可以选择立即重新开始游戏
    // 或者等待玩家手动点击重新开始
  };

  const handleRestart = () => {
    if (!socket || !roomId) return;
    socket.emit('restartGame', { roomId });
  };

  const handleGetRecords = () => {
    if (socket) {
      socket.emit('getGameRecords');
      setShowRecords(true);
    }
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
    setCanUndo(false);
    setLastLoser(null);
    setWaitingForColorChoice(false);
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
                  onSurrender={handleSurrender}
                  onUndo={handleUndo}
                  canUndo={canUndo}
                  playerColor={playerColor}
                  lastLoser={lastLoser}
                  onChooseColor={handleChooseColor}
                  waitingForColorChoice={waitingForColorChoice}
                />
                <div className="mt-4">
                  <button
                    onClick={handleGetRecords}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                  >
                    查看对局记录
                  </button>
                </div>
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

        {showRecords && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  对局记录
                </h2>
                <button
                  onClick={() => setShowRecords(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto p-6 flex-1">
                {gameRecords.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    暂无对局记录
                  </p>
                ) : (
                  <div className="space-y-4">
                    {gameRecords.map((record) => (
                      <div
                        key={record.id}
                        className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {record.players[0]?.name || '玩家1'} ({record.players[0]?.color === 'black' ? '黑' : '白'}) 
                              VS 
                              {record.players[1]?.name || '玩家2'} ({record.players[1]?.color === 'black' ? '黑' : '白'})
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(record.startTime).toLocaleString('zh-CN')}
                            </p>
                          </div>
                          <div className="text-right">
                            {record.surrendered ? (
                              <span className="inline-block px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-sm">
                                投降
                              </span>
                            ) : record.winner === 'draw' ? (
                              <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm">
                                平局
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-sm">
                                {record.winner === 'black' ? '黑方' : '白方'} 胜
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <p>共 {record.moves.length} 步</p>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">
                              查看棋谱
                            </summary>
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono">
                              {record.moves.length > 0 ? (
                                record.moves.map((move, idx) => (
                                  <span key={idx} className="inline-block mr-2">
                                    {move.moveNumber}.{move.player === 'black' ? '黑' : '白'}({move.row},{move.col})
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-500">无棋谱记录</span>
                              )}
                            </div>
                          </details>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
