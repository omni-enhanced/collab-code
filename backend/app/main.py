from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Header
from fastapi.middleware.cors import CORSMiddleware
import json

from auth import authenticate, create_token, verify_token
from docker_runner import run_code_in_docker

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# room storage
rooms = {}

# =========================
# 🔌 WebSocket
# =========================
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()

    if room_id not in rooms:
        rooms[room_id] = []

    rooms[room_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
            except:
                continue

            # broadcast
            for conn in rooms[room_id]:
                await conn.send_text(json.dumps(message))

    except WebSocketDisconnect:
        rooms[room_id].remove(websocket)
        if not rooms[room_id]:
            del rooms[room_id]

# =========================
# 🔐 LOGIN API
# =========================
@app.post("/login")
async def login(request: Request):
    data = await request.json()

    username = data.get("username")
    password = data.get("password")

    if not authenticate(username, password):
        return {"error": "Invalid credentials"}

    token = create_token(username)
    return {"token": token}

# =========================
# ▶ EXECUTE API (Protected)
# =========================
@app.post("/execute")
async def execute_code(request: Request, authorization: str = Header(None)):
    if not authorization:
        return {"error": "Token missing"}

    try:
        token = authorization.split(" ")[1]
        verify_token(token)
    except:
        return {"error": "Invalid token"}

    data = await request.json()
    code = data.get("code", "")

    output = run_code_in_docker(code)

    return {"output": output}

# =========================
# ❤️ Health Check
# =========================
@app.get("/")
def root():
    return {"message": "Backend running 🚀"}