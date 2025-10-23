import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Zap, Trash2, Plus, Save } from "lucide-react";
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

  const handleSave = () => {
    toast.success("✓ Alterações Salvas!", { duration: 2000 });
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
      <MainLayout>
        <div className="text-center py-12">Carregando...</div>
      </MainLayout>
    );
  }

  const totalAtividades = atividades?.length || 0;
  const concluidas = atividades?.filter((a) => (a.progresso ?? 0) === 100).length || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#005CA9] flex items-center gap-3">
              <Zap className="h-8 w-8" />
              Atividades
            </h2>
            <p className="text-lg text-[#005CA9] mt-1">
              Total: {totalAtividades} | Concluídas: {concluidas}
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#005CA9] hover:bg-[#005CA9]/90 text-white font-semibold px-6 py-6 text-lg rounded-xl">
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar Atividade
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-[#005CA9]">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-[#005CA9]">
                    Adicionar Atividades
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[#005CA9]">Projeto</label>
                    <Select
                      value={selectedProjetoId?.toString()}
                      onValueChange={(value) => setSelectedProjetoId(Number(value))}
                    >
                      <SelectTrigger className="border-2 border-[#005CA9]">
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
                    Criar Atividades
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

        {!atividades || atividades.length === 0 ? (
          <div className="border-4 border-[#005CA9] rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Zap className="h-20 w-20 text-[#005CA9]/30" />
              <p className="text-xl text-gray-500 font-medium">
                Nenhuma atividade cadastrada
              </p>
              <p className="text-gray-400">
                Clique em "Adicionar Atividade" para começar
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
                      Projeto
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[250px]">
                      Tarefa *
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[200px]">
                      Responsáveis
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
                      Data Início
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
                  {atividades.map((atividade, index) => {
                    const projetoAprovado = getProjetoAprovado(atividade.projetoId);
                    const hasSubtarefas = temSubtarefas(atividade.id);
                    const progressoEditavel = projetoAprovado && !hasSubtarefas;
                    const previsaoEntrega = calcularPrevisaoEntrega(
                      atividade.dataInicio,
                      atividade.diasPrevistos
                    );
                    const statusPrazo = calcularStatusPrazo(previsaoEntrega);
                    const status = calcularStatus(atividade.progresso || 0);
                    const diferenca =
                      (atividade.quantidadeHoras || 0) - (atividade.horasUtilizadas || 0);
                    const diferencaColor =
                      diferenca > 0 ? "#059669" : diferenca < 0 ? "#DC2626" : "#000";

                    return (
                      <tr
                        key={atividade.id}
                        className={`border-b-2 border-[#005CA9]/10 hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <Input
                            value={atividade.codigo}
                            onChange={(e) =>
                              handleUpdate(atividade.id, { codigo: e.target.value })
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                            required
                          />
                        </td>
                        <td className="px-4 py-3 bg-gray-100">
                          <div className="text-sm text-gray-600 font-medium">
                            {getProjetoNome(atividade.projetoId)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={atividade.tarefa || ""}
                            onChange={(e) =>
                              handleUpdate(atividade.id, { tarefa: e.target.value })
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                            required
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={atividade.responsaveisTarefa || ""}
                            onChange={(e) =>
                              handleUpdate(atividade.id, {
                                responsaveisTarefa: e.target.value,
                              })
                            }
                            placeholder="IDs separados por vírgula"
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          />
                        </td>
                        <td className="px-4 py-3 bg-gray-100">
                          <div className="text-sm text-gray-600 font-medium">{status}</div>
                        </td>
                        <td className="px-4 py-3">
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
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9] w-16"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={atividade.quantidadeHoras || 0}
                            onChange={(e) =>
                              handleUpdate(atividade.id, {
                                quantidadeHoras: Number(e.target.value),
                              })
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9] w-20"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={atividade.horasUtilizadas || 0}
                            onChange={(e) =>
                              handleUpdate(atividade.id, {
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
                            value={atividade.diasPrevistos || ""}
                            onChange={(e) =>
                              handleUpdate(atividade.id, {
                                diasPrevistos: Number(e.target.value) || null,
                              })
                            }
                            placeholder="Ex: 5"
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9] w-16"
                          />
                        </td>
                        <td className="px-4 py-3 bg-gray-100">
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
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
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
                            value={atividade.observacoes || ""}
                            onChange={(e) =>
                              handleUpdate(atividade.id, { observacoes: e.target.value })
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(atividade.id)}
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

