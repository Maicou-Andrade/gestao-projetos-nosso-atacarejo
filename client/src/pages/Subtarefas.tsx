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

export default function Subtarefas() {
  const { data: subtarefas, isLoading, refetch } = trpc.subtarefas.list.useQuery();
  const { data: atividades } = trpc.atividades.list.useQuery();
  const { data: projetos } = trpc.projetos.list.useQuery();
  const createSubtarefa = trpc.subtarefas.create.useMutation();
  const updateSubtarefa = trpc.subtarefas.update.useMutation();
  const deleteSubtarefa = trpc.subtarefas.delete.useMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAtividadeId, setSelectedAtividadeId] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState(1);

  const handleAddBatch = async () => {
    if (!selectedAtividadeId) {
      toast.error("Selecione uma atividade");
      return;
    }
    try {
      for (let i = 0; i < quantidade; i++) {
        await createSubtarefa.mutateAsync({
          codigo: `ST${Date.now()}-${i}`,
          atividadeId: selectedAtividadeId,
          nome: "",
          progresso: 0,
        });
      }
      await refetch();
      setIsDialogOpen(false);
      toast.success(`${quantidade} subtarefa(s) adicionada(s)!`);
    } catch (error) {
      toast.error("Erro ao adicionar subtarefas");
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      await updateSubtarefa.mutateAsync({ id, ...data });
      await refetch();
    } catch (error) {
      toast.error("Erro ao atualizar subtarefa");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente excluir esta subtarefa?")) return;
    try {
      await deleteSubtarefa.mutateAsync({ id });
      await refetch();
      toast.success("Subtarefa excluída!");
    } catch (error) {
      toast.error("Erro ao excluir subtarefa");
    }
  };

  const getAtividadeNome = (atividadeId: number) => {
    return atividades?.find((a) => a.id === atividadeId)?.tarefa || "-";
  };

  const getProjetoAprovado = (atividadeId: number) => {
    const atividade = atividades?.find((a) => a.id === atividadeId);
    if (!atividade) return false;
    return projetos?.find((p) => p.id === atividade.projetoId)?.aprovacao || false;
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
          <h1 className="text-2xl font-bold">🔧 Subtarefas</h1>
          <p>Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🔧 Subtarefas</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Subtarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Subtarefas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Atividade</label>
                  <Select
                    value={selectedAtividadeId?.toString()}
                    onValueChange={(value) => setSelectedAtividadeId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma atividade" />
                    </SelectTrigger>
                    <SelectContent>
                      {atividades?.map((atividade) => (
                        <SelectItem key={atividade.id} value={atividade.id.toString()}>
                          {atividade.codigo} - {atividade.tarefa}
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
                  Criar Subtarefas
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
                <th className="px-4 py-3 text-left text-sm font-medium bg-muted-foreground/10">Atividade</th>
                <th className="px-4 py-3 text-left text-sm font-medium min-w-[200px]">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Responsável</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Data Início</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Data Fim</th>
                <th className="px-4 py-3 text-left text-sm font-medium bg-muted-foreground/10">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Progresso %</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Qtd Horas</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Horas Utilizadas</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Diferença</th>
                <th className="px-4 py-3 text-left text-sm font-medium bg-muted-foreground/10">Dias Previstos</th>
                <th className="px-4 py-3 text-left text-sm font-medium bg-muted-foreground/10">Previsão Entrega</th>
                <th className="px-4 py-3 text-left text-sm font-medium bg-muted-foreground/10">Status Prazo</th>
                <th className="px-4 py-3 text-left text-sm font-medium min-w-[200px]">Observações</th>
                <th className="px-4 py-3 text-left text-sm font-medium w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {subtarefas?.map((subtarefa) => {
                const projetoAprovado = getProjetoAprovado(subtarefa.atividadeId);
                const progressoEditavel = projetoAprovado;
                const previsaoEntrega = calcularPrevisaoEntrega(
                  subtarefa.dataInicio,
                  subtarefa.diasPrevistos
                );
                const statusPrazo = calcularStatusPrazo(previsaoEntrega);
                const status = calcularStatus(subtarefa.progresso || 0);
                const diferenca = (subtarefa.quantidadeHoras || 0) - (subtarefa.horasUtilizadas || 0);
                const diferencaColor = diferenca > 0 ? "#059669" : diferenca < 0 ? "#DC2626" : "#000";

                return (
                  <tr key={subtarefa.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-2">
                      <Input
                        value={subtarefa.codigo}
                        onChange={(e) =>
                          handleUpdate(subtarefa.id, { codigo: e.target.value })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2 bg-muted-foreground/5">
                      <div className="text-sm text-muted-foreground">
                        {getAtividadeNome(subtarefa.atividadeId)}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={subtarefa.nome || ""}
                        onChange={(e) =>
                          handleUpdate(subtarefa.id, { nome: e.target.value })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={subtarefa.responsavel || ""}
                        onChange={(e) =>
                          handleUpdate(subtarefa.id, { responsavel: e.target.value })
                        }
                        placeholder="IDs separados por vírgula"
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="date"
                        value={
                          subtarefa.dataInicio
                            ? new Date(subtarefa.dataInicio).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleUpdate(subtarefa.id, { dataInicio: e.target.value })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="date"
                        value={
                          subtarefa.dataFim
                            ? new Date(subtarefa.dataFim).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleUpdate(subtarefa.id, { dataFim: e.target.value })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2 bg-muted-foreground/5">
                      <div className="text-sm text-muted-foreground">{status}</div>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="text"
                        value={subtarefa.progresso || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val >= -1 && val <= 100) {
                            handleUpdate(subtarefa.id, { progresso: val });
                          }
                        }}
                        disabled={!progressoEditavel}
                        className="h-8 w-16"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        value={subtarefa.quantidadeHoras || 0}
                        onChange={(e) =>
                          handleUpdate(subtarefa.id, { quantidadeHoras: Number(e.target.value) })
                        }
                        className="h-8 w-20"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        value={subtarefa.horasUtilizadas || 0}
                        onChange={(e) =>
                          handleUpdate(subtarefa.id, { horasUtilizadas: Number(e.target.value) })
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
                        value={subtarefa.diasPrevistos || ""}
                        onChange={(e) =>
                          handleUpdate(subtarefa.id, { diasPrevistos: Number(e.target.value) || null })
                        }
                        placeholder="Ex: 5"
                        className="h-8 w-16"
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
                        value={subtarefa.observacoes || ""}
                        onChange={(e) =>
                          handleUpdate(subtarefa.id, { observacoes: e.target.value })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(subtarefa.id)}
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

