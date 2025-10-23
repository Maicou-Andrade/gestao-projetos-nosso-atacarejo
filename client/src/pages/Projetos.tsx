import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Projetos() {
  const { data: projetos, isLoading, refetch } = trpc.projetos.list.useQuery();
  const { data: pessoas } = trpc.pessoas.list.useQuery();
  const createProjeto = trpc.projetos.create.useMutation();
  const updateProjeto = trpc.projetos.update.useMutation();
  const deleteProjeto = trpc.projetos.delete.useMutation();

  const handleAdd = async () => {
    try {
      await createProjeto.mutateAsync({
        codigo: `PROJ${Date.now()}`,
        nome: "",
        prioridade: "Média",
        aprovacao: false,
      });
      await refetch();
      toast.success("Projeto adicionado com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar projeto");
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      await updateProjeto.mutateAsync({ id, ...data });
      await refetch();
      toast.success("Projeto atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar projeto");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente excluir este projeto?")) return;
    try {
      await deleteProjeto.mutateAsync({ id });
      await refetch();
      toast.success("Projeto excluído!");
    } catch (error) {
      toast.error("Erro ao excluir projeto");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">📊 Projetos</h1>
          <p>Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">📊 Projetos</h1>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Projeto
          </Button>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium min-w-[80px]">Código</th>
                <th className="px-4 py-3 text-left text-sm font-medium min-w-[200px]">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-medium min-w-[300px]">Descrição</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Prioridade</th>
                <th className="px-4 py-3 text-left text-sm font-medium min-w-[300px]">Responsáveis</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Início Planejado</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Fim Planejado</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium bg-muted-foreground/10">Progresso %</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Observações</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Aprovação</th>
                <th className="px-4 py-3 text-left text-sm font-medium w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {projetos?.map((projeto) => (
                <tr key={projeto.id} className="border-t hover:bg-muted/50">
                  <td className="px-4 py-2">
                    <Input
                      value={projeto.codigo}
                      onChange={(e) =>
                        handleUpdate(projeto.id, { codigo: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={projeto.nome || ""}
                      onChange={(e) =>
                        handleUpdate(projeto.id, { nome: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={projeto.descricao || ""}
                      onChange={(e) =>
                        handleUpdate(projeto.id, { descricao: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Select
                      value={projeto.prioridade || "Média"}
                      onValueChange={(value) =>
                        handleUpdate(projeto.id, { prioridade: value })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Crítica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={projeto.responsaveis || ""}
                      onChange={(e) =>
                        handleUpdate(projeto.id, { responsaveis: e.target.value })
                      }
                      placeholder="IDs separados por vírgula"
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="date"
                      value={
                        projeto.inicioPlanejado
                          ? new Date(projeto.inicioPlanejado).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleUpdate(projeto.id, { inicioPlanejado: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="date"
                      value={
                        projeto.fimPlanejado
                          ? new Date(projeto.fimPlanejado).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleUpdate(projeto.id, { fimPlanejado: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={projeto.status || ""}
                      onChange={(e) =>
                        handleUpdate(projeto.id, { status: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2 bg-muted-foreground/5">
                    <div className="text-sm text-muted-foreground">
                      {projeto.progresso || 0}%
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={projeto.observacoes || ""}
                      onChange={(e) =>
                        handleUpdate(projeto.id, { observacoes: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={projeto.aprovacao}
                      onChange={(e) =>
                        handleUpdate(projeto.id, { aprovacao: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(projeto.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

