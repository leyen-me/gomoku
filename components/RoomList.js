'use client';

export default function RoomList({ rooms, onJoinRoom, onRefresh }) {
  if (rooms.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">暂无可用房间</p>
          <button
            onClick={onRefresh}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            刷新列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">房间列表</h2>
        <button
          onClick={onRefresh}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          刷新
        </button>
      </div>
      <div className="space-y-2">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div>
              <span className="font-semibold">房间 {room.id}</span>
              <span className="text-sm text-gray-500 ml-2">
                ({room.playerCount}/2)
              </span>
            </div>
            <button
              onClick={() => onJoinRoom(room.id)}
              disabled={room.playerCount >= 2}
              className={`px-4 py-1 rounded ${
                room.playerCount >= 2
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } transition-colors`}
            >
              {room.playerCount >= 2 ? '已满' : '加入'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

