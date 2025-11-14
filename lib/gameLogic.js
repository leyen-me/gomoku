// 五子棋游戏逻辑

const BOARD_SIZE = 15; // 15x15 棋盘

// 初始化空棋盘
export function createBoard() {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
}

// 检查位置是否合法
export function isValidMove(board, row, col) {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return false;
  }
  return board[row][col] === null;
}

// 落子
export function makeMove(board, row, col, player) {
  if (!isValidMove(board, row, col)) {
    return null;
  }
  const newBoard = board.map(r => [...r]);
  newBoard[row][col] = player;
  return newBoard;
}

// 检查是否获胜
export function checkWin(board, row, col, player) {
  const directions = [
    [0, 1],   // 横向
    [1, 0],   // 纵向
    [1, 1],   // 主对角线
    [1, -1]   // 副对角线
  ];

  for (const [dx, dy] of directions) {
    let count = 1; // 包含当前棋子

    // 正向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;
      if (
        newRow >= 0 && newRow < BOARD_SIZE &&
        newCol >= 0 && newCol < BOARD_SIZE &&
        board[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    // 反向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row - dx * i;
      const newCol = col - dy * i;
      if (
        newRow >= 0 && newRow < BOARD_SIZE &&
        newCol >= 0 && newCol < BOARD_SIZE &&
        board[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 5) {
      return true;
    }
  }

  return false;
}

// 检查是否平局（棋盘已满）
export function checkDraw(board) {
  return board.every(row => row.every(cell => cell !== null));
}

// 获取游戏状态
export function getGameStatus(board, lastMove, currentPlayer) {
  if (!lastMove) {
    return 'playing';
  }

  const { row, col, player } = lastMove;
  
  if (checkWin(board, row, col, player)) {
    return 'win';
  }
  
  if (checkDraw(board)) {
    return 'draw';
  }
  
  return 'playing';
}

