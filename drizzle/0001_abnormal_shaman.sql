CREATE TABLE `atividades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`projetoId` int NOT NULL,
	`tarefa` text NOT NULL,
	`responsaveisTarefa` text,
	`status` varchar(50) DEFAULT 'Não Iniciado',
	`progresso` int DEFAULT 0,
	`quantidadeHoras` int DEFAULT 0,
	`horasUtilizadas` int DEFAULT 0,
	`diasPrevistos` int,
	`dataInicio` datetime,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `atividades_id` PRIMARY KEY(`id`),
	CONSTRAINT `atividades_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `pessoas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320),
	`telefone` varchar(50),
	`cargo` varchar(100),
	`departamento` varchar(100),
	`setor` varchar(100) NOT NULL,
	`status` varchar(50) DEFAULT 'Ativo',
	`ativo` boolean NOT NULL DEFAULT true,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pessoas_id` PRIMARY KEY(`id`),
	CONSTRAINT `pessoas_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `projetos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`prioridade` enum('Baixa','Média','Alta','Crítica') DEFAULT 'Média',
	`responsaveis` text,
	`inicioPlanejado` datetime,
	`fimPlanejado` datetime,
	`status` varchar(50) DEFAULT 'Planejado',
	`progresso` int DEFAULT 0,
	`observacoes` text,
	`aprovacao` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projetos_id` PRIMARY KEY(`id`),
	CONSTRAINT `projetos_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `subtarefas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`atividadeId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`responsavel` text,
	`dataInicio` datetime,
	`dataFim` datetime,
	`status` varchar(50) DEFAULT 'Não Iniciado',
	`progresso` int DEFAULT 0,
	`quantidadeHoras` int DEFAULT 0,
	`horasUtilizadas` int DEFAULT 0,
	`diasPrevistos` int,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subtarefas_id` PRIMARY KEY(`id`),
	CONSTRAINT `subtarefas_codigo_unique` UNIQUE(`codigo`)
);
