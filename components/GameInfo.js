'use client';

export default function GameInfo({ 
  currentPlayer, 
  status, 
  winner, 
  players, 
  onRestart, 
  onSurrender, 
  onUndo, 
  canUndo,
  playerColor,
  lastLoser,
  onChooseColor,
  waitingForColorChoice,
}) {
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
      return winner === 'draw' ? 'text-amber-500' : 'text-emerald-500';
    }
    return 'text-blue-500';
  };

  const isCurrentPlayer = (color) => {
    return status === 'playing' && currentPlayer === color;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-8">
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
            游戏状态
          </h2>
          <div className={`text-base font-medium ${getStatusColor()} transition-colors duration-200`}>
            {getStatusText()}
          </div>
        </div>

        <div className="flex justify-around items-center pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <div className={`w-14 h-14 rounded-full bg-gray-900 dark:bg-gray-100 mx-auto mb-3 flex items-center justify-center transition-all duration-200 ${isCurrentPlayer('black') ? 'ring-2 ring-blue-500' : ''}`}>
              <span className="text-white dark:text-gray-900 text-sm font-medium">黑</span>
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{getPlayerName('black')}</p>
            {isCurrentPlayer('black') && (
              <div className="mt-2 w-1.5 h-1.5 bg-blue-500 rounded-full mx-auto" />
            )}
          </div>

          <div className="text-gray-400 text-lg font-light">VS</div>

          <div className="text-center">
            <div className={`w-14 h-14 rounded-full bg-white border-2 border-gray-300 dark:border-gray-600 mx-auto mb-3 flex items-center justify-center transition-all duration-200 ${isCurrentPlayer('white') ? 'ring-2 ring-blue-500' : ''}`}>
              <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">白</span>
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{getPlayerName('white')}</p>
            {isCurrentPlayer('white') && (
              <div className="mt-2 w-1.5 h-1.5 bg-blue-500 rounded-full mx-auto" />
            )}
          </div>
        </div>

        {status === 'playing' && (
          <div className="pt-4 space-y-3">
            {canUndo && (
              <button
                onClick={onUndo}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
              >
                悔棋
              </button>
            )}
            <button
              onClick={onSurrender}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
            >
              投降
            </button>
          </div>
        )}

        {status === 'finished' && (
          <div className="pt-4 space-y-3">
            {waitingForColorChoice && lastLoser === playerColor && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3 text-center font-medium">
                  作为上一局的输家，你可以优先选择颜色
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => onChooseColor('black')}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    黑方
                  </button>
                  <button
                    onClick={() => onChooseColor('white')}
                    className="flex-1 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    白方
                  </button>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 text-center">
                  选择颜色后，点击下方"重新开始"按钮开始新一局
                </p>
              </div>
            )}
            <button
              onClick={onRestart}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              重新开始
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
