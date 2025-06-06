// src/App.tsx
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { ref, set, onValue, remove } from "firebase/database";
import { v4 as uuidv4 } from "uuid";

interface Player {
  x: number;
  y: number;
  color: string;
}

const id = uuidv4();
const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
const initialPosition: Omit<Player, "color"> = { x: 100, y: 100 };

function App() {
  const [players, setPlayers] = useState<Record<string, Player>>({});

  useEffect(() => {
    // 1. Write this player’s initial data
    const playerRef = ref(db, `players/${id}`);
    set(playerRef, { ...initialPosition, color: randomColor });

    // 2. Subscribe to "players" node in Realtime Database
    const unsubscribe = onValue(ref(db, "players"), (snapshot) => {
      const data = snapshot.val() || {};
      setPlayers(data);
    });

    // 3. Clean up on unmount or page reload
    const handleBeforeUnload = () => {
      remove(playerRef);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Remove this player's entry
      remove(playerRef);
      // Detach the onValue listener
      unsubscribe();
      // Remove the unload listener
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    // Move handler updates this player’s position in Firebase
    const handleMove = (e: KeyboardEvent) => {
      const dx = (e.key === "ArrowRight" ? 1 : 0) - (e.key === "ArrowLeft" ? 1 : 0);
      const dy = (e.key === "ArrowDown" ? 1 : 0) - (e.key === "ArrowUp" ? 1 : 0);

      if (dx !== 0 || dy !== 0) {
        const player = players[id];
        if (!player) return;

        const newPos: Player = {
          x: player.x + dx * 10,
          y: player.y + dy * 10,
          color: player.color,
        };
        set(ref(db, `players/${id}`), newPos);
      }
    };

    window.addEventListener("keydown", handleMove);
    return () => {
      window.removeEventListener("keydown", handleMove);
    };
  }, [players]);

  // Inline styles for simplicity
  const containerStyle: React.CSSProperties = {
    display: "flex",
    height: "100vh",
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
  };

  const sidebarStyle: React.CSSProperties = {
    width: "200px",
    backgroundColor: "#f5f5f5",
    borderRight: "1px solid #ddd",
    padding: "10px",
    overflowY: "auto",
  };

  const sidebarHeaderStyle: React.CSSProperties = {
    marginBottom: "10px",
    fontWeight: "bold",
    fontSize: "16px",
    textAlign: "center",
  };

  const playerItemStyle: (isSelf: boolean) => React.CSSProperties = (isSelf) => ({
    display: "flex",
    alignItems: "center",
    padding: "5px",
    marginBottom: "5px",
    backgroundColor: isSelf ? "#e0ffe0" : "#fff",
    borderRadius: "4px",
    border: isSelf ? "1px solid #4caf50" : "1px solid #ccc",
  });

  const colorBoxStyle: (color: string) => React.CSSProperties = (color) => ({
    width: "16px",
    height: "16px",
    backgroundColor: color,
    borderRadius: "3px",
    marginRight: "8px",
    border: "1px solid #999",
  });

  const gameAreaStyle: React.CSSProperties = {
    flex: 1,
    position: "relative",
    backgroundColor: "#fafafa",
  };

  return (
    <div style={containerStyle}>
      {/* Sidebar with player list */}
      <div style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>Players</div>
        {Object.entries(players).map(([pid, player]) => {
          const isSelf = pid === id;
          return (
            <div key={pid} style={playerItemStyle(isSelf)}>
              <div style={colorBoxStyle(player.color)} />
              <div>
                <div style={{ fontSize: "14px" }}>{isSelf ? "You" : pid.slice(0, 6)}</div>
                <div style={{ fontSize: "12px", color: "#555" }}>
                  ({player.x}, {player.y})
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Game area */}
      <div style={gameAreaStyle}>
        {Object.entries(players).map(([pid, player]) => (
          <div
            key={pid}
            style={{
              position: "absolute",
              left: player.x,
              top: player.y,
              width: 30,
              height: 30,
              backgroundColor: player.color,
              borderRadius: 4,
              border: pid === id ? "2px solid black" : "none",
              transition: "left 0.1s, top 0.1s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
