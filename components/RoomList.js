'use client';

import { useState, useEffect } from 'react';

export default function RoomList({ rooms, onJoinRoom, onJoinAsSpectator, onRefresh, playerName: initialPlayerName }) {
  const [playerName, setPlayerName] = useState(initialPlayerName || '');
  const [showNameInput, setShowNameInput] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isSpectatorMode, setIsSpectatorMode] = useState(false);

  // 同步外部传入的 playerName
  useEffect(() => {
    if (initialPlayerName) {
      setPlayerName(initialPlayerName);
    }
  }, [initialPlayerName]);
  if (rooms.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-8 w-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">暂无可用房间</p>
          <button
            onClick={onRefresh}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            刷新列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-8 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          房间列表
        </h2>
        <button
          onClick={onRefresh}
          className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
        >
          刷新
        </button>
      </div>
      <div className="space-y-3">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                {room.id.charAt(0)}
              </div>
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">房间 {room.id}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  ({room.playerCount}/2)
                  {room.spectatorCount > 0 && (
                    <span className="ml-1">· {room.spectatorCount} 观战</span>
                  )}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {room.playerCount < 2 && (
                <button
                  onClick={() => {
                    if (!playerName.trim()) {
                      setSelectedRoomId(room.id);
                      setIsSpectatorMode(false);
                      setShowNameInput(true);
                      return;
                    }
                    onJoinRoom(room.id, playerName);
                  }}
                  className="px-5 py-2 rounded-lg font-medium text-sm transition-colors duration-200 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  加入
                </button>
              )}
              <button
                onClick={() => {
                  if (!playerName.trim()) {
                    setSelectedRoomId(room.id);
                    setIsSpectatorMode(true);
                    setShowNameInput(true);
                    return;
                  }
                  if (onJoinAsSpectator) {
                    onJoinAsSpectator(room.id, playerName);
                  }
                }}
                className="px-5 py-2 rounded-lg font-medium text-sm transition-colors duration-200 bg-gray-500 hover:bg-gray-600 text-white"
              >
                观战
              </button>
            </div>
          </div>
        ))}
      </div>

      {showNameInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              请输入玩家名称
            </h3>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="输入你的名字"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-800 dark:text-white transition-all duration-200 mb-4"
              maxLength={20}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && playerName.trim()) {
                  if (isSpectatorMode && onJoinAsSpectator) {
                    onJoinAsSpectator(selectedRoomId, playerName);
                  } else {
                    onJoinRoom(selectedRoomId, playerName);
                  }
                  setShowNameInput(false);
                }
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (playerName.trim()) {
                    if (isSpectatorMode && onJoinAsSpectator) {
                      onJoinAsSpectator(selectedRoomId, playerName);
                    } else {
                      onJoinRoom(selectedRoomId, playerName);
                    }
                    setShowNameInput(false);
                  }
                }}
                disabled={!playerName.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {isSpectatorMode ? '观战' : '加入'}
              </button>
              <button
                onClick={() => {
                  setShowNameInput(false);
                  setSelectedRoomId(null);
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
