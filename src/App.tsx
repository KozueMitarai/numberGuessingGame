import React, { useState, useEffect, useCallback } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TICK_RATE_MS = 500;

interface Tetromino {
  shape: number[][];
  color: string;
}

const TETROMINOS: Tetromino[] = [
  { shape: [[1, 1], [1, 1]], color: '#ffd800' },  // O
  { shape: [[1, 1, 1, 1]], color: '#00f0f0' },    // I
  { shape: [[1, 1, 1], [0, 1, 0]], color: '#aa00ff' },  // T
  { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff0000' },  // Z
  { shape: [[0, 1, 1], [1, 1, 0]], color: '#00ff00' },  // S
  { shape: [[1, 1, 1], [1, 0, 0]], color: '#0000ff' },  // J
  { shape: [[1, 1, 1], [0, 0, 1]], color: '#ff7f00' },  // L
];

const createEmptyBoard = (): (string | 0)[][] => 
  Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));

const Tetris: React.FC = () => {
  const [board, setBoard] = useState<(string | 0)[][]>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const spawnNewPiece = useCallback(() => {
    const newPiece = TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];
    setCurrentPiece(newPiece);
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
  }, []);

  const isValidMove = useCallback((piece: Tetromino, newX: number, newY: number): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = newX + x;
          const boardY = newY + y;
          if (
            boardX < 0 || boardX >= BOARD_WIDTH ||
            boardY >= BOARD_HEIGHT ||
            (boardY >= 0 && board[boardY][boardX] !== 0)
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }, [board]);

  const mergePieceToBoard = useCallback(() => {
    if (!currentPiece) return;
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          newBoard[position.y + y][position.x + x] = currentPiece.color;
        }
      }
    }
    setBoard(newBoard);
  }, [board, currentPiece, position]);

  const moveDown = useCallback(() => {
    if (currentPiece && isValidMove(currentPiece, position.x, position.y + 1)) {
      setPosition(prev => ({ ...prev, y: prev.y + 1 }));
    } else if (currentPiece) {
      mergePieceToBoard();
      spawnNewPiece();
    }
  }, [currentPiece, position, isValidMove, mergePieceToBoard, spawnNewPiece]);

  const moveHorizontally = useCallback((direction: number) => {
    if (currentPiece && isValidMove(currentPiece, position.x + direction, position.y)) {
      setPosition(prev => ({ ...prev, x: prev.x + direction }));
    }
  }, [currentPiece, position, isValidMove]);

  const rotate = useCallback(() => {
    if (!currentPiece) return;
    const rotatedPiece: Tetromino = {
      ...currentPiece,
      shape: currentPiece.shape[0].map((_, index) =>
        currentPiece.shape.map(row => row[index]).reverse()
      )
    };
    if (isValidMove(rotatedPiece, position.x, position.y)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, position, isValidMove]);

  const checkLines = useCallback(() => {
    let newBoard = board.filter(row => row.some(cell => cell === 0));
    let linesCleared = BOARD_HEIGHT - newBoard.length;
    let newScore = score + linesCleared * 100;
    setScore(newScore);
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }
    setBoard(newBoard);
  }, [board, score]);

  useEffect(() => {
    if (!currentPiece) spawnNewPiece();
  }, [currentPiece, spawnNewPiece]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowLeft': moveHorizontally(-1); break;
        case 'ArrowRight': moveHorizontally(1); break;
        case 'ArrowDown': moveDown(); break;
        case 'ArrowUp': rotate(); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameOver, moveHorizontally, moveDown, rotate]);

  useEffect(() => {
    if (gameOver) return;

    const gameLoop = setInterval(() => {
      moveDown();
      checkLines();
    }, TICK_RATE_MS);

    return () => {
      clearInterval(gameLoop);
    };
  }, [gameOver, moveDown, checkLines]);

  useEffect(() => {
    if (currentPiece && !isValidMove(currentPiece, position.x, position.y)) {
      setGameOver(true);
    }
  }, [currentPiece, position, isValidMove]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f0f0f0'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Tetris</h1>
      <div style={{ 
        border: '4px solid #333', 
        backgroundColor: 'white',
        display: 'inline-block'
      }}>
        {board.map((row, y) => (
          <div key={y} style={{ display: 'flex' }}>
            {row.map((cell, x) => (
              <div
                key={x}
                style={{
                  width: '20px',
                  height: '20px',
                  border: '1px solid #ccc',
                  backgroundColor: cell || (
                    currentPiece &&
                    y >= position.y &&
                    y < position.y + currentPiece.shape.length &&
                    x >= position.x &&
                    x < position.x + currentPiece.shape[0].length &&
                    currentPiece.shape[y - position.y][x - position.x]
                      ? currentPiece.color
                      : 'white'
                  )
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem', fontSize: '1.25rem' }}>Score: {score}</div>
      {gameOver && <div style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'red' }}>Game Over!</div>}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="App">
      <Tetris />
    </div>
  );
};

export default App;