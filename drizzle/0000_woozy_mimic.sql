CREATE TYPE "public"."prioridade" AS ENUM('Baixa', 'Média', 'Alta', 'Crítica');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "atividades" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"projetoId" integer NOT NULL,
	"tarefa" text NOT NULL,
	"responsaveisTarefa" text,
	"status" varchar(50) DEFAULT 'Não Iniciado',
	"progresso" integer DEFAULT 0,
	"quantidadeHoras" integer DEFAULT 0,
	"horasUtilizadas" integer DEFAULT 0,
	"diasPrevistos" integer,
	"dataInicio" timestamp,
	"observacoes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "atividades_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "pessoas" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"nome" varchar(255) NOT NULL,
	"email" varchar(320),
	"telefone" varchar(50),
	"cargo" varchar(100),
	"departamento" varchar(100),
	"setor" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'Ativo',
	"ativo" boolean DEFAULT true NOT NULL,
	"observacoes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pessoas_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "projetos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" text,
	"prioridade" "prioridade" DEFAULT 'Média',
	"responsaveis" text,
	"inicioPlanejado" timestamp,
	"fimPlanejado" timestamp,
	"status" varchar(50) DEFAULT 'Planejado',
	"progresso" integer DEFAULT 0,
	"observacoes" text,
	"aprovacao" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projetos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "subtarefas" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"atividadeId" integer NOT NULL,
	"nome" varchar(255) NOT NULL,
	"responsavel" text,
	"dataInicio" timestamp,
	"dataFim" timestamp,
	"status" varchar(50) DEFAULT 'Não Iniciado',
	"progresso" integer DEFAULT 0,
	"quantidadeHoras" integer DEFAULT 0,
	"horasUtilizadas" integer DEFAULT 0,
	"diasPrevistos" integer,
	"observacoes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subtarefas_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
