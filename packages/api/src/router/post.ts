import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.post.findMany({
      orderBy: { id: "desc" },
      include: {
        likes: true,
        _count: {
          select: { likes: true },
        },
      },
    });
  }),
  byId: publicProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.post.findFirst({ where: { id: input } });
  }),
  count: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.post.count();
  }),
  like: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findFirst({ where: { id: input } });

      if (post) {
        return ctx.prisma.like.create({
          data: { userId: ctx.session.user.id, postId: post.id },
        });
      }
    }),
  create: publicProcedure
    .input(z.object({ title: z.string().min(1), content: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.post.create({ data: input });
    }),
  delete: publicProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.prisma.post.delete({ where: { id: input } });
  }),
});
