import { prisma } from '../../config/database.js';
export const projectRepository = {
  list(ownerId: string, skip: number, take: number) { return prisma.project.findMany({ where: { ownerId }, skip, take, orderBy: { updatedAt: 'desc' }, include: { workspace: true, setting: true } }); },
  count(ownerId: string) { return prisma.project.count({ where: { ownerId } }); },
  find(ownerId: string, id: string) { return prisma.project.findFirst({ where: { id, ownerId }, include: { workspace: true, setting: true } }); },
  create(ownerId: string, data: { name: string; sourceType: 'ZIP'|'GITHUB'|'PASTE'; repositoryUrl?: string; defaultBranch?: string }) { return prisma.project.create({ data: { ownerId, ...data } }); },
  update(id: string, data: Record<string, unknown>) { return prisma.project.update({ where: { id }, data }); },
  delete(id: string) { return prisma.project.delete({ where: { id } }); }
};
