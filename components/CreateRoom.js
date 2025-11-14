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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 max-w-md mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">五子棋游戏</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">玩家名称</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="输入你的名字"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            maxLength={20}
          />
        </div>

        {!showJoinForm ? (
          <>
            <button
              onClick={handleCreate}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              创建房间
            </button>
            <button
              onClick={() => setShowJoinForm(true)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              加入房间
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">房间号</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="输入房间号"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                maxLength={10}
              />
            </div>
            <button
              onClick={handleJoin}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              加入游戏
            </button>
            <button
              onClick={() => setShowJoinForm(false)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              返回
            </button>
          </>
        )}
      </div>
    </div>
  );
}

