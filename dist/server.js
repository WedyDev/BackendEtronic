"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const UserService_1 = require("./services/UserService");
const SharedDataService_1 = require("./services/SharedDataService");
const QuestionRoomService_1 = require("./services/QuestionRoomService");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Servicios
const userService = new UserService_1.UserService();
const sharedDataService = new SharedDataService_1.SharedDataService();
const questionRoomService = new QuestionRoomService_1.QuestionRoomService();
const normalizeRoomCode = (roomCode) => {
    const normalizedRoomCode = (roomCode || '').trim().toUpperCase();
    if (normalizedRoomCode.length > 0) {
        return normalizedRoomCode;
    }
    let generatedRoomCode = `ROOM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    while (userService.getUserCount(generatedRoomCode) > 0) {
        generatedRoomCode = `ROOM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
    return generatedRoomCode;
};
// Rutas HTTP (API REST)
app.get('/health', (req, res) => {
    const roomCode = typeof req.query.roomCode === 'string' ? normalizeRoomCode(req.query.roomCode) : undefined;
    res.json({
        status: 'ok',
        timestamp: new Date(),
        activeUsers: userService.getUserCount(roomCode),
    });
});
app.get('/api/stats', (req, res) => {
    const roomCode = typeof req.query.roomCode === 'string' ? normalizeRoomCode(req.query.roomCode) : undefined;
    res.json({
        activeUsers: userService.getUserCount(roomCode),
        roomCode,
        users: userService.getAllUsers(roomCode).map((u) => ({
            id: u.id,
            username: u.username,
            color: u.color,
            cursorPosition: u.cursorPosition,
        })),
        stats: sharedDataService.getStatistics(roomCode),
    });
});
app.get('/api/users', (req, res) => {
    const roomCode = typeof req.query.roomCode === 'string' ? normalizeRoomCode(req.query.roomCode) : undefined;
    const users = userService.getAllUsers(roomCode);
    res.json(users);
});
app.get('/api/canvas', (req, res) => {
    const roomCode = typeof req.query.roomCode === 'string' ? normalizeRoomCode(req.query.roomCode) : undefined;
    const actions = sharedDataService.getDrawingActions(roomCode);
    res.json(actions);
});
app.get('/api/messages', (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const roomCode = typeof req.query.roomCode === 'string' ? normalizeRoomCode(req.query.roomCode) : undefined;
    const messages = sharedDataService.getChatMessages(limit, roomCode);
    res.json(messages);
});
app.get('/api/questions', (req, res) => {
    const roomCode = typeof req.query.roomCode === 'string' ? normalizeRoomCode(req.query.roomCode) : undefined;
    const effectiveRoomCode = roomCode || 'GLOBAL';
    res.json(questionRoomService.getQuestions(effectiveRoomCode, userService.getUserCount(roomCode)));
});
// WebSocket Events
io.on('connection', (socket) => {
    console.log(`[CONEXIÓN] Cliente conectado: ${socket.id}`);
    // Evento: Usuario se une
    socket.on('user:join', (username, roomCode, callback) => {
        const sendJoinResponse = (response) => {
            if (typeof callback === 'function') {
                callback(response);
            }
        };
        // Validar nombre de usuario
        if (!username || username.trim().length === 0) {
            sendJoinResponse({ error: 'El nombre de usuario es requerido' });
            return;
        }
        const normalizedRoomCode = normalizeRoomCode(roomCode);
        if (!userService.isUsernameAvailable(username, normalizedRoomCode)) {
            sendJoinResponse({ error: 'El nombre de usuario ya está en uso' });
            return;
        }
        if (username.length > 20) {
            sendJoinResponse({ error: 'El nombre de usuario no puede exceder 20 caracteres' });
            return;
        }
        // Crear usuario
        const user = userService.createUser(username, socket.id, normalizedRoomCode);
        // Unir socket a la sala compartida
        socket.join(`user:${user.id}`);
        socket.join(normalizedRoomCode);
        socket.data.roomCode = normalizedRoomCode;
        socket.data.userId = user.id;
        console.log(`[USUARIO UNIDO] ${username} (${user.id}) - Sala: ${normalizedRoomCode} - Color: ${user.color}`);
        // Notificar a todos los clientes
        io.to(normalizedRoomCode).emit('user:joined', user);
        io.to(normalizedRoomCode).emit('users:list', userService.getAllUsers(normalizedRoomCode));
        // Enviar canvas actual al nuevo usuario
        const currentCanvas = sharedDataService.getDrawingActions(normalizedRoomCode);
        socket.emit('canvas:sync', currentCanvas);
        // Enviar mensajes recientes
        const recentMessages = sharedDataService.getChatMessages(50, normalizedRoomCode);
        socket.emit('chat:messages', recentMessages);
        // Enviar preguntas actuales
        const currentQuestions = questionRoomService.getQuestions(normalizedRoomCode, userService.getUserCount(normalizedRoomCode));
        socket.emit('questions:list', currentQuestions);
        // Callback al cliente
        sendJoinResponse(user);
    });
    const emitQuestions = (roomCode) => {
        const participantCount = userService.getUserCount(roomCode);
        const questions = questionRoomService.getQuestions(roomCode, participantCount);
        io.to(roomCode).emit('questions:list', questions);
    };
    socket.on('question:add', (text, callback) => {
        const sendResponse = (response) => {
            if (typeof callback === 'function') {
                callback(response);
            }
        };
        const user = userService.getUserBySocketId(socket.id);
        if (!user) {
            sendResponse({ error: 'Usuario no registrado en la sala' });
            return;
        }
        if (!text || text.trim().length === 0) {
            sendResponse({ error: 'La pregunta no puede estar vacía' });
            return;
        }
        questionRoomService.addQuestion(user.roomCode, text);
        emitQuestions(user.roomCode);
        sendResponse({});
    });
    socket.on('question:answer', (payload, callback) => {
        const sendResponse = (response) => {
            if (typeof callback === 'function') {
                callback(response);
            }
        };
        const user = userService.getUserBySocketId(socket.id);
        if (!user) {
            sendResponse({ error: 'Usuario no registrado en la sala' });
            return;
        }
        if (!payload?.text || payload.text.trim().length === 0) {
            sendResponse({ error: 'La respuesta no puede estar vacía' });
            return;
        }
        const answered = questionRoomService.addAnswer(user.roomCode, payload.questionId, payload.text);
        if (!answered) {
            sendResponse({ error: 'No se encontró la pregunta' });
            return;
        }
        emitQuestions(user.roomCode);
        sendResponse({});
    });
    socket.on('question:voteSkip', (questionId, callback) => {
        const sendResponse = (response) => {
            if (typeof callback === 'function') {
                callback(response);
            }
        };
        const user = userService.getUserBySocketId(socket.id);
        if (!user) {
            sendResponse({ error: 'Usuario no registrado en la sala' });
            return;
        }
        const result = questionRoomService.voteSkip(user.roomCode, questionId, user.id, userService.getUserCount(user.roomCode));
        if (result.questionRemoved) {
            emitQuestions(user.roomCode);
            sendResponse({ skipped: true });
            return;
        }
        emitQuestions(user.roomCode);
        sendResponse({ skipped: result.skipped });
    });
    // Evento: Movimiento del cursor
    socket.on('cursor:move', (position) => {
        const user = userService.getUserBySocketId(socket.id);
        if (user) {
            userService.updateUserCursor(user.id, position);
            io.to(user.roomCode).emit('cursor:update', {
                userId: user.id,
                username: user.username,
                x: position.x,
                y: position.y,
                color: user.color,
            });
        }
    });
    // Evento: Acción de dibujo
    socket.on('drawing:action', (action) => {
        const user = userService.getUserBySocketId(socket.id);
        if (!user)
            return;
        const drawingAction = sharedDataService.addDrawingAction({
            userId: user.id,
            type: action.type,
            data: action.data,
        }, user.roomCode);
        // Brodcasar a todos los clientes
        io.to(user.roomCode).emit('drawing:action', drawingAction);
        console.log(`[DIBUJO] ${user.username} - Sala: ${user.roomCode} - Tipo: ${action.type} - ID: ${drawingAction.id}`);
    });
    // Evento: Mensaje de chat
    socket.on('chat:send', (messageText) => {
        const user = userService.getUserBySocketId(socket.id);
        if (!user)
            return;
        if (!messageText || messageText.trim().length === 0)
            return;
        const message = {
            id: Math.random().toString(36).substr(2, 9),
            userId: user.id,
            username: user.username,
            message: messageText.trim(),
            timestamp: new Date(),
            userColor: user.color,
        };
        sharedDataService.addChatMessage(message, user.roomCode);
        io.to(user.roomCode).emit('chat:message', message);
        console.log(`[MENSAJE] ${user.username} (${user.roomCode}): ${messageText.substring(0, 50)}`);
    });
    // Evento: Limpiar canvas
    socket.on('canvas:clear', () => {
        const user = userService.getUserBySocketId(socket.id);
        if (user) {
            sharedDataService.clearDrawing(user.roomCode);
            io.to(user.roomCode).emit('canvas:cleared', { userId: user.id, username: user.username });
            console.log(`[CANVAS] ${user.username} limpió el canvas en ${user.roomCode}`);
        }
    });
    // Evento: Desconexión
    socket.on('disconnect', () => {
        const user = userService.removeUserBySocketId(socket.id);
        if (user) {
            console.log(`[DESCONEXIÓN] ${user.username} se desconectó de ${user.roomCode}`);
            io.to(user.roomCode).emit('user:left', user.id);
            io.to(user.roomCode).emit('users:list', userService.getAllUsers(user.roomCode));
            questionRoomService.pruneSkippedQuestions(user.roomCode, userService.getUserCount(user.roomCode));
            emitQuestions(user.roomCode);
        }
    });
    // Evento: Error
    socket.on('error', (error) => {
        console.error(`[ERROR] Socket error:`, error);
    });
});
// Iniciar servidor
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════╗
║   ETRONIC BACKEND - SERVIDOR       ║
║   Escuchando en puerto ${PORT}       ║
╚════════════════════════════════════╝
  `);
    console.log(`
📡 WebSocket disponible en: http://localhost:${PORT}
🌐 API disponible en: http://localhost:${PORT}/api
💻 Health check: http://localhost:${PORT}/health
  `);
});
// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('[ERROR NO CAPTURADO]', error);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[PROMESA RECHAZADA NO MANEJADA]', reason);
});
//# sourceMappingURL=server.js.map