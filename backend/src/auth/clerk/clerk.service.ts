import { Injectable } from '@nestjs/common';
import { Clerk } from '@clerk/clerk-sdk-node';

@Injectable()
export class ClerkService {
  private clerk: Clerk;

  constructor() {
    this.clerk = new Clerk({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }

  async verifyToken(token: string) {
    try {
      const payload = await this.clerk.verifyToken(token);
      return payload;
    } catch {
      return null;
    }
  }

  async getUser(clerkId: string) {
    return this.clerk.users.getUser(clerkId);
  }

  async createUser(params: { emailAddress: string; firstName?: string; lastName?: string }) {
    return this.clerk.users.createUser(params);
  }
}
