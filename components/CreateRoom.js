'use client';

import { useState } from 'react';

export default function CreateRoom({ onCreateRoom, onJoinRoom }) {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  const handleCreate = () => {
    if (!playerName.trim()) {
      alert('请输入玩家名称');
      return;
    }
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    onCreateRoom(newRoomId, playerName);
  };

  const handleJoin = () => {
    if (!roomId.trim() || !playerName.trim()) {
      alert('请输入房间号和玩家名称');
      return;
    }
    onJoinRoom(roomId.trim().toUpperCase(), playerName);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-8 w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
          五子棋
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          经典策略游戏
        </p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            玩家名称
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="输入你的名字"
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-800 dark:text-white transition-all duration-200"
            maxLength={20}
          />
        </div>

        {!showJoinForm ? (
          <div className="space-y-3">
            <button
              onClick={handleCreate}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              创建房间
            </button>
            <button
              onClick={() => setShowJoinForm(true)}
              className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200"
            >
              加入房间
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                房间号
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="输入房间号"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-800 dark:text-white transition-all duration-200 font-mono text-center text-lg tracking-wider"
                maxLength={10}
              />
            </div>
            <button
              onClick={handleJoin}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              加入游戏
            </button>
            <button
              onClick={() => setShowJoinForm(false)}
              className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200"
            >
              返回
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
