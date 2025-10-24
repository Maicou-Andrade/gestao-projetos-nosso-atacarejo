import { eq, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { 
  InsertUser, 
  users, 
  pessoas, 
  Pessoa, 
  InsertPessoa,
  projetos,
  Projeto,
  InsertProjeto,
  atividades,
  Atividade,
  InsertAtividade,
  subtarefas,
  Subtarefa,
  InsertSubtarefa
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== PESSOAS =====

export async function getAllPessoas(): Promise<Pessoa[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(pessoas);
}

export async function getPessoaById(id: number): Promise<Pessoa | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pessoas).where(eq(pessoas.id, id)).limit(1);
  return result[0];
}

export async function createPessoa(data: InsertPessoa): Promise<Pessoa> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pessoas).values(data).returning();
  return result[0];
}

export async function updatePessoa(id: number, data: Partial<InsertPessoa>): Promise<Pessoa> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(pessoas).set(data).where(eq(pessoas.id, id)).returning();
  return result[0];
}

export async function deletePessoa(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pessoas).where(eq(pessoas.id, id));
}

// ===== PROJETOS =====

export async function getAllProjetos(): Promise<Projeto[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projetos);
}

export async function getProjetoById(id: number): Promise<Projeto | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projetos).where(eq(projetos.id, id)).limit(1);
  return result[0];
}

export async function createProjeto(data: InsertProjeto): Promise<Projeto> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projetos).values(data).returning();
  return result[0];
}

export async function updateProjeto(id: number, data: Partial<InsertProjeto>): Promise<Projeto> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(projetos).set(data).where(eq(projetos.id, id)).returning();
  return result[0];
}

export async function deleteProjeto(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projetos).where(eq(projetos.id, id));
}

// ===== ATIVIDADES =====

export async function getAllAtividades(): Promise<Atividade[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(atividades);
}

export async function getAtividadesByProjetoId(projetoId: number): Promise<Atividade[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(atividades).where(eq(atividades.projetoId, projetoId));
}

export async function getAtividadeById(id: number): Promise<Atividade | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(atividades).where(eq(atividades.id, id)).limit(1);
  return result[0];
}

export async function createAtividade(data: InsertAtividade): Promise<Atividade> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(atividades).values(data).returning();
  return result[0];
}

export async function updateAtividade(id: number, data: Partial<InsertAtividade>): Promise<Atividade> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(atividades).set(data).where(eq(atividades.id, id)).returning();
  return result[0];
}

export async function deleteAtividade(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(atividades).where(eq(atividades.id, id));
}

// ===== SUBTAREFAS =====

export async function getAllSubtarefas(): Promise<Subtarefa[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(subtarefas);
}

export async function getSubtarefasByAtividadeId(atividadeId: number): Promise<Subtarefa[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(subtarefas).where(eq(subtarefas.atividadeId, atividadeId));
}

export async function getSubtarefaById(id: number): Promise<Subtarefa | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subtarefas).where(eq(subtarefas.id, id)).limit(1);
  return result[0];
}

export async function createSubtarefa(data: InsertSubtarefa): Promise<Subtarefa> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(subtarefas).values(data).returning();
  return result[0];
}

export async function updateSubtarefa(id: number, data: Partial<InsertSubtarefa>): Promise<Subtarefa> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(subtarefas).set(data).where(eq(subtarefas.id, id)).returning();
  return result[0];
}

export async function deleteSubtarefa(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(subtarefas).where(eq(subtarefas.id, id));
}

// ===== FUNÇÕES AUXILIARES =====

export async function calcularProgressoProjeto(projetoId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const atividadesDoProjeto = await getAtividadesByProjetoId(projetoId);
  if (atividadesDoProjeto.length === 0) return 0;
  
  let totalProgresso = 0;
  for (const atividade of atividadesDoProjeto) {
    const subtarefasDaAtividade = await getSubtarefasByAtividadeId(atividade.id);
    if (subtarefasDaAtividade.length > 0) {
      const somaSubtarefas = subtarefasDaAtividade.reduce((sum, st) => sum + (st.progresso || 0), 0);
      totalProgresso += somaSubtarefas / subtarefasDaAtividade.length;
    } else {
      totalProgresso += atividade.progresso || 0;
    }
  }
  
  return Math.round(totalProgresso / atividadesDoProjeto.length);
}

export async function calcularProgressoAtividade(atividadeId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const subtarefasDaAtividade = await getSubtarefasByAtividadeId(atividadeId);
  if (subtarefasDaAtividade.length === 0) {
    const atividade = await getAtividadeById(atividadeId);
    return atividade?.progresso || 0;
  }
  
  const somaSubtarefas = subtarefasDaAtividade.reduce((sum, st) => sum + (st.progresso || 0), 0);
  return Math.round(somaSubtarefas / subtarefasDaAtividade.length);
}

export function calcularStatus(progresso: number): string {
  if (progresso === -1) return "Cancelado";
  if (progresso === 0) return "Não Iniciado";
  if (progresso > 0 && progresso < 100) return "Em Andamento";
  if (progresso === 100) return "Concluído";
  return "Não Iniciado";
}

export async function calcularEstatisticasProjeto(projetoId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const atividadesDoProjeto = await getAtividadesByProjetoId(projetoId);
  
  const totalTarefas = atividadesDoProjeto.length;
  const emAndamento = atividadesDoProjeto.filter(a => a.status === "Em Andamento").length;
  const finalizadas = atividadesDoProjeto.filter(a => a.status === "Concluído" || a.status === "Finalizado").length;
  const naoIniciado = atividadesDoProjeto.filter(a => a.status === "Não Iniciado").length;
  const cancelado = atividadesDoProjeto.filter(a => a.status === "Cancelado").length;
  
  const qtdHoras = atividadesDoProjeto.reduce((sum, a) => sum + (a.quantidadeHoras || 0), 0);
  
  const datasInicio = atividadesDoProjeto
    .filter(a => a.dataInicio)
    .map(a => new Date(a.dataInicio!).getTime());
  const inicioReal = datasInicio.length > 0 ? new Date(Math.min(...datasInicio)) : null;
  
  let fimPrevisto: Date | null = null;
  for (const atividade of atividadesDoProjeto) {
    if (atividade.dataInicio && atividade.diasPrevistos) {
      const fimAtividade = new Date(atividade.dataInicio);
      fimAtividade.setDate(fimAtividade.getDate() + atividade.diasPrevistos);
      if (!fimPrevisto || fimAtividade > fimPrevisto) {
        fimPrevisto = fimAtividade;
      }
    }
  }
  
  const progressoGeral = await calcularProgressoProjeto(projetoId);
  
  const hoje = new Date();
  let dentroPrazo = 0;
  let foraPrazo = 0;
  
  for (const atividade of atividadesDoProjeto) {
    if (atividade.dataInicio && atividade.diasPrevistos) {
      const fimPrevisto = new Date(atividade.dataInicio);
      fimPrevisto.setDate(fimPrevisto.getDate() + atividade.diasPrevistos);
      
      if (atividade.status === "Concluído" || atividade.status === "Finalizado") {
        dentroPrazo++;
      } else if (hoje > fimPrevisto) {
        foraPrazo++;
      } else {
        dentroPrazo++;
      }
    }
  }
  
  return {
    totalTarefas,
    emAndamento,
    finalizadas,
    naoIniciado,
    cancelado,
    qtdHoras,
    inicioReal,
    fimPrevisto,
    progressoGeral,
    dentroPrazo,
    foraPrazo,
  };
}

