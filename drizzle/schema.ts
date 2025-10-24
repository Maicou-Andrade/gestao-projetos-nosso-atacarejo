import { pgTable, serial, varchar, text, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";

/**
 * Enums para PostgreSQL
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const prioridadeEnum = pgEnum("prioridade", ["Baixa", "Média", "Alta", "Crítica"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de Pessoas - Gerenciamento de colaboradores
 */
export const pessoas = pgTable("pessoas", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 50 }),
  cargo: varchar("cargo", { length: 100 }),
  departamento: varchar("departamento", { length: 100 }),
  setor: varchar("setor", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).default("Ativo"),
  ativo: boolean("ativo").default(true).notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Pessoa = typeof pessoas.$inferSelect;
export type InsertPessoa = typeof pessoas.$inferInsert;

/**
 * Tabela de Projetos - Controle de projetos
 */
export const projetos = pgTable("projetos", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  prioridade: prioridadeEnum("prioridade").default("Média"),
  responsaveis: text("responsaveis"), // JSON array de IDs de pessoas
  inicioPlanejado: timestamp("inicioPlanejado"),
  fimPlanejado: timestamp("fimPlanejado"),
  status: varchar("status", { length: 50 }).default("Planejado"),
  progresso: integer("progresso").default(0), // 0-100, calculado automaticamente
  observacoes: text("observacoes"),
  aprovacao: boolean("aprovacao").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Projeto = typeof projetos.$inferSelect;
export type InsertProjeto = typeof projetos.$inferInsert;

/**
 * Tabela de Atividades - Tarefas dos projetos
 */
export const atividades = pgTable("atividades", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  projetoId: integer("projetoId").notNull(),
  tarefa: text("tarefa").notNull(),
  responsaveisTarefa: text("responsaveisTarefa"), // JSON array de IDs de pessoas
  status: varchar("status", { length: 50 }).default("Não Iniciado"),
  progresso: integer("progresso").default(0), // -1 a 100
  quantidadeHoras: integer("quantidadeHoras").default(0),
  horasUtilizadas: integer("horasUtilizadas").default(0),
  diasPrevistos: integer("diasPrevistos"),
  dataInicio: timestamp("dataInicio"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Atividade = typeof atividades.$inferSelect;
export type InsertAtividade = typeof atividades.$inferInsert;

/**
 * Tabela de Subtarefas - Subdivisões das atividades
 */
export const subtarefas = pgTable("subtarefas", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  atividadeId: integer("atividadeId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  responsavel: text("responsavel"), // JSON array de IDs de pessoas
  dataInicio: timestamp("dataInicio"),
  dataFim: timestamp("dataFim"),
  status: varchar("status", { length: 50 }).default("Não Iniciado"),
  progresso: integer("progresso").default(0), // -1 a 100
  quantidadeHoras: integer("quantidadeHoras").default(0),
  horasUtilizadas: integer("horasUtilizadas").default(0),
  diasPrevistos: integer("diasPrevistos"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subtarefa = typeof subtarefas.$inferSelect;
export type InsertSubtarefa = typeof subtarefas.$inferInsert;

