import { prisma } from '../../config/database.js';

export const authRepository = {
  findByEmail(email: string) { return prisma.user.findUnique({ where: { email } }); },
  findById(id: string) { return prisma.user.findUnique({ where: { id } }); },
  create(data: { email: string; passwordHash: string; displayName: string }) { return prisma.user.create({ data, select: { id: true, email: true, displayName: true, role: true } }); }
};
