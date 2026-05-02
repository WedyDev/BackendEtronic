import { v4 as uuidv4 } from 'uuid';
import { AnonymousAnswer, AnonymousQuestion } from '../types';

interface InternalAnonymousQuestion {
  id: string;
  text: string;
  timestamp: Date;
  isAnswered: boolean;
  displayColor: string;
  answers: InternalAnonymousAnswer[];
  skipVotes: Set<string>;
}

interface InternalAnonymousAnswer {
  id: string;
  text: string;
  timestamp: Date;
  displayColor: string;
}

export class QuestionRoomService {
  private rooms: Map<string, InternalAnonymousQuestion[]> = new Map();
  private palette = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

  private getRoom(roomCode: string): InternalAnonymousQuestion[] {
    const normalizedRoomCode = roomCode.trim().toUpperCase();

    if (!this.rooms.has(normalizedRoomCode)) {
      this.rooms.set(normalizedRoomCode, []);
    }

    return this.rooms.get(normalizedRoomCode)!;
  }

  private getRandomColor(): string {
    return this.palette[Math.floor(Math.random() * this.palette.length)];
  }

  private getMajorityThreshold(participantCount: number): number {
    return Math.floor(participantCount / 2) + 1;
  }

  private serializeQuestion(question: InternalAnonymousQuestion, participantCount: number): AnonymousQuestion {
    return {
      id: question.id,
      text: question.text,
      timestamp: question.timestamp,
      isAnswered: question.isAnswered,
      displayColor: question.displayColor,
      answers: question.answers.map((answer: InternalAnonymousAnswer): AnonymousAnswer => ({
        id: answer.id,
        text: answer.text,
        timestamp: answer.timestamp,
        displayColor: answer.displayColor,
      })),
      skipVotes: question.skipVotes.size,
      skipThreshold: this.getMajorityThreshold(Math.max(participantCount, 1)),
    };
  }

  getQuestions(roomCode: string, participantCount: number): AnonymousQuestion[] {
    return this.getRoom(roomCode).map((question) => this.serializeQuestion(question, participantCount));
  }

  addQuestion(roomCode: string, text: string): void {
    const room = this.getRoom(roomCode);
    const question: InternalAnonymousQuestion = {
      id: uuidv4(),
      text: text.trim(),
      timestamp: new Date(),
      isAnswered: false,
      displayColor: this.getRandomColor(),
      answers: [],
      skipVotes: new Set<string>(),
    };

    room.unshift(question);
  }

  addAnswer(roomCode: string, questionId: string, text: string): boolean {
    const question = this.getRoom(roomCode).find((item) => item.id === questionId);
    if (!question) {
      return false;
    }

    const answer: InternalAnonymousAnswer = {
      id: uuidv4(),
      text: text.trim(),
      timestamp: new Date(),
      displayColor: this.getRandomColor(),
    };

    question.answers.push(answer);
    question.isAnswered = true;
    return true;
  }

  voteSkip(roomCode: string, questionId: string, userId: string, participantCount: number): { skipped: boolean; questionRemoved: boolean } {
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

  pruneSkippedQuestions(roomCode: string, participantCount: number): boolean {
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