import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Atividades() {
  const { data: atividades, isLoading, refetch } = trpc.atividades.list.useQuery();
  const { data: projetos } = trpc.projetos.list.useQuery();
  const { data: subtarefas } = trpc.subtarefas.list.useQuery();
  const createAtividade = trpc.atividades.create.useMutation();
  const updateAtividade = trpc.atividades.update.useMutation();
  const deleteAtividade = trpc.atividades.delete.useMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProjetoId, setSelectedProjetoId] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState(1);

  const handleAddBatch = async () => {
    if (!selectedProjetoId) {
      toast.error("Selecione um projeto");
      return;
    }
    try {
      for (let i = 0; i < quantidade; i++) {
        await createAtividade.mutateAsync({
          codigo: `AT${Date.now()}-${i}`,
          projetoId: selectedProjetoId,
          tarefa: "",
          progresso: 0,
        });
      }
      await refetch();
      setIsDialogOpen(false);
      toast.success(`${quantidade} atividade(s) adicionada(s)!`);
    } catch (error) {
      toast.error("Erro ao adicionar atividades");
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      await updateAtividade.mutateAsync({ id, ...data });
      await refetch();
    } catch (error) {
      toast.error("Erro ao atualizar atividade");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente excluir esta atividade?")) return;
    try {
      await deleteAtividade.mutateAsync({ id });
      await refetch();
      toast.success("Atividade excluída!");
    } catch (error) {
      toast.error("Erro ao excluir atividade");
    }
  };

  const getProjetoNome = (projetoId: number) => {
    return projetos?.find((p) => p.id === projetoId)?.nome || "-";
  };

  const getProjetoAprovado = (projetoId: number) => {
    return projetos?.find((p) => p.id === projetoId)?.aprovacao || false;
  };

  const temSubtarefas = (atividadeId: number) => {
    return subtarefas?.some((st) => st.atividadeId === atividadeId) || false;
  };

  const calcularPrevisaoEntrega = (dataInicio: any, diasPrevistos: number | null) => {
    if (!dataInicio || !diasPrevistos) return "";
    const data = new Date(dataInicio);
    data.setDate(data.getDate() + diasPrevistos);
    return data.toISOString().split("T")[0];
  };

  const calcularStatusPrazo = (previsaoEntrega: string) => {
    if (!previsaoEntrega) return "";
    const hoje = new Date();
    const previsao = new Date(previsaoEntrega);
    return previsao >= hoje ? "Dentro do Prazo" : "Fora do Prazo";
  };

  const calcularStatus = (progresso: number) => {
    if (progresso === -1) return "Cancelado";
    if (progresso === 0) return "Não Iniciado";
    if (progresso > 0 && progresso < 100) return "Em Andamento";
    if (progresso === 100) return "Concluído";
    return "Não Iniciado";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">📝 Atividades</h1>
          <p>Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">📝 Atividades</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Atividade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Atividades</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Projeto</label>
                  <Select
                    value={selectedProjetoId?.toString()}
                    onValueChange={(value) => setSelectedProjetoId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projetos?.map((projeto) => (
                        <SelectItem key={projeto.id} value={projeto.id.toString()}>
                          {projeto.codigo} - {projeto.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Quantidade de linhas</label>
                  <Input
                    type="number"
                    min={1}
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                  />
                </div>
                <Button onClick={handleAddBatch} className="w-full">
                  Criar Atividades
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Código</th>
                <th className="px-4 py-3 text-left text-sm font-medium bg-muted-foreground/10">Projeto</th>
                <th className="px-4 py-3 text-left text-sm font-medium min-w-[250px]">Tarefa</th>
                <th className="px-4 py-3 text-left text-sm font-medium min-w-[200px]">Responsáveis</th>
                <th className="px-4 py-3 text-left text-sm font-medium bg-muted-foreground/10">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Progresso %</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Qtd Horas</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Horas Utilizadas</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Diferença</th>
                <th className="px-4 py-3 text-left text-sm font-medium bg-muted-foreground/10">Dias Previstos</th>
                <th className="px-4 py-3 text-left text-sm font-medium bg-muted-foreground/10">Data Início</th>
                <th className="px-4 py-3 text-left text-sm font-medium bg-muted-foreground/10">Previsão Entrega</th>
                <th className="px-4 py-3 text-left text-sm font-medium bg-muted-foreground/10">Status Prazo</th>
                <th className="px-4 py-3 text-left text-sm font-medium min-w-[200px]">Observações</th>
                <th className="px-4 py-3 text-left text-sm font-medium w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {atividades?.map((atividade) => {
                const projetoAprovado = getProjetoAprovado(atividade.projetoId);
                const hasSubtarefas = temSubtarefas(atividade.id);
                const progressoEditavel = projetoAprovado && !hasSubtarefas;
                const previsaoEntrega = calcularPrevisaoEntrega(
                  atividade.dataInicio,
                  atividade.diasPrevistos
                );
                const statusPrazo = calcularStatusPrazo(previsaoEntrega);
                const status = calcularStatus(atividade.progresso || 0);
                const diferenca = (atividade.quantidadeHoras || 0) - (atividade.horasUtilizadas || 0);
                const diferencaColor = diferenca > 0 ? "#059669" : diferenca < 0 ? "#DC2626" : "#000";

                return (
                  <tr key={atividade.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-2">
                      <Input
                        value={atividade.codigo}
                        onChange={(e) =>
                          handleUpdate(atividade.id, { codigo: e.target.value })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2 bg-muted-foreground/5">
                      <div className="text-sm text-muted-foreground">
                        {getProjetoNome(atividade.projetoId)}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={atividade.tarefa || ""}
                        onChange={(e) =>
                          handleUpdate(atividade.id, { tarefa: e.target.value })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={atividade.responsaveisTarefa || ""}
                        onChange={(e) =>
                          handleUpdate(atividade.id, { responsaveisTarefa: e.target.value })
                        }
                        placeholder="IDs separados por vírgula"
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2 bg-muted-foreground/5">
                      <div className="text-sm text-muted-foreground">{status}</div>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="text"
                        value={atividade.progresso || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val >= -1 && val <= 100) {
                            handleUpdate(atividade.id, { progresso: val });
                          }
                        }}
                        disabled={!progressoEditavel}
                        className="h-8 w-16"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        value={atividade.quantidadeHoras || 0}
                        onChange={(e) =>
                          handleUpdate(atividade.id, { quantidadeHoras: Number(e.target.value) })
                        }
                        className="h-8 w-20"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        value={atividade.horasUtilizadas || 0}
                        onChange={(e) =>
                          handleUpdate(atividade.id, { horasUtilizadas: Number(e.target.value) })
                        }
                        className="h-8 w-20"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm font-medium" style={{ color: diferencaColor }}>
                        {diferenca}
                      </div>
                    </td>
                    <td className="px-4 py-2 bg-muted-foreground/5">
                      <Input
                        type="text"
                        value={atividade.diasPrevistos || ""}
                        onChange={(e) =>
                          handleUpdate(atividade.id, { diasPrevistos: Number(e.target.value) || null })
                        }
                        placeholder="Ex: 5"
                        className="h-8 w-16"
                      />
                    </td>
                    <td className="px-4 py-2 bg-muted-foreground/5">
                      <Input
                        type="date"
                        value={
                          atividade.dataInicio
                            ? new Date(atividade.dataInicio).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleUpdate(atividade.id, { dataInicio: e.target.value })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2 bg-muted-foreground/5">
                      <div className="text-sm text-muted-foreground">{previsaoEntrega}</div>
                    </td>
                    <td className="px-4 py-2 bg-muted-foreground/5">
                      <div className="text-sm text-muted-foreground">{statusPrazo}</div>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={atividade.observacoes || ""}
                        onChange={(e) =>
                          handleUpdate(atividade.id, { observacoes: e.target.value })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(atividade.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

