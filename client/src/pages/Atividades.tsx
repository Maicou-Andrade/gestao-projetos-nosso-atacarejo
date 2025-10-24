import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Zap, Save, Plus, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Atividades() {
  const { data: atividades, isLoading, refetch } = trpc.atividades.list.useQuery();
  const { data: projetos } = trpc.projetos.list.useQuery();
  const { data: pessoas } = trpc.pessoas.list.useQuery();
  const createAtividade = trpc.atividades.create.useMutation();
  const updateAtividade = trpc.atividades.update.useMutation();
  const deleteAtividade = trpc.atividades.delete.useMutation();

  const [editingRows, setEditingRows] = useState<Record<number, any>>({});
  const [newRows, setNewRows] = useState<any[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [selectedProjeto, setSelectedProjeto] = useState<number | null>(null);
  const [qtdAtividades, setQtdAtividades] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number; tarefa: string }>({ 
    open: false, id: 0, tarefa: "" 
  });
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

  const pessoasAtivas = pessoas?.filter((p) => p.ativo) || [];
  const projetosAtivos = projetos || [];

  // Calcular resumo
  const totalAtividades = (atividades?.length || 0) + newRows.length;
  const atividadesConcluidas = atividades?.filter((a) => a.progresso === 100).length || 0;

  const openAddModal = () => {
    if (projetosAtivos.length === 0) {
      toast.error("Cadastre pelo menos um projeto antes de adicionar atividades!");
      return;
    }
    setAddModal(true);
  };

  const createAtividadesFromModal = () => {
    if (!selectedProjeto || qtdAtividades < 1) {
      toast.error("Selecione um projeto e a quantidade de atividades!");
      return;
    }

    const projeto = projetosAtivos.find((p) => p.id === selectedProjeto);
    if (!projeto) return;

    const responsavelNomes = projeto.responsaveis
      ? projeto.responsaveis
          .split(",")
          .map((id: string) => pessoasAtivas.find((p) => p.id === parseInt(id.trim()))?.nome)
          .filter(Boolean)
          .join(", ")
      : "-";

    const novasAtividades = Array.from({ length: qtdAtividades }, (_, index) => ({
      tempId: Date.now() + index,
      projetoId: projeto.id,
      codigoProjeto: projeto.codigo,
      nomeProjeto: projeto.nome,
      respProjeto: responsavelNomes,
      inicioPlanejado: projeto.inicioPlanejado,
      fimPlanejado: projeto.fimPlanejado,
      tarefa: "",
      responsavelId: null,
      diasPrevistos: 0,
      dataInicio: "",
      previsaoEntrega: "",
      statusPrazo: "Dentro do Prazo",
      progresso: 0,
      qtdHoras: 0,
      horasUsadas: 0,
      observacoes: "",
    }));

    setNewRows([...newRows, ...novasAtividades]);
    setAddModal(false);
    setSelectedProjeto(null);
    setQtdAtividades(1);
    toast.success(`${qtdAtividades} atividade(s) adicionada(s)!`);
  };

  const updateNewRow = (tempId: number, field: string, value: any) => {
    setNewRows((rows) =>
      rows.map((row) => {
        if (row.tempId === tempId) {
          const updated = { ...row, [field]: value };
          
          // Calcular Prev. Entrega
          if (field === "dataInicio" || field === "diasPrevistos") {
            if (updated.dataInicio && updated.diasPrevistos > 0) {
              const dataInicio = new Date(updated.dataInicio + 'T00:00:00');
              dataInicio.setDate(dataInicio.getDate() + parseInt(updated.diasPrevistos));
              updated.previsaoEntrega = dataInicio.toISOString().split("T")[0];
            } else {
              updated.previsaoEntrega = "";
            }
          }
          
          // Calcular QTD Horas
          if (field === "diasPrevistos") {
            updated.qtdHoras = parseInt(updated.diasPrevistos) * 7;
          }
          
          return updated;
        }
        return row;
      })
    );
  };

  const updateEditingRow = (id: number, field: string, value: any) => {
    setEditingRows((prev) => {
      const updated = { ...(prev[id] || {}), [field]: value };
      
      // Calcular Prev. Entrega
      if (field === "dataInicio" || field === "diasPrevistos") {
        if (updated.dataInicio && updated.diasPrevistos > 0) {
          const dataInicio = new Date(updated.dataInicio + 'T00:00:00');
          dataInicio.setDate(dataInicio.getDate() + parseInt(updated.diasPrevistos));
          updated.previsaoEntrega = dataInicio.toISOString().split("T")[0];
        } else {
          updated.previsaoEntrega = "";
        }
      }
      
      // Calcular QTD Horas
      if (field === "diasPrevistos") {
        updated.qtdHoras = parseInt(updated.diasPrevistos) * 7;
      }
      
      return { ...prev, [id]: updated };
    });
  };

  const startEditing = (atividade: any) => {
    if (!editingRows[atividade.id]) {
      setEditingRows((prev) => ({
        ...prev,
        [atividade.id]: {
          ...atividade,
          dataInicio: atividade.dataInicio
            ? new Date(atividade.dataInicio as any).toISOString().split("T")[0]
            : "",
        },
      }));
    }
  };

  const saveNewRow = async (tempId: number) => {
    const row = newRows.find((r) => r.tempId === tempId);
    if (!row) return;

    const errors: string[] = [];
    if (!row.tarefa) errors.push("tarefa");
    if (!row.responsavelId) errors.push("responsavelId");

    if (errors.length > 0) {
      setValidationErrors((prev) => ({ ...prev, [tempId]: errors }));
      toast.error("Preencha todos os campos obrigatórios marcados em vermelho!");
      return;
    }

    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[tempId];
      return newErrors;
    });

    try {
      await createAtividade.mutateAsync({
        codigo: `AT${Date.now()}`,
        projetoId: row.projetoId,
        tarefa: row.tarefa,
        responsaveisTarefa: row.responsavelId ? String(row.responsavelId) : "",
        diasPrevistos: row.diasPrevistos || 0,
        dataInicio: row.dataInicio || null,
        progresso: row.progresso || 0,
        horasUtilizadas: row.horasUsadas || 0,
        observacoes: row.observacoes || "",
      });
      setNewRows((rows) => rows.filter((r) => r.tempId !== tempId));
      await refetch();
      toast.success("Atividade cadastrada!");
    } catch (error) {
      toast.error("Erro ao cadastrar atividade");
    }
  };

  const saveAllRows = async () => {
    for (const row of newRows) {
      await saveNewRow(row.tempId);
    }
  };

  const saveEditingRow = async (id: number) => {
    const row = editingRows[id];
    if (!row) return;

    try {
      await updateAtividade.mutateAsync({
        id,
        tarefa: row.tarefa,
        responsaveisTarefa: row.responsavelId ? String(row.responsavelId) : "",
        diasPrevistos: row.diasPrevistos,
        dataInicio: row.dataInicio || null,
        progresso: row.progresso,
        horasUtilizadas: row.horasUsadas,
        observacoes: row.observacoes,
      });
      setEditingRows((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      await refetch();
      toast.success("Atividade atualizada!");
    } catch (error) {
      toast.error("Erro ao atualizar atividade");
    }
  };

  const removeNewRow = (tempId: number) => {
    setNewRows((rows) => rows.filter((r) => r.tempId !== tempId));
  };

  const openDeleteModal = (id: number, tarefa: string) => {
    setDeleteModal({ open: true, id, tarefa });
  };

  const confirmDelete = async () => {
    try {
      await deleteAtividade.mutateAsync({ id: deleteModal.id });
      await refetch();
      toast.success("Atividade removida!");
      setDeleteModal({ open: false, id: 0, tarefa: "" });
    } catch (error) {
      toast.error("Erro ao remover atividade");
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </MainLayout>
    );
  }

  const allRows = [
    ...newRows.map((row) => ({ ...row, id: row.tempId, isNew: true })),
    ...(atividades || []).map((atividade) => {
      const projeto = projetosAtivos.find((p) => p.id === atividade.projetoId);
      const responsavelNomes = projeto?.responsaveis
        ? projeto.responsaveis
            .split(",")
            .map((id: string) => pessoasAtivas.find((p) => p.id === parseInt(id.trim()))?.nome)
            .filter(Boolean)
            .join(", ")
        : "-";
      
      return {
        ...atividade,
        isNew: false,
        codigoProjeto: projeto?.codigo || "-",
        nomeProjeto: projeto?.nome || "-",
        respProjeto: responsavelNomes,
        inicioPlanejado: projeto?.inicioPlanejado,
        fimPlanejado: projeto?.fimPlanejado,
        qtdHoras: (atividade.diasPrevistos || 0) * 7,
        previsaoEntrega: atividade.dataInicio && atividade.diasPrevistos
          ? (() => {
              const dataInicio = new Date(atividade.dataInicio);
              dataInicio.setDate(dataInicio.getDate() + atividade.diasPrevistos);
              return dataInicio.toISOString().split("T")[0];
            })()
          : "",
      };
    }),
  ];

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-[#005CA9]" />
          <h1 className="text-3xl font-bold text-[#005CA9]">Atividades</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 border-2 border-[#005CA9] rounded-lg bg-white">
            <span className="text-sm font-medium text-[#005CA9]">
              Total: {totalAtividades} | Concluídas: {atividadesConcluidas}
            </span>
          </div>
          <Button
            onClick={openAddModal}
            className="bg-[#005CA9] hover:bg-[#005CA9]/90 text-white font-semibold"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Atividade
          </Button>
          {newRows.length > 0 && (
            <Button
              onClick={saveAllRows}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <Save className="h-5 w-5 mr-2" />
              Salvar
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border-2 border-[#005CA9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#005CA9] text-white">
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Código Projeto</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Projeto</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Resp. Projeto</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Início Plan.</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Fim Plan.</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase bg-[#F5B800] text-black">Tarefa *</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase bg-[#F5B800] text-black">Resp. Tarefa *</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Dias Prev.</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Data Início</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Prev. Entrega</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Status</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Status Prazo</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Progresso %</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">QTD Horas</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Horas Usadas</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Dif. Horas</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Observações</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase bg-[#F5B800] text-black">Ações</th>
              </tr>
            </thead>
            <tbody>
              {allRows.length === 0 ? (
                <tr>
                  <td colSpan={18} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Zap className="h-16 w-16 text-gray-300" />
                      <p className="text-gray-500 text-sm">Nenhuma atividade cadastrada</p>
                      <p className="text-gray-400 text-xs">Clique em "Adicionar Atividade" para começar</p>
                    </div>
                  </td>
                </tr>
              ) : (
                allRows.map((atividade, index) => {
                  const isNew = atividade.isNew;
                  const id = atividade.id;
                  const isEditing = isNew || !!editingRows[id];
                  const data = isNew
                    ? newRows.find((r) => r.tempId === id)
                    : editingRows[id] || atividade;

                  const errors = validationErrors[id] || [];
                  
                  const qtdHoras = (data.diasPrevistos || 0) * 7;
                  const difHoras = qtdHoras - (data.horasUsadas || 0);
                  const difHorasColor = difHoras >= 0 ? "text-green-600" : "text-red-600";

                  const responsavelNome = pessoasAtivas.find((p) => p.id === data.responsavelId)?.nome || "";
                  const projetoVinculado = projetosAtivos.find((p) => p.id === data.projetoId);
                  const projetoAprovado = projetoVinculado?.aprovacao || false;

                  return (
                    <tr
                      key={id}
                      className={`border-b-2 border-[#005CA9]/10 hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } ${isNew ? "bg-yellow-50/50" : ""}`}
                    >
                      {/* Código Projeto */}
                      <td className="px-3 py-2">
                        <span className="text-xs font-mono text-[#005CA9] font-semibold">{data.codigoProjeto}</span>
                      </td>

                      {/* Projeto */}
                      <td className="px-3 py-2">
                        <span className="text-xs font-medium">{data.nomeProjeto}</span>
                      </td>

                      {/* Resp. Projeto */}
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-1 bg-[#005CA9] text-white rounded">{data.respProjeto || "-"}</span>
                      </td>

                      {/* Início Plan. */}
                      <td className="px-3 py-2">
                        <span className="text-xs">
                          {data.inicioPlanejado ? new Date(data.inicioPlanejado).toLocaleDateString("pt-BR") : "-"}
                        </span>
                      </td>

                      {/* Fim Plan. */}
                      <td className="px-3 py-2">
                        <span className="text-xs">
                          {data.fimPlanejado ? new Date(data.fimPlanejado).toLocaleDateString("pt-BR") : "-"}
                        </span>
                      </td>

                      {/* Tarefa * */}
                      <td className="px-3 py-2 bg-yellow-50">
                        <Input
                          value={data.tarefa || ""}
                          onChange={(e) =>
                            isNew
                              ? updateNewRow(id, "tarefa", e.target.value)
                              : updateEditingRow(id, "tarefa", e.target.value)
                          }
                          className={`h-9 text-xs min-w-[200px] ${!isEditing ? "border-0 bg-transparent" : ""} ${errors.includes("tarefa") ? "border-2 border-red-500" : ""}`}
                          placeholder="Nome da tarefa"
                          readOnly={!isEditing}
                        />
                      </td>

                      {/* Resp. Tarefa * */}
                      <td className="px-3 py-2 bg-yellow-50">
                        {isEditing ? (
                          <select
                            value={data.responsavelId || ""}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : null;
                              isNew
                                ? updateNewRow(id, "responsavelId", value)
                                : updateEditingRow(id, "responsavelId", value);
                            }}
                            className={`h-9 text-xs border rounded px-2 w-full min-w-[150px] ${errors.includes("responsavelId") ? "border-2 border-red-500" : ""}`}
                          >
                            <option value="">Selecionar...</option>
                            {pessoasAtivas.map((pessoa) => (
                              <option key={pessoa.id} value={pessoa.id}>
                                {pessoa.nome}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs">{responsavelNome || "-"}</span>
                        )}
                      </td>

                      {/* Dias Prev. */}
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={data.diasPrevistos || ""}
                          onChange={(e) =>
                            isNew
                              ? updateNewRow(id, "diasPrevistos", e.target.value)
                              : updateEditingRow(id, "diasPrevistos", e.target.value)
                          }
                          className={`h-9 text-xs w-20 ${!isEditing ? "border-0 bg-transparent" : ""}`}
                          placeholder="0"
                          readOnly={!isEditing}
                        />
                      </td>

                      {/* Data Início */}
                      <td className="px-3 py-2">
                        <Input
                          type="date"
                          value={data.dataInicio || ""}
                          onChange={(e) =>
                            isNew
                              ? updateNewRow(id, "dataInicio", e.target.value)
                              : updateEditingRow(id, "dataInicio", e.target.value)
                          }
                          className={`h-9 text-xs ${!isEditing ? "border-0 bg-transparent" : ""}`}
                          readOnly={!isEditing}
                        />
                      </td>

                      {/* Prev. Entrega (calculado) */}
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {data.previsaoEntrega
                            ? new Date(data.previsaoEntrega).toLocaleDateString("pt-BR")
                            : "-"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2">
                        <span className="text-xs">Em Andamento</span>
                      </td>

                      {/* Status Prazo */}
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          {data.statusPrazo || "Dentro do Prazo"}
                        </span>
                      </td>

                      {/* Progresso % */}
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={data.progresso || 0}
                          onChange={(e) =>
                            isNew
                              ? updateNewRow(id, "progresso", e.target.value)
                              : updateEditingRow(id, "progresso", e.target.value)
                          }
                          className={`h-9 text-xs w-16 ${!isEditing || !projetoAprovado ? "border-0 bg-transparent" : ""}`}
                          readOnly={!isEditing || !projetoAprovado}
                          disabled={!projetoAprovado}
                          title={!projetoAprovado ? "Progresso só pode ser alterado após aprovação do projeto" : ""}
                        />
                      </td>

                      {/* QTD Horas (calculado) */}
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">{qtdHoras}</span>
                      </td>

                      {/* Horas Usadas */}
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={data.horasUsadas || 0}
                          onChange={(e) =>
                            isNew
                              ? updateNewRow(id, "horasUsadas", e.target.value)
                              : updateEditingRow(id, "horasUsadas", e.target.value)
                          }
                          className={`h-9 text-xs w-20 ${!isEditing ? "border-0 bg-transparent" : ""}`}
                          readOnly={!isEditing}
                        />
                      </td>

                      {/* Dif. Horas (calculado) */}
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-1 font-semibold ${difHorasColor}`}>
                          {difHoras}
                        </span>
                      </td>

                      {/* Observações */}
                      <td className="px-3 py-2">
                        <Textarea
                          value={data.observacoes || ""}
                          onChange={(e) =>
                            isNew
                              ? updateNewRow(id, "observacoes", e.target.value)
                              : updateEditingRow(id, "observacoes", e.target.value)
                          }
                          className={`h-9 text-xs min-w-[200px] resize-none ${!isEditing ? "border-0 bg-transparent" : ""}`}
                          rows={1}
                          readOnly={!isEditing}
                        />
                      </td>

                      {/* Ações */}
                      <td className="px-3 py-2 text-center bg-yellow-50">
                        <div className="flex gap-2 justify-center">
                          {isEditing && !isNew && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                saveEditingRow(id);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white h-7 px-2"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          )}
                          {!isNew && !isEditing && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(atividade);
                              }}
                              className="bg-[#005CA9] hover:bg-[#005CA9]/90 text-white h-7 px-2"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          {!isNew && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(id, atividade.tarefa);
                              }}
                              className="hover:bg-red-50 h-7 px-2"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Atividades */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#005CA9]">Adicionar Atividades</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Projeto *</label>
              <select
                value={selectedProjeto || ""}
                onChange={(e) => setSelectedProjeto(parseInt(e.target.value))}
                className="w-full h-10 text-sm border rounded px-3"
              >
                <option value="">Selecione um projeto...</option>
                {projetosAtivos.map((projeto) => (
                  <option key={projeto.id} value={projeto.id}>
                    {projeto.codigo} - {projeto.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Quantidade de Atividades *</label>
              <Input
                type="number"
                min="1"
                value={qtdAtividades}
                onChange={(e) => setQtdAtividades(parseInt(e.target.value) || 1)}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddModal(false);
                setSelectedProjeto(null);
                setQtdAtividades(1);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={createAtividadesFromModal}
              className="bg-[#F5B800] hover:bg-[#F5B800]/90 text-black"
            >
              Criar Atividades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmação de Exclusão */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-4">
            Tem certeza que deseja remover a atividade <strong>"{deleteModal.tarefa}"</strong>?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, id: 0, tarefa: "" })}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

