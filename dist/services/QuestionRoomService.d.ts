import { AnonymousQuestion } from '../types';
export declare class QuestionRoomService {
    private rooms;
    private palette;
    private getRoom;
    private getRandomColor;
    private getMajorityThreshold;
    private serializeQuestion;
    getQuestions(roomCode: string, participantCount: number): AnonymousQuestion[];
    addQuestion(roomCode: string, text: string): void;
    addAnswer(roomCode: string, questionId: string, text: string): boolean;
    voteSkip(roomCode: string, questionId: string, userId: string, participantCount: number): {
        skipped: boolean;
        questionRemoved: boolean;
    };
    pruneSkippedQuestions(roomCode: string, participantCount: number): boolean;
}
//# sourceMappingURL=QuestionRoomService.d.ts.map