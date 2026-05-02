"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedDataService = void 0;
const uuid_1 = require("uuid");
class SharedDataService {
    constructor() {
        this.rooms = new Map();
        this.maxDrawingActions = 1000; // Límite de acciones para no sobrecargar memoria
        this.maxChatMessages = 500;
    }
    getRoom(roomCode) {
        const normalizedRoomCode = roomCode.trim().toUpperCase();
        if (!this.rooms.has(normalizedRoomCode)) {
            this.rooms.set(normalizedRoomCode, {
                drawingActions: [],
                chatMessages: [],
            });
        }
        return this.rooms.get(normalizedRoomCode);
    }
    addDrawingAction(action, roomCode) {
        const room = this.getRoom(roomCode);
        const drawingAction = {
            id: (0, uuid_1.v4)(),
            userId: action.userId,
            type: action.type,
            data: action.data,
            timestamp: new Date(),
        };
        room.drawingActions.push(drawingAction);
        // Mantener límite de acciones
        if (room.drawingActions.length > this.maxDrawingActions) {
            room.drawingActions.shift();
        }
        return drawingAction;
    }
    getDrawingActions(roomCode) {
        if (!roomCode) {
            return Array.from(this.rooms.values()).flatMap((room) => room.drawingActions);
        }
        return [...this.getRoom(roomCode).drawingActions];
    }
    clearDrawing(roomCode) {
        this.getRoom(roomCode).drawingActions = [];
    }
    undoLastAction(roomCode) {
        const room = this.getRoom(roomCode);
        if (room.drawingActions.length > 0) {
            return room.drawingActions.pop();
        }
        return undefined;
    }
    addChatMessage(message, roomCode) {
        const room = this.getRoom(roomCode);
        room.chatMessages.push(message);
        // Mantener límite de mensajes
        if (room.chatMessages.length > this.maxChatMessages) {
            room.chatMessages.shift();
        }
    }
    getChatMessages(limit = 50, roomCode) {
        if (!roomCode) {
            const allMessages = Array.from(this.rooms.values()).flatMap((room) => room.chatMessages);
            const startIndex = Math.max(0, allMessages.length - limit);
            return allMessages.slice(startIndex);
        }
        const roomMessages = this.getRoom(roomCode).chatMessages;
        const startIndex = Math.max(0, roomMessages.length - limit);
        return roomMessages.slice(startIndex);
    }
    getStatistics(roomCode) {
        if (roomCode) {
            const room = this.getRoom(roomCode);
            return {
                totalDrawingActions: room.drawingActions.length,
                totalMessages: room.chatMessages.length,
            };
        }
        const totalDrawingActions = Array.from(this.rooms.values()).reduce((sum, room) => sum + room.drawingActions.length, 0);
        const totalMessages = Array.from(this.rooms.values()).reduce((sum, room) => sum + room.chatMessages.length, 0);
        return {
            totalDrawingActions,
            totalMessages,
        };
    }
}
exports.SharedDataService = SharedDataService;
//# sourceMappingURL=SharedDataService.js.map