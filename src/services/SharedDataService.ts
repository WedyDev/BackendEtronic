import { v4 as uuidv4 } from 'uuid';
import { DrawingAction, ChatMessage } from '../types';

export class SharedDataService {
  private rooms: Map<string, { drawingActions: DrawingAction[]; chatMessages: ChatMessage[] }> = new Map();
  private maxDrawingActions = 1000; // Límite de acciones para no sobrecargar memoria
  private maxChatMessages = 500;

  private getRoom(roomCode: string): { drawingActions: DrawingAction[]; chatMessages: ChatMessage[] } {
    const normalizedRoomCode = roomCode.trim().toUpperCase();

    if (!this.rooms.has(normalizedRoomCode)) {
      this.rooms.set(normalizedRoomCode, {
        drawingActions: [],
        chatMessages: [],
      });
    }

    return this.rooms.get(normalizedRoomCode)!;
  }

  addDrawingAction(action: any, roomCode: string): DrawingAction {
    const room = this.getRoom(roomCode);
    const drawingAction: DrawingAction = {
      id: uuidv4(),
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

  getDrawingActions(roomCode?: string): DrawingAction[] {
    if (!roomCode) {
      return Array.from(this.rooms.values()).flatMap((room) => room.drawingActions);
    }

    return [...this.getRoom(roomCode).drawingActions];
  }

  clearDrawing(roomCode: string): void {
    this.getRoom(roomCode).drawingActions = [];
  }

  undoLastAction(roomCode: string): DrawingAction | undefined {
    const room = this.getRoom(roomCode);
    if (room.drawingActions.length > 0) {
      return room.drawingActions.pop();
    }
    return undefined;
  }

  addChatMessage(message: ChatMessage, roomCode: string): void {
    const room = this.getRoom(roomCode);
    room.chatMessages.push(message);

    // Mantener límite de mensajes
    if (room.chatMessages.length > this.maxChatMessages) {
      room.chatMessages.shift();
    }
  }

  getChatMessages(limit: number = 50, roomCode?: string): ChatMessage[] {
    if (!roomCode) {
      const allMessages = Array.from(this.rooms.values()).flatMap((room) => room.chatMessages);
      const startIndex = Math.max(0, allMessages.length - limit);
      return allMessages.slice(startIndex);
    }

    const roomMessages = this.getRoom(roomCode).chatMessages;
    const startIndex = Math.max(0, roomMessages.length - limit);
    return roomMessages.slice(startIndex);
  }

  getStatistics(roomCode?: string): {
    totalDrawingActions: number;
    totalMessages: number;
  } {
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
