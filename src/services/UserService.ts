import { v4 as uuidv4 } from 'uuid';
import { User } from '../types';

export class UserService {
  private rooms: Map<string, Map<string, User>> = new Map();
  private socketToUserId: Map<string, string> = new Map();
  private userToRoomCode: Map<string, string> = new Map();
  private colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
  ];
  private colorIndex = 0;

  createUser(username: string, socketId: string, roomCode: string): User {
    const userId = uuidv4();
    const normalizedRoomCode = roomCode.trim().toUpperCase();
    const user: User = {
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

    this.rooms.get(normalizedRoomCode)!.set(userId, user);
    this.socketToUserId.set(socketId, userId);
    this.userToRoomCode.set(userId, normalizedRoomCode);

    return user;
  }

  getUser(userId: string): User | undefined {
    const roomCode = this.userToRoomCode.get(userId);
    if (!roomCode) {
      return undefined;
    }

    return this.rooms.get(roomCode)?.get(userId);
  }

  getUserBySocketId(socketId: string): User | undefined {
    const userId = this.socketToUserId.get(socketId);
    if (!userId) return undefined;

    return this.getUser(userId);
  }

  getAllUsers(roomCode?: string): User[] {
    if (roomCode) {
      return Array.from(this.rooms.get(roomCode.toUpperCase())?.values() ?? []);
    }

    return Array.from(this.rooms.values()).flatMap((roomUsers) => Array.from(roomUsers.values()));
  }

  removeUser(userId: string): void {
    const roomCode = this.userToRoomCode.get(userId);
    if (!roomCode) {
      return;
    }

    const roomUsers = this.rooms.get(roomCode);
    const user = roomUsers?.get(userId);
    if (!user) return;

    roomUsers?.delete(userId);
    this.socketToUserId.delete(user.socketId);
    this.userToRoomCode.delete(userId);

    if (roomUsers && roomUsers.size === 0) {
      this.rooms.delete(roomCode);
    }
  }

  removeUserBySocketId(socketId: string): User | undefined {
    const user = this.getUserBySocketId(socketId);
    if (user) {
      this.removeUser(user.id);
      return user;
    }
    return undefined;
  }

  updateUserCursor(userId: string, position: { x: number; y: number }): void {
    const user = this.getUser(userId);
    if (user) {
      user.cursorPosition = position;
    }
  }

  getUserCount(roomCode?: string): number {
    if (roomCode) {
      return this.rooms.get(roomCode.toUpperCase())?.size ?? 0;
    }

    return Array.from(this.rooms.values()).reduce((sum, roomUsers) => sum + roomUsers.size, 0);
  }

  isUsernameAvailable(username: string, roomCode: string): boolean {
    const users = this.rooms.get(roomCode.toUpperCase());
    if (!users) {
      return true;
    }

    const normalizedUsername = username.trim().toLowerCase();
    return !Array.from(users.values()).some((user) => user.username.trim().toLowerCase() === normalizedUsername);
  }
}
