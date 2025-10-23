import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, datetime } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de Pessoas - Gerenciamento de colaboradores
 */
export const pessoas = mysqlTable("pessoas", {
  id: int("id").autoincrement().primaryKey(),
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pessoa = typeof pessoas.$inferSelect;
export type InsertPessoa = typeof pessoas.$inferInsert;

/**
 * Tabela de Projetos - Controle de projetos
 */
export const projetos = mysqlTable("projetos", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  prioridade: mysqlEnum("prioridade", ["Baixa", "Média", "Alta", "Crítica"]).default("Média"),
  responsaveis: text("responsaveis"), // JSON array de IDs de pessoas
  inicioPlanejado: datetime("inicioPlanejado"),
  fimPlanejado: datetime("fimPlanejado"),
  status: varchar("status", { length: 50 }).default("Planejado"),
  progresso: int("progresso").default(0), // 0-100, calculado automaticamente
  observacoes: text("observacoes"),
  aprovacao: boolean("aprovacao").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Projeto = typeof projetos.$inferSelect;
export type InsertProjeto = typeof projetos.$inferInsert;

/**
 * Tabela de Atividades - Tarefas dos projetos
 */
export const atividades = mysqlTable("atividades", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  projetoId: int("projetoId").notNull(),
  tarefa: text("tarefa").notNull(),
  responsaveisTarefa: text("responsaveisTarefa"), // JSON array de IDs de pessoas
  status: varchar("status", { length: 50 }).default("Não Iniciado"),
  progresso: int("progresso").default(0), // -1 a 100
  quantidadeHoras: int("quantidadeHoras").default(0),
  horasUtilizadas: int("horasUtilizadas").default(0),
  diasPrevistos: int("diasPrevistos"),
  dataInicio: datetime("dataInicio"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Atividade = typeof atividades.$inferSelect;
export type InsertAtividade = typeof atividades.$inferInsert;

/**
 * Tabela de Subtarefas - Subdivisões das atividades
 */
export const subtarefas = mysqlTable("subtarefas", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  atividadeId: int("atividadeId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  responsavel: text("responsavel"), // JSON array de IDs de pessoas
  dataInicio: datetime("dataInicio"),
  dataFim: datetime("dataFim"),
  status: varchar("status", { length: 50 }).default("Não Iniciado"),
  progresso: int("progresso").default(0), // -1 a 100
  quantidadeHoras: int("quantidadeHoras").default(0),
  horasUtilizadas: int("horasUtilizadas").default(0),
  diasPrevistos: int("diasPrevistos"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subtarefa = typeof subtarefas.$inferSelect;
export type InsertSubtarefa = typeof subtarefas.$inferInsert;

