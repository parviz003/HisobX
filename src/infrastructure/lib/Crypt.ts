import bcrypt from 'bcrypt';

export class Crypt {
  static async hash(data: string): Promise<string> {
    return bcrypt.hash(data, 7);
  }

  static async compare(data: string, hashedData: string): Promise<boolean> {
    return bcrypt.compare(data, hashedData);
  }
}
