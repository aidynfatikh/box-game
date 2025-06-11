// src/App.tsx
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { ref, set, onValue, remove } from "firebase/database";
import { v4 as uuidv4 } from "uuid";

interface Player {
  x: number;
  y: number;
  color: string;
  name: string;
}

const id = uuidv4();
const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
const initialPosition = { x: 100, y: 100 };

function App() {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [name, setName] = useState("");
  const [showNameModal, setShowNameModal] = useState(true);

  // Game area boundaries
  const GAME_WIDTH = 900;
  const GAME_HEIGHT = 600;
  const PLAYER_SIZE = 30;

  useEffect(() => {
    if (!name) return;
    // 1. Write this player's initial data
    const playerRef = ref(db, `players/${id}`);
    set(playerRef, { ...initialPosition, color: randomColor, name });

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
  }, [name]);

  useEffect(() => {
    if (!name) return;
    // Move handler updates this player's position in Firebase
    const handleMove = (e: KeyboardEvent) => {
      const dx =
        (e.key === "ArrowRight" ? 1 : 0) - (e.key === "ArrowLeft" ? 1 : 0);
      const dy =
        (e.key === "ArrowDown" ? 1 : 0) - (e.key === "ArrowUp" ? 1 : 0);

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        const player = players[id];
        if (!player) return;

        // Clamp new position within borders
        let newX = player.x + dx * 10;
        let newY = player.y + dy * 10;
        newX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, newX));
        newY = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, newY));

        const newPos: Player = {
          x: newX,
          y: newY,
          color: player.color,
          name: player.name,
        };
        set(ref(db, `players/${id}`), newPos);
      }
    };

    window.addEventListener("keydown", handleMove);
    return () => {
      window.removeEventListener("keydown", handleMove);
    };
  }, [players, name]);

  // Add Google Font
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    margin: 0,
    padding: 0,
    fontFamily: "Nunito, Arial, sans-serif",
    background: "linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)",
  };

  const headerStyle: React.CSSProperties = {
    width: "100%",
    padding: "24px 0 12px 0",
    background: "linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 32,
    letterSpacing: 1,
    textAlign: "center",
    boxShadow: "0 2px 12px rgba(99,102,241,0.08)",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 12,
  };

  const mainContentStyle: React.CSSProperties = {
    display: "flex",
    flex: 1,
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
    gap: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  };

  const sidebarStyle: React.CSSProperties = {
    width: 240,
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
    padding: "24px 16px 16px 16px",
    marginTop: 24,
    marginBottom: 24,
    overflowY: "auto",
    minHeight: 400,
    maxHeight: 600,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
  };

  const sidebarHeaderStyle: React.CSSProperties = {
    marginBottom: 18,
    fontWeight: 700,
    fontSize: 20,
    textAlign: "center",
    color: "#6366f1",
    letterSpacing: 0.5,
  };

  const playerItemStyle: (isSelf: boolean) => React.CSSProperties = (
    isSelf
  ) => ({
    display: "flex",
    alignItems: "center",
    padding: "10px 8px",
    marginBottom: "10px",
    background: isSelf
      ? "linear-gradient(90deg, #a7f3d0 0%, #f0fdfa 100%)"
      : "#f3f4f6",
    borderRadius: "8px",
    border: isSelf ? "2px solid #06b6d4" : "1px solid #e5e7eb",
    boxShadow: isSelf ? "0 2px 8px rgba(16,185,129,0.08)" : "none",
    fontWeight: isSelf ? 700 : 500,
    color: isSelf ? "#047857" : "#374151",
    transition: "background 0.2s, border 0.2s",
  });

  const colorBoxStyle: (color: string) => React.CSSProperties = (color) => ({
    width: "20px",
    height: "20px",
    backgroundColor: color,
    borderRadius: "5px",
    marginRight: "12px",
    border: "2px solid #6366f1",
    boxShadow: "0 1px 4px rgba(99,102,241,0.10)",
  });

  const gameAreaStyle: React.CSSProperties = {
    flex: 1,
    position: "relative",
    background: "linear-gradient(135deg, #f0fdfa 0%, #e0e7ff 100%)",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    margin: "24px auto",
    border: "5px solid #6366f1",
    borderRadius: 24,
    boxShadow: "0 8px 32px rgba(99,102,241,0.10)",
    boxSizing: "border-box",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // Name input modal
  const modalStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(99,102,241,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(2px)",
  };
  const modalBoxStyle: React.CSSProperties = {
    background: "#fff",
    padding: 40,
    borderRadius: 18,
    boxShadow: "0 8px 32px rgba(99,102,241,0.18)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 320,
    border: "2px solid #6366f1",
  };

  const modalInputStyle: React.CSSProperties = {
    fontSize: 20,
    padding: "12px 16px",
    marginBottom: 24,
    width: "100%",
    borderRadius: 8,
    border: "1.5px solid #a5b4fc",
    outline: "none",
    boxShadow: "0 2px 8px rgba(99,102,241,0.06)",
    fontFamily: "inherit",
    background: "#f3f4f6",
    color: "#374151",
    transition: "border 0.2s",
  };

  const modalButtonStyle: React.CSSProperties = {
    fontSize: 20,
    padding: "10px 36px",
    borderRadius: 8,
    background: "linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)",
    color: "#fff",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(99,102,241,0.10)",
    transition: "background 0.2s, box-shadow 0.2s",
    marginTop: 8,
  };

  const playerBoxStyle = (
    isSelf: boolean,
    color: string
  ): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    top: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    background: `linear-gradient(135deg, ${color} 60%, #fff 100%)`,
    borderRadius: 8,
    border: isSelf ? "3px solid #6366f1" : "2px solid #a5b4fc",
    boxShadow: isSelf
      ? "0 4px 16px rgba(99,102,241,0.18)"
      : "0 2px 8px rgba(99,102,241,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "left 0.1s, top 0.1s, box-shadow 0.2s",
    zIndex: isSelf ? 2 : 1,
  });

  const playerNameTagStyle: React.CSSProperties = {
    color: "#374151",
    fontWeight: 700,
    fontSize: 14,
    background: "rgba(255,255,255,0.92)",
    borderRadius: 6,
    padding: "2px 8px",
    position: "absolute",
    top: -28,
    left: "50%",
    transform: "translateX(-50%)",
    pointerEvents: "none",
    boxShadow: "0 1px 4px rgba(99,102,241,0.10)",
    border: "1.5px solid #a5b4fc",
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>Box Game Online</div>
      {showNameModal && (
        <div style={modalStyle}>
          <form
            style={modalBoxStyle}
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) setShowNameModal(false);
            }}
          >
            <h2 style={{ color: "#6366f1", fontWeight: 800, marginBottom: 18 }}>
              Enter your name
            </h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
              autoFocus
              style={modalInputStyle}
              placeholder="Your name"
            />
            <button
              type="submit"
              style={modalButtonStyle}
              disabled={!name.trim()}
            >
              Start
            </button>
          </form>
        </div>
      )}
      <div style={mainContentStyle}>
        {/* Sidebar with player list */}
        <div style={sidebarStyle}>
          <div style={sidebarHeaderStyle}>Players</div>
          {Object.entries(players).map(([pid, player]) => {
            const isSelf = pid === id;
            return (
              <div key={pid} style={playerItemStyle(isSelf)}>
                <div style={colorBoxStyle(player.color)} />
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700 }}>
                    {player.name || (isSelf ? "You" : pid.slice(0, 6))}
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>
                    ({player.x}, {player.y})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Game area */}
        <div style={gameAreaStyle}>
          {Object.entries(players).map(([pid, player]) => {
            const isSelf = pid === id;
            return (
              <div
                key={pid}
                style={{
                  ...playerBoxStyle(isSelf, player.color),
                  left: player.x,
                  top: player.y,
                }}
              >
                <span style={playerNameTagStyle}>{player.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
