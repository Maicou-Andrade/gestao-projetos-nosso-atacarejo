import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { CheckSquare, Trash2, Plus, Save } from "lucide-react";
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

  const handleSave = () => {
    toast.success("✓ Alterações Salvas!", { duration: 2000 });
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
      <MainLayout>
        <div className="text-center py-12">Carregando...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-[#005CA9] flex items-center gap-3">
            <CheckSquare className="h-8 w-8" />
            SubAtividades
          </h2>
          <div className="flex gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#005CA9] hover:bg-[#005CA9]/90 text-white font-semibold px-6 py-6 text-lg rounded-xl">
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar Subtarefa
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-[#005CA9]">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-[#005CA9]">
                    Adicionar Subtarefas
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[#005CA9]">Atividade</label>
                    <Select
                      value={selectedAtividadeId?.toString()}
                      onValueChange={(value) => setSelectedAtividadeId(Number(value))}
                    >
                      <SelectTrigger className="border-2 border-[#005CA9]">
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
                    <label className="text-sm font-semibold text-[#005CA9]">
                      Quantidade de linhas
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={quantidade}
                      onChange={(e) => setQuantidade(Number(e.target.value))}
                      className="border-2 border-[#005CA9]"
                    />
                  </div>
                  <Button
                    onClick={handleAddBatch}
                    className="w-full bg-[#F5B800] hover:bg-[#F5B800]/90 text-[#005CA9] font-semibold py-6"
                  >
                    Criar Subtarefas
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-6 text-lg rounded-xl"
            >
              <Save className="h-5 w-5 mr-2" />
              Salvar
            </Button>
          </div>
        </div>

        {!subtarefas || subtarefas.length === 0 ? (
          <div className="border-4 border-[#005CA9] rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <CheckSquare className="h-20 w-20 text-[#005CA9]/30" />
              <p className="text-xl text-gray-500 font-medium">
                Nenhuma subatividade cadastrada
              </p>
              <p className="text-gray-400">
                Clique em "Adicionar Subtarefa" para começar
              </p>
            </div>
          </div>
        ) : (
          <div className="border-4 border-[#005CA9] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#005CA9] text-white">
                  <tr>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Código *
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap bg-gray-700">
                      Atividade
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[200px]">
                      Nome *
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Responsável
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Data Início
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Data Fim
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap bg-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Progresso %
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Qtd Horas
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Horas Utilizadas
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Diferença
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap bg-gray-700">
                      Dias Previstos
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap bg-gray-700">
                      Previsão Entrega
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap bg-gray-700">
                      Status Prazo
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[200px]">
                      Observações
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap bg-[#F5B800] text-[#005CA9]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {subtarefas.map((subtarefa, index) => {
                    const projetoAprovado = getProjetoAprovado(subtarefa.atividadeId);
                    const progressoEditavel = projetoAprovado;
                    const previsaoEntrega = calcularPrevisaoEntrega(
                      subtarefa.dataInicio,
                      subtarefa.diasPrevistos
                    );
                    const statusPrazo = calcularStatusPrazo(previsaoEntrega);
                    const status = calcularStatus(subtarefa.progresso || 0);
                    const diferenca =
                      (subtarefa.quantidadeHoras || 0) - (subtarefa.horasUtilizadas || 0);
                    const diferencaColor =
                      diferenca > 0 ? "#059669" : diferenca < 0 ? "#DC2626" : "#000";

                    return (
                      <tr
                        key={subtarefa.id}
                        className={`border-b-2 border-[#005CA9]/10 hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <Input
                            value={subtarefa.codigo}
                            onChange={(e) =>
                              handleUpdate(subtarefa.id, { codigo: e.target.value })
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                            required
                          />
                        </td>
                        <td className="px-4 py-3 bg-gray-100">
                          <div className="text-sm text-gray-600 font-medium">
                            {getAtividadeNome(subtarefa.atividadeId)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={subtarefa.nome || ""}
                            onChange={(e) =>
                              handleUpdate(subtarefa.id, { nome: e.target.value })
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                            required
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={subtarefa.responsavel || ""}
                            onChange={(e) =>
                              handleUpdate(subtarefa.id, { responsavel: e.target.value })
                            }
                            placeholder="IDs separados por vírgula"
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          />
                        </td>
                        <td className="px-4 py-3">
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
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          />
                        </td>
                        <td className="px-4 py-3">
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
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          />
                        </td>
                        <td className="px-4 py-3 bg-gray-100">
                          <div className="text-sm text-gray-600 font-medium">{status}</div>
                        </td>
                        <td className="px-4 py-3">
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
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9] w-16"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={subtarefa.quantidadeHoras || 0}
                            onChange={(e) =>
                              handleUpdate(subtarefa.id, {
                                quantidadeHoras: Number(e.target.value),
                              })
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9] w-20"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={subtarefa.horasUtilizadas || 0}
                            onChange={(e) =>
                              handleUpdate(subtarefa.id, {
                                horasUtilizadas: Number(e.target.value),
                              })
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9] w-20"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="text-sm font-bold text-center"
                            style={{ color: diferencaColor }}
                          >
                            {diferenca}
                          </div>
                        </td>
                        <td className="px-4 py-3 bg-gray-100">
                          <Input
                            type="text"
                            value={subtarefa.diasPrevistos || ""}
                            onChange={(e) =>
                              handleUpdate(subtarefa.id, {
                                diasPrevistos: Number(e.target.value) || null,
                              })
                            }
                            placeholder="Ex: 5"
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9] w-16"
                          />
                        </td>
                        <td className="px-4 py-3 bg-gray-100">
                          <div className="text-sm text-gray-600">{previsaoEntrega}</div>
                        </td>
                        <td className="px-4 py-3 bg-gray-100">
                          <div className="text-sm text-gray-600">{statusPrazo}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={subtarefa.observacoes || ""}
                            onChange={(e) =>
                              handleUpdate(subtarefa.id, { observacoes: e.target.value })
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(subtarefa.id)}
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

