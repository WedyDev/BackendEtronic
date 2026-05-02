import { DrawingAction, ChatMessage } from '../types';
export declare class SharedDataService {
    private rooms;
    private maxDrawingActions;
    private maxChatMessages;
    private getRoom;
    addDrawingAction(action: any, roomCode: string): DrawingAction;
    getDrawingActions(roomCode?: string): DrawingAction[];
    clearDrawing(roomCode: string): void;
    undoLastAction(roomCode: string): DrawingAction | undefined;
    addChatMessage(message: ChatMessage, roomCode: string): void;
    getChatMessages(limit?: number, roomCode?: string): ChatMessage[];
    getStatistics(roomCode?: string): {
        totalDrawingActions: number;
        totalMessages: number;
    };
}
//# sourceMappingURL=SharedDataService.d.ts.map