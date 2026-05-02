import { User } from '../types';
export declare class UserService {
    private rooms;
    private socketToUserId;
    private userToRoomCode;
    private colors;
    private colorIndex;
    createUser(username: string, socketId: string, roomCode: string): User;
    getUser(userId: string): User | undefined;
    getUserBySocketId(socketId: string): User | undefined;
    getAllUsers(roomCode?: string): User[];
    removeUser(userId: string): void;
    removeUserBySocketId(socketId: string): User | undefined;
    updateUserCursor(userId: string, position: {
        x: number;
        y: number;
    }): void;
    getUserCount(roomCode?: string): number;
    isUsernameAvailable(username: string, roomCode: string): boolean;
}
//# sourceMappingURL=UserService.d.ts.map