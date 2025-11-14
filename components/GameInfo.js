'use client';

export default function GameInfo({ currentPlayer, status, winner, players, onRestart }) {
  const getPlayerName = (color) => {
    const player = players?.find(p => p.color === color);
    return player?.name || (color === 'black' ? '黑方' : '白方');
  };

  const getStatusText = () => {
    if (status === 'waiting') {
      return '等待玩家加入...';
    }
    if (status === 'finished') {
      if (winner === 'draw') {
        return '平局！';
      }
      return `${getPlayerName(winner)} 获胜！`;
    }
    return `当前回合: ${getPlayerName(currentPlayer)}`;
  };

  const getStatusColor = () => {
    if (status === 'finished') {
      return winner === 'draw' ? 'text-yellow-600' : 'text-green-600';
    }
    return 'text-blue-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-4">
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">游戏信息</h2>
          <p className={`text-base sm:text-lg font-semibold ${getStatusColor()}`}>
            {getStatusText()}
          </p>
        </div>

        <div className="flex justify-around items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-black mx-auto mb-2 flex items-center justify-center">
              <span className="text-white text-xs">黑</span>
            </div>
            <p className="text-sm font-medium">{getPlayerName('black')}</p>
          </div>

          <div className="text-gray-400">VS</div>

          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 mx-auto mb-2 flex items-center justify-center">
              <span className="text-gray-800 text-xs">白</span>
            </div>
            <p className="text-sm font-medium">{getPlayerName('white')}</p>
          </div>
        </div>

        {status === 'finished' && (
          <div className="pt-4">
            <button
              onClick={onRestart}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              重新开始
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

