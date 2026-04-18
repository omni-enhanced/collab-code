export const connectSocket = (roomId) => {
  return new WebSocket(`ws://localhost:8000/ws/${roomId}`);
};