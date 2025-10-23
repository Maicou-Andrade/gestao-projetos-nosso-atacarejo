import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ===== PESSOAS =====
  pessoas: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllPessoas();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPessoaById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        codigo: z.string(),
        nome: z.string(),
        email: z.string().optional(),
        telefone: z.string().optional(),
        cargo: z.string().optional(),
        departamento: z.string().optional(),
        setor: z.string(),
        status: z.string().optional(),
        ativo: z.boolean().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createPessoa(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        codigo: z.string().optional(),
        nome: z.string().optional(),
        email: z.string().optional(),
        telefone: z.string().optional(),
        cargo: z.string().optional(),
        departamento: z.string().optional(),
        setor: z.string().optional(),
        status: z.string().optional(),
        ativo: z.boolean().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updatePessoa(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePessoa(input.id);
        return { success: true };
      }),
  }),

  // ===== PROJETOS =====
  projetos: router({
    list: protectedProcedure.query(async () => {
      const projetosList = await db.getAllProjetos();
      // Calcular progresso para cada projeto
      const projetosComProgresso = await Promise.all(
        projetosList.map(async (projeto) => {
          const progresso = await db.calcularProgressoProjeto(projeto.id);
          return { ...projeto, progresso };
        })
      );
      return projetosComProgresso;
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjetoById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        codigo: z.string(),
        nome: z.string(),
        descricao: z.string().optional(),
        prioridade: z.enum(["Baixa", "Média", "Alta", "Crítica"]).optional(),
        responsaveis: z.string().optional(), // JSON string
        inicioPlanejado: z.string().optional(),
        fimPlanejado: z.string().optional(),
        status: z.string().optional(),
        observacoes: z.string().optional(),
        aprovacao: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const data: any = { ...input };
        if (input.inicioPlanejado) {
          data.inicioPlanejado = new Date(input.inicioPlanejado);
        }
        if (input.fimPlanejado) {
          data.fimPlanejado = new Date(input.fimPlanejado);
        }
        return await db.createProjeto(data);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        codigo: z.string().optional(),
        nome: z.string().optional(),
        descricao: z.string().optional(),
        prioridade: z.enum(["Baixa", "Média", "Alta", "Crítica"]).optional(),
        responsaveis: z.string().optional(),
        inicioPlanejado: z.string().optional(),
        fimPlanejado: z.string().optional(),
        status: z.string().optional(),
        progresso: z.number().optional(),
        observacoes: z.string().optional(),
        aprovacao: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const data: any = { ...rest };
        if (input.inicioPlanejado) {
          data.inicioPlanejado = new Date(input.inicioPlanejado);
        }
        if (input.fimPlanejado) {
          data.fimPlanejado = new Date(input.fimPlanejado);
        }
        return await db.updateProjeto(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProjeto(input.id);
        return { success: true };
      }),
  }),

  // ===== ATIVIDADES =====
  atividades: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllAtividades();
    }),

    getByProjetoId: protectedProcedure
      .input(z.object({ projetoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAtividadesByProjetoId(input.projetoId);
      }),

    create: protectedProcedure
      .input(z.object({
        codigo: z.string(),
        projetoId: z.number(),
        tarefa: z.string(),
        responsaveisTarefa: z.string().optional(),
        status: z.string().optional(),
        progresso: z.number().optional(),
        quantidadeHoras: z.number().optional(),
        horasUtilizadas: z.number().optional(),
        diasPrevistos: z.number().optional(),
        dataInicio: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const data: any = { ...input };
        if (input.dataInicio) {
          data.dataInicio = new Date(input.dataInicio);
        }
        return await db.createAtividade(data);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        codigo: z.string().optional(),
        projetoId: z.number().optional(),
        tarefa: z.string().optional(),
        responsaveisTarefa: z.string().optional(),
        status: z.string().optional(),
        progresso: z.number().optional(),
        quantidadeHoras: z.number().optional(),
        horasUtilizadas: z.number().optional(),
        diasPrevistos: z.number().optional(),
        dataInicio: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const data: any = { ...rest };
        if (input.dataInicio) {
          data.dataInicio = new Date(input.dataInicio);
        }
        const atividade = await db.updateAtividade(id, data);
        
        // Recalcular progresso do projeto
        if (atividade.projetoId) {
          const progresso = await db.calcularProgressoProjeto(atividade.projetoId);
          await db.updateProjeto(atividade.projetoId, { progresso });
        }
        
        return atividade;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const atividade = await db.getAtividadeById(input.id);
        await db.deleteAtividade(input.id);
        
        // Recalcular progresso do projeto
        if (atividade?.projetoId) {
          const progresso = await db.calcularProgressoProjeto(atividade.projetoId);
          await db.updateProjeto(atividade.projetoId, { progresso });
        }
        
        return { success: true };
      }),
  }),

  // ===== SUBTAREFAS =====
  subtarefas: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllSubtarefas();
    }),

    getByAtividadeId: protectedProcedure
      .input(z.object({ atividadeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSubtarefasByAtividadeId(input.atividadeId);
      }),

    create: protectedProcedure
      .input(z.object({
        codigo: z.string(),
        atividadeId: z.number(),
        nome: z.string(),
        responsavel: z.string().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        status: z.string().optional(),
        progresso: z.number().optional(),
        quantidadeHoras: z.number().optional(),
        horasUtilizadas: z.number().optional(),
        diasPrevistos: z.number().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const data: any = { ...input };
        if (input.dataInicio) {
          data.dataInicio = new Date(input.dataInicio);
        }
        if (input.dataFim) {
          data.dataFim = new Date(input.dataFim);
        }
        return await db.createSubtarefa(data);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        codigo: z.string().optional(),
        atividadeId: z.number().optional(),
        nome: z.string().optional(),
        responsavel: z.string().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        status: z.string().optional(),
        progresso: z.number().optional(),
        quantidadeHoras: z.number().optional(),
        horasUtilizadas: z.number().optional(),
        diasPrevistos: z.number().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const data: any = { ...rest };
        if (input.dataInicio) {
          data.dataInicio = new Date(input.dataInicio);
        }
        if (input.dataFim) {
          data.dataFim = new Date(input.dataFim);
        }
        const subtarefa = await db.updateSubtarefa(id, data);
        
        // Recalcular progresso da atividade e do projeto
        if (subtarefa.atividadeId) {
          const progressoAtividade = await db.calcularProgressoAtividade(subtarefa.atividadeId);
          const atividade = await db.updateAtividade(subtarefa.atividadeId, { progresso: progressoAtividade });
          
          if (atividade.projetoId) {
            const progressoProjeto = await db.calcularProgressoProjeto(atividade.projetoId);
            await db.updateProjeto(atividade.projetoId, { progresso: progressoProjeto });
          }
        }
        
        return subtarefa;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const subtarefa = await db.getSubtarefaById(input.id);
        await db.deleteSubtarefa(input.id);
        
        // Recalcular progresso da atividade e do projeto
        if (subtarefa?.atividadeId) {
          const progressoAtividade = await db.calcularProgressoAtividade(subtarefa.atividadeId);
          const atividade = await db.updateAtividade(subtarefa.atividadeId, { progresso: progressoAtividade });
          
          if (atividade.projetoId) {
            const progressoProjeto = await db.calcularProgressoProjeto(atividade.projetoId);
            await db.updateProjeto(atividade.projetoId, { progresso: progressoProjeto });
          }
        }
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

