"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const uuid_1 = require("uuid");
class UserService {
    constructor() {
        this.rooms = new Map();
        this.socketToUserId = new Map();
        this.userToRoomCode = new Map();
        this.colors = [
            '#FF6B6B',
            '#4ECDC4',
            '#45B7D1',
            '#FFA07A',
            '#98D8C8',
            '#F7DC6F',
            '#BB8FCE',
            '#85C1E2',
        ];
        this.colorIndex = 0;
    }
    createUser(username, socketId, roomCode) {
        const userId = (0, uuid_1.v4)();
        const normalizedRoomCode = roomCode.trim().toUpperCase();
        const user = {
            id: userId,
            username,
            socketId,
            roomCode: normalizedRoomCode,
            color: this.colors[this.colorIndex % this.colors.length],
            isActive: true,
            joinedAt: new Date(),
            cursorPosition: { x: 0, y: 0 },
        };
        this.colorIndex++;
        if (!this.rooms.has(normalizedRoomCode)) {
            this.rooms.set(normalizedRoomCode, new Map());
        }
        this.rooms.get(normalizedRoomCode).set(userId, user);
        this.socketToUserId.set(socketId, userId);
        this.userToRoomCode.set(userId, normalizedRoomCode);
        return user;
    }
    getUser(userId) {
        const roomCode = this.userToRoomCode.get(userId);
        if (!roomCode) {
            return undefined;
        }
        return this.rooms.get(roomCode)?.get(userId);
    }
    getUserBySocketId(socketId) {
        const userId = this.socketToUserId.get(socketId);
        if (!userId)
            return undefined;
        return this.getUser(userId);
    }
    getAllUsers(roomCode) {
        if (roomCode) {
            return Array.from(this.rooms.get(roomCode.toUpperCase())?.values() ?? []);
        }
        return Array.from(this.rooms.values()).flatMap((roomUsers) => Array.from(roomUsers.values()));
    }
    removeUser(userId) {
        const roomCode = this.userToRoomCode.get(userId);
        if (!roomCode) {
            return;
        }
        const roomUsers = this.rooms.get(roomCode);
        const user = roomUsers?.get(userId);
        if (!user)
            return;
        roomUsers?.delete(userId);
        this.socketToUserId.delete(user.socketId);
        this.userToRoomCode.delete(userId);
        if (roomUsers && roomUsers.size === 0) {
            this.rooms.delete(roomCode);
        }
    }
    removeUserBySocketId(socketId) {
        const user = this.getUserBySocketId(socketId);
        if (user) {
            this.removeUser(user.id);
            return user;
        }
        return undefined;
    }
    updateUserCursor(userId, position) {
        const user = this.getUser(userId);
        if (user) {
            user.cursorPosition = position;
        }
    }
    getUserCount(roomCode) {
        if (roomCode) {
            return this.rooms.get(roomCode.toUpperCase())?.size ?? 0;
        }
        return Array.from(this.rooms.values()).reduce((sum, roomUsers) => sum + roomUsers.size, 0);
    }
    isUsernameAvailable(username, roomCode) {
        const users = this.rooms.get(roomCode.toUpperCase());
        if (!users) {
            return true;
        }
        const normalizedUsername = username.trim().toLowerCase();
        return !Array.from(users.values()).some((user) => user.username.trim().toLowerCase() === normalizedUsername);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map