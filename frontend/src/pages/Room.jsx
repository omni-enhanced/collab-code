import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { connectSocket } from "../services/socket";
import { runCode } from "../services/api";

const getRandomColor = () => {
  const colors = ["red", "blue", "green", "orange", "purple"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Room = () => {
  const [code, setCode] = useState("// Start coding...");
  const [output, setOutput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const editorRef = useRef(null);

  const userId = useRef("user_" + Math.random().toString(36).substr(2, 5));
  const userColor = useRef(getRandomColor());

  // 🔌 Join Room
  const joinRoom = () => {
    if (!roomId) return alert("Enter Room ID");

    const ws = connectSocket(roomId);
    socketRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // CODE SYNC
      if (message.type === "code" && message.user !== userId.current) {
        setCode(message.value);
      }

      // CURSOR SYNC
      if (message.type === "cursor") {
        showRemoteCursor(message);
      }
    };

    ws.onclose = () => setConnected(false);

    setJoined(true);
  };

  // ✏️ Handle Code Change
  const handleChange = (value) => {
    const newCode = value || "";
    setCode(newCode);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "code",
          user: userId.current,
          value: newCode,
        })
      );
    }
  };

  // 🧠 Cursor Tracking
  const handleCursor = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "cursor",
            user: userId.current,
            position: e.position,
            color: userColor.current,
          })
        );
      }
    });
  };

  // 🎯 Show Remote Cursor
  const showRemoteCursor = (data) => {
    if (!editorRef.current) return;

    const decoration = [
      {
        range: new window.monaco.Range(
          data.position.lineNumber,
          data.position.column,
          data.position.lineNumber,
          data.position.column + 1
        ),
        options: {
          className: `cursor-${data.user}`,
          stickiness: 1,
        },
      },
    ];

    const style = document.createElement("style");
    style.innerHTML = `
      .cursor-${data.user} {
        border-left: 2px solid ${data.color};
        margin-left: -1px;
      }
    `;
    document.head.appendChild(style);

    editorRef.current.deltaDecorations([], decoration);
  };

  // ▶ Run Code
  const handleRun = async () => {
    const result = await runCode(code);
    setOutput(result);
  };

  useEffect(() => {
    return () => socketRef.current?.close();
  }, []);

  // 🔐 Join Screen
  if (!joined) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Join Room</h2>
        <input
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={joinRoom}>Join</button>
      </div>
    );
  }

  // 🧩 Editor Screen
  return (
    <div style={{ padding: "20px" }}>
      <h2>Room: {roomId}</h2>

      <p>
        Status:{" "}
        <span style={{ color: connected ? "green" : "red" }}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </p>

      <Editor
        height="400px"
        defaultLanguage="python"
        value={code}
        onChange={handleChange}
        onMount={(editor) => handleCursor(editor)}
        theme="vs-dark"
      />

      <button onClick={handleRun}>Run Code</button>

      <h3>Output:</h3>
      <pre>{output}</pre>
    </div>
  );
};

export default Room;