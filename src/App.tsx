// src/App.tsx
import { useEffect, useState } from "react";
import { db } from "./firebase.ts";
import { ref, set, onValue, remove } from "firebase/database";
import { v4 as uuidv4 } from "uuid";

interface Player {
  x: number;
  y: number;
  color: string;
}

const id = uuidv4();
const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
const initialPosition = { x: 100, y: 100 };

function App() {
  const [players, setPlayers] = useState<Record<string, Player>>({});

  useEffect(() => {
    const playerRef = ref(db, `players/${id}`);
    set(playerRef, { ...initialPosition, color: randomColor });

    window.addEventListener("beforeunload", () => {
      remove(playerRef);
    });

    const unsubscribe = onValue(ref(db, "players"), (snapshot) => {
      const data = snapshot.val() || {};
      setPlayers(data);
    });

    return () => {
      remove(playerRef);
    };
  }, []);

  useEffect(() => {
    const handleMove = (e: KeyboardEvent) => {
      const dx = (e.key === "ArrowRight" ? 1 : 0) - (e.key === "ArrowLeft" ? 1 : 0);
      const dy = (e.key === "ArrowDown" ? 1 : 0) - (e.key === "ArrowUp" ? 1 : 0);

      if (dx || dy) {
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
    return () => window.removeEventListener("keydown", handleMove);
  }, [players]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
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
          }}
        />
      ))}
    </div>
  );
}

export default App;
