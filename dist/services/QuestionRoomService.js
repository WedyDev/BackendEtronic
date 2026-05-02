"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionRoomService = void 0;
const uuid_1 = require("uuid");
class QuestionRoomService {
    constructor() {
        this.rooms = new Map();
        this.palette = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    }
    getRoom(roomCode) {
        const normalizedRoomCode = roomCode.trim().toUpperCase();
        if (!this.rooms.has(normalizedRoomCode)) {
            this.rooms.set(normalizedRoomCode, []);
        }
        return this.rooms.get(normalizedRoomCode);
    }
    getRandomColor() {
        return this.palette[Math.floor(Math.random() * this.palette.length)];
    }
    getMajorityThreshold(participantCount) {
        return Math.floor(participantCount / 2) + 1;
    }
    serializeQuestion(question, participantCount) {
        return {
            id: question.id,
            text: question.text,
            timestamp: question.timestamp,
            isAnswered: question.isAnswered,
            displayColor: question.displayColor,
            answers: question.answers.map((answer) => ({
                id: answer.id,
                text: answer.text,
                timestamp: answer.timestamp,
                displayColor: answer.displayColor,
            })),
            skipVotes: question.skipVotes.size,
            skipThreshold: this.getMajorityThreshold(Math.max(participantCount, 1)),
        };
    }
    getQuestions(roomCode, participantCount) {
        return this.getRoom(roomCode).map((question) => this.serializeQuestion(question, participantCount));
    }
    addQuestion(roomCode, text) {
        const room = this.getRoom(roomCode);
        const question = {
            id: (0, uuid_1.v4)(),
            text: text.trim(),
            timestamp: new Date(),
            isAnswered: false,
            displayColor: this.getRandomColor(),
            answers: [],
            skipVotes: new Set(),
        };
        room.unshift(question);
    }
    addAnswer(roomCode, questionId, text) {
        const question = this.getRoom(roomCode).find((item) => item.id === questionId);
        if (!question) {
            return false;
        }
        const answer = {
            id: (0, uuid_1.v4)(),
            text: text.trim(),
            timestamp: new Date(),
            displayColor: this.getRandomColor(),
        };
        question.answers.push(answer);
        question.isAnswered = true;
        return true;
    }
    voteSkip(roomCode, questionId, userId, participantCount) {
        const room = this.getRoom(roomCode);
        const questionIndex = room.findIndex((item) => item.id === questionId);
        if (questionIndex < 0) {
            return { skipped: false, questionRemoved: false };
        }
        const question = room[questionIndex];
        question.skipVotes.add(userId);
        const shouldSkip = question.skipVotes.size >= this.getMajorityThreshold(Math.max(participantCount, 1));
        if (shouldSkip) {
            room.splice(questionIndex, 1);
            return { skipped: true, questionRemoved: true };
        }
        return { skipped: false, questionRemoved: false };
    }
    pruneSkippedQuestions(roomCode, participantCount) {
        const room = this.getRoom(roomCode);
        const threshold = this.getMajorityThreshold(Math.max(participantCount, 1));
        const originalLength = room.length;
        for (let index = room.length - 1; index >= 0; index -= 1) {
            if (room[index].skipVotes.size >= threshold) {
                room.splice(index, 1);
            }
        }
        return room.length !== originalLength;
    }
}
exports.QuestionRoomService = QuestionRoomService;
//# sourceMappingURL=QuestionRoomService.js.map