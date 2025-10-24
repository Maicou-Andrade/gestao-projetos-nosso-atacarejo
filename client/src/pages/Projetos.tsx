import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Folder, Save, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Projetos() {
  const { data: projetos, isLoading, refetch } = trpc.projetos.list.useQuery();
  const { data: pessoas } = trpc.pessoas.list.useQuery();
  const createProjeto = trpc.projetos.create.useMutation();
  const updateProjeto = trpc.projetos.update.useMutation();
  const deleteProjeto = trpc.projetos.delete.useMutation();

  const [editingRows, setEditingRows] = useState<Record<number, any>>({});
  const [newRows, setNewRows] = useState<any[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number; nome: string }>({ open: false, id: 0, nome: "" });
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

  const pessoasAtivas = pessoas?.filter((p) => p.ativo) || [];

  const addNewRow = () => {
    const nextNumber = (projetos?.length || 0) + newRows.length + 1;
    const codigo = `PROJ${nextNumber}`;
    
    setNewRows([
      ...newRows,
      {
        tempId: Date.now(),
        codigo,
        nome: "",
        descricao: "",
        prioridade: "Média",
        responsaveis: "",
        inicioPlanejado: "",
        fimPlanejado: "",
        aprovacao: false,
      },
    ]);
  };

  const updateNewRow = (tempId: number, field: string, value: any) => {
    setNewRows((rows) =>
      rows.map((row) => (row.tempId === tempId ? { ...row, [field]: value } : row))
    );
  };

  const updateEditingRow = (id: number, field: string, value: any) => {
    setEditingRows((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  };

  const startEditing = (projeto: any) => {
    if (!editingRows[projeto.id]) {
      const responsaveisIds = projeto.responsaveis
        ? projeto.responsaveis.split(",").map((id: string) => parseInt(id.trim()))
        : [];

      setEditingRows((prev) => ({
        ...prev,
        [projeto.id]: {
          ...projeto,
          responsaveis: responsaveisIds,
          inicioPlanejado: projeto.inicioPlanejado
            ? new Date(projeto.inicioPlanejado as any).toISOString().split("T")[0]
            : "",
          fimPlanejado: projeto.fimPlanejado
            ? new Date(projeto.fimPlanejado as any).toISOString().split("T")[0]
            : "",
        },
      }));
    }
  };

  const toggleResponsavel = (id: number, pessoaId: number, isNew: boolean = false) => {
    if (isNew) {
      setNewRows((rows) =>
        rows.map((row) =>
          row.tempId === id
            ? {
                ...row,
                responsaveis: row.responsaveis.includes(pessoaId)
                  ? row.responsaveis.filter((pid: number) => pid !== pessoaId)
                  : [...row.responsaveis, pessoaId],
              }
            : row
        )
      );
    } else {
      setEditingRows((prev) => {
        const current = prev[id]?.responsaveis || [];
        return {
          ...prev,
          [id]: {
            ...(prev[id] || {}),
            responsaveis: current.includes(pessoaId)
              ? current.filter((pid: number) => pid !== pessoaId)
              : [...current, pessoaId],
          },
        };
      });
    }
  };

  const saveNewRow = async (tempId: number) => {
    const row = newRows.find((r) => r.tempId === tempId);
    if (!row) return;

    const errors: string[] = [];
    if (!row.nome) errors.push("nome");
    if (!row.descricao) errors.push("descricao");
    if (!row.inicioPlanejado) errors.push("inicioPlanejado");
    if (!row.fimPlanejado) errors.push("fimPlanejado");
    if (!row.responsaveis) errors.push("responsaveis");

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
      await createProjeto.mutateAsync({
        ...row,
        responsaveis: row.responsaveis,
      });
      setNewRows((rows) => rows.filter((r) => r.tempId !== tempId));
      await refetch();
      toast.success("Projeto cadastrado!");
    } catch (error) {
      toast.error("Erro ao cadastrar projeto");
    }
  };

  const saveEditingRow = async (id: number) => {
    const row = editingRows[id];
    if (!row) return;

    const errors: string[] = [];
    if (!row.nome) errors.push("nome");
    if (!row.descricao) errors.push("descricao");
    if (!row.inicioPlanejado) errors.push("inicioPlanejado");
    if (!row.fimPlanejado) errors.push("fimPlanejado");
    if (!row.responsaveis) errors.push("responsaveis");

    if (errors.length > 0) {
      setValidationErrors((prev) => ({ ...prev, [id]: errors }));
      toast.error("Preencha todos os campos obrigatórios marcados em vermelho!");
      return;
    }

    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });

    try {
      await updateProjeto.mutateAsync({
        id,
        ...row,
        responsaveis: Array.isArray(row.responsaveis) ? row.responsaveis.join(",") : row.responsaveis,
      });
      setEditingRows((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      await refetch();
      toast.success("Projeto atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar projeto");
    }
  };

  const openDeleteModal = (id: number, nome: string) => {
    setDeleteModal({ open: true, id, nome });
  };

  const confirmDelete = async () => {
    try {
      await deleteProjeto.mutateAsync({ id: deleteModal.id });
      await refetch();
      toast.success("Projeto excluído!");
      setDeleteModal({ open: false, id: 0, nome: "" });
    } catch (error: any) {
      if (error.message?.includes("atividades")) {
        toast.error("Não é possível excluir projeto com atividades vinculadas!");
      } else {
        toast.error("Erro ao excluir projeto");
      }
      setDeleteModal({ open: false, id: 0, nome: "" });
    }
  };

  const removeNewRow = (tempId: number) => {
    setNewRows((rows) => rows.filter((r) => r.tempId !== tempId));
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12">Carregando...</div>
      </MainLayout>
    );
  }

  const allRows = [
    ...(projetos || []).map((p) => ({ ...p, isNew: false })),
    ...newRows.map((r) => ({ ...r, isNew: true })),
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-[#005CA9] flex items-center gap-3">
            <Folder className="h-8 w-8" />
            Projetos
          </h2>
          <Button
            onClick={addNewRow}
            className="bg-[#F5B800] hover:bg-[#F5B800]/90 text-[#005CA9] font-semibold px-6 py-6 text-lg rounded-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Projeto
          </Button>
        </div>

        {allRows.length === 0 ? (
          <div className="border-4 border-[#005CA9] rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Folder className="h-20 w-20 text-[#005CA9]/30" />
              <p className="text-xl text-gray-500 font-medium">Nenhum projeto cadastrado</p>
              <p className="text-gray-400">Clique em "Novo Projeto" para começar</p>
            </div>
          </div>
        ) : (
          <div className="border-4 border-[#005CA9] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#005CA9] text-white sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-left font-bold uppercase whitespace-nowrap">Código *</th>
                    <th className="px-3 py-3 text-left font-bold uppercase whitespace-nowrap">Nome *</th>
                    <th className="px-3 py-3 text-left font-bold uppercase whitespace-nowrap">Descrição *</th>
                    <th className="px-3 py-3 text-left font-bold uppercase whitespace-nowrap">Prioridade *</th>
                    <th className="px-3 py-3 text-left font-bold uppercase whitespace-nowrap">Responsáveis *</th>
                    <th className="px-3 py-3 text-left font-bold uppercase whitespace-nowrap">Início Plan. *</th>
                    <th className="px-3 py-3 text-left font-bold uppercase whitespace-nowrap">Fim Plan. *</th>
                    <th className="px-3 py-3 text-center font-bold uppercase whitespace-nowrap">Aprovação</th>
                    <th className="px-3 py-3 text-center font-bold uppercase whitespace-nowrap bg-gray-700">Status</th>
                    <th className="px-3 py-3 text-left font-bold uppercase whitespace-nowrap bg-gray-700">Início Real</th>
                    <th className="px-3 py-3 text-left font-bold uppercase whitespace-nowrap bg-gray-700">Fim Previsto</th>
                    <th className="px-3 py-3 text-center font-bold uppercase whitespace-nowrap bg-gray-700">Qtd Horas</th>
                    <th className="px-3 py-3 text-center font-bold uppercase whitespace-nowrap bg-gray-700">Total Tarefas</th>
                    <th className="px-3 py-3 text-center font-bold uppercase whitespace-nowrap bg-gray-700">Em Andamento</th>
                    <th className="px-3 py-3 text-center font-bold uppercase whitespace-nowrap bg-gray-700">Finalizadas</th>
                    <th className="px-3 py-3 text-center font-bold uppercase whitespace-nowrap bg-gray-700">Não Iniciado</th>
                    <th className="px-3 py-3 text-center font-bold uppercase whitespace-nowrap bg-gray-700">Cancelado</th>
                    <th className="px-3 py-3 text-center font-bold uppercase whitespace-nowrap bg-gray-700">Dentro Prazo</th>
                    <th className="px-3 py-3 text-center font-bold uppercase whitespace-nowrap bg-gray-700">Fora Prazo</th>
                    <th className="px-3 py-3 text-center font-bold uppercase whitespace-nowrap bg-gray-700">Progresso %</th>
                    <th className="px-3 py-3 text-center font-bold uppercase bg-[#F5B800] text-[#005CA9] whitespace-nowrap sticky right-0">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {allRows.map((projeto, index) => {
                    const isNew = projeto.isNew;
                    const id = isNew ? projeto.tempId : projeto.id;
                    const isEditing = isNew || editingRows[id];
                    const data = isNew ? projeto : editingRows[id] || projeto;

                    const responsaveisArray = Array.isArray(data.responsaveis)
                      ? data.responsaveis
                      : (data.responsaveis || "").split(",").map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id));

                    const responsaveisNomes = responsaveisArray
                      .map((pid: number) => pessoasAtivas.find((p) => p.id === pid)?.nome)
                      .filter(Boolean)
                      .join(", ") || "-";

                    const errors = validationErrors[id] || [];

                    return (
                      <tr
                        key={id}
                        className={`border-b-2 border-[#005CA9]/10 hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } ${isNew ? "bg-yellow-50/50" : ""}`}
                        onClick={() => !isNew && !isEditing && startEditing(projeto)}
                      >
                        <td className="px-3 py-2">
                          <Input
                            value={data.codigo || ""}
                            className="h-9 text-xs border-0 bg-gray-100 text-gray-700 font-mono"
                            readOnly
                          />
                        </td>

                        <td className="px-3 py-2">
                          <Input
                            value={data.nome || ""}
                            onChange={(e) =>
                              isNew
                                ? updateNewRow(id, "nome", e.target.value)
                                : updateEditingRow(id, "nome", e.target.value)
                            }
                            className={`h-9 text-xs min-w-[180px] ${!isEditing ? "border-0 bg-transparent font-medium" : ""} ${errors.includes("nome") ? "border-2 border-red-500" : ""}`}
                            placeholder="Nome do projeto"
                            readOnly={!isEditing}
                          />
                        </td>

                        <td className="px-3 py-2">
                          <Textarea
                            value={data.descricao || ""}
                            onChange={(e) =>
                              isNew
                                ? updateNewRow(id, "descricao", e.target.value)
                                : updateEditingRow(id, "descricao", e.target.value)
                            }
                            className={`h-9 text-xs min-w-[250px] resize-none ${!isEditing ? "border-0 bg-transparent" : ""} ${errors.includes("descricao") ? "border-2 border-red-500" : ""}`}
                            placeholder="Descrição"
                            rows={1}
                            readOnly={!isEditing}
                          />
                        </td>

                        <td className="px-3 py-2">
                          {isEditing ? (
                            <select
                              value={data.prioridade || "Média"}
                              onChange={(e) =>
                                isNew
                                  ? updateNewRow(id, "prioridade", e.target.value)
                                  : updateEditingRow(id, "prioridade", e.target.value)
                              }
                              className="h-9 text-xs border rounded px-2 w-full font-semibold"
                              style={{
                                color: data.prioridade === "Baixa" ? "#16a34a" : data.prioridade === "Média" ? "#eab308" : data.prioridade === "Alta" ? "#dc2626" : "#000000"
                              }}
                            >
                              <option value="Baixa" style={{ color: "#16a34a" }}>Baixa</option>
                              <option value="Média" style={{ color: "#eab308" }}>Média</option>
                              <option value="Alta" style={{ color: "#dc2626" }}>Alta</option>
                              <option value="Crítica" style={{ color: "#000000" }}>Crítica</option>
                            </select>
                          ) : (
                            <span 
                              className="text-xs px-2 font-semibold"
                              style={{
                                color: data.prioridade === "Baixa" ? "#16a34a" : data.prioridade === "Média" ? "#eab308" : data.prioridade === "Alta" ? "#dc2626" : "#000000"
                              }}
                            >
                              {data.prioridade}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2">
                          {isEditing ? (
                            <select
                              value={responsaveisArray[0] || ""}
                              onChange={(e) => {
                                const newValue = e.target.value ? [parseInt(e.target.value)] : [];
                                if (isNew) {
                                  updateNewRow(id, "responsaveis", newValue);
                                } else {
                                  updateEditingRow(id, "responsaveis", newValue);
                                }
                              }}
                              className={`h-9 text-xs border rounded px-2 w-full min-w-[180px] ${errors.includes("responsaveis") ? "border-2 border-red-500" : ""}`}
                            >
                              <option value="">Selecione...</option>
                              {pessoasAtivas.map((pessoa) => (
                                <option key={pessoa.id} value={pessoa.id}>
                                  {pessoa.nome}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs px-2 max-w-[180px] truncate block" title={responsaveisNomes}>
                              {responsaveisNomes}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2">
                          <Input
                            type="date"
                            value={data.inicioPlanejado || ""}
                            onChange={(e) =>
                              isNew
                                ? updateNewRow(id, "inicioPlanejado", e.target.value)
                                : updateEditingRow(id, "inicioPlanejado", e.target.value)
                            }
                            className={`h-9 text-xs ${!isEditing ? "border-0 bg-transparent" : ""} ${errors.includes("inicioPlanejado") ? "border-2 border-red-500" : ""}`}
                            readOnly={!isEditing}
                          />
                        </td>

                        <td className="px-3 py-2">
                          <Input
                            type="date"
                            value={data.fimPlanejado || ""}
                            onChange={(e) =>
                              isNew
                                ? updateNewRow(id, "fimPlanejado", e.target.value)
                                : updateEditingRow(id, "fimPlanejado", e.target.value)
                            }
                            className={`h-9 text-xs ${!isEditing ? "border-0 bg-transparent" : ""} ${errors.includes("fimPlanejado") ? "border-2 border-red-500" : ""}` }
                            readOnly={!isEditing}
                          />
                        </td>

                        <td className="px-3 py-2 text-center">
                          <Checkbox
                            checked={data.aprovacao || false}
                            onCheckedChange={(checked) =>
                              isEditing &&
                              (isNew
                                ? updateNewRow(id, "aprovacao", checked)
                                : updateEditingRow(id, "aprovacao", checked))
                            }
                            disabled={!isEditing}
                            className="border-2 border-blue-600 data-[state=checked]:bg-blue-600"
                          />
                        </td>

                        <td className="px-3 py-2 text-xs text-center bg-gray-100">
                          {(() => {
                            const progresso = data.progressoGeral || 0;
                            const aprovado = data.aprovacao || false;
                            
                            let statusTexto = "Não Iniciado";
                            let statusCor = "#dc2626"; // Vermelho
                            let statusBg = "#fee2e2"; // Vermelho claro fundo
                            
                            if (!aprovado) {
                              statusTexto = "Aguardando Aprovação";
                              statusCor = "#6b7280"; // Cinza
                              statusBg = "#f3f4f6";
                            } else if (progresso === -1) {
                              statusTexto = "Cancelado";
                              statusCor = "#ff0000"; // Vermelho Ferrari
                              statusBg = "#fee2e2";
                            } else if (progresso === 0) {
                              statusTexto = "Não Iniciado";
                              statusCor = "#dc2626"; // Vermelho
                              statusBg = "#fee2e2";
                            } else if (progresso === 100) {
                              statusTexto = "Concluído";
                              statusCor = "#16a34a"; // Verde
                              statusBg = "#dcfce7"; // Verde claro fundo
                            } else if (progresso > 0 && progresso < 100) {
                              statusTexto = "Em Andamento";
                              if (progresso <= 20) {
                                statusCor = "#f87171"; // Vermelho claro
                                statusBg = "#fee2e2";
                              } else if (progresso <= 50) {
                                statusCor = "#fb923c"; // Vermelho mais fraco (laranja)
                                statusBg = "#ffedd5";
                              } else if (progresso <= 70) {
                                statusCor = "#eab308"; // Amarelo
                                statusBg = "#fef9c3";
                              } else if (progresso <= 90) {
                                statusCor = "#facc15"; // Amarelo fraco
                                statusBg = "#fef9c3";
                              } else {
                                statusCor = "#22c55e"; // Verde
                                statusBg = "#dcfce7";
                              }
                            }
                            
                            return (
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                                style={{ 
                                  color: statusCor,
                                  backgroundColor: statusBg
                                }}
                              >
                                {statusTexto}
                              </span>
                            );
                          })()}
                        </td>

                        <td className="px-3 py-2 text-xs text-center bg-gray-100">
                          {!isNew && data.inicioReal ? new Date(data.inicioReal).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-3 py-2 text-xs text-center bg-gray-100">
                          {!isNew && data.fimPrevisto ? new Date(data.fimPrevisto).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-3 py-2 text-xs text-center bg-gray-100">
                          {!isNew ? `${data.qtdHoras || 0}h` : '0h'}
                        </td>
                        <td className="px-3 py-2 text-xs text-center bg-gray-100">
                          {!isNew ? data.totalTarefas || 0 : 0}
                        </td>
                        <td className="px-3 py-2 text-xs text-center bg-gray-100">
                          {!isNew ? data.emAndamento || 0 : 0}
                        </td>
                        <td className="px-3 py-2 text-xs text-center bg-gray-100">
                          {!isNew ? data.finalizadas || 0 : 0}
                        </td>
                        <td className="px-3 py-2 text-xs text-center bg-gray-100">
                          {!isNew ? data.naoIniciado || 0 : 0}
                        </td>
                        <td className="px-3 py-2 text-xs text-center bg-gray-100">
                          {!isNew ? data.cancelado || 0 : 0}
                        </td>
                        <td className="px-3 py-2 text-xs text-center bg-gray-100">
                          {!isNew ? data.dentroPrazo || 0 : 0}
                        </td>
                        <td className="px-3 py-2 text-xs text-center bg-gray-100">
                          {!isNew ? data.foraPrazo || 0 : 0}
                        </td>
                        <td className="px-3 py-2 bg-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-300 rounded-full h-4 overflow-hidden">
                              <div
                                className="h-full flex items-center justify-center text-[10px] font-bold transition-all text-white"
                                style={{ 
                                  width: `${Math.max(0, data.progressoGeral || 0)}%`,
                                  backgroundColor: (() => {
                                    const progresso = data.progressoGeral || 0;
                                    if (progresso === -1) return "#ff0000"; // Vermelho Ferrari (Cancelado)
                                    if (progresso === 0) return "#dc2626"; // Vermelho (Não Iniciado)
                                    if (progresso === 100) return "#16a34a"; // Verde (Concluído)
                                    if (progresso <= 20) return "#f87171"; // Vermelho claro
                                    if (progresso <= 50) return "#fb923c"; // Laranja
                                    if (progresso <= 70) return "#eab308"; // Amarelo
                                    if (progresso <= 90) return "#facc15"; // Amarelo fraco
                                    return "#22c55e"; // Verde (91-99%)
                                  })()
                                }}
                              >
                                {(data.progressoGeral || 0) > 10 && `${Math.round(data.progressoGeral || 0)}%`}
                              </div>
                            </div>
                            <span className="text-xs font-semibold min-w-[35px] text-right">{Math.round(data.progressoGeral || 0)}%</span>
                          </div>
                        </td>

                        <td className="px-3 py-2 text-center bg-white sticky right-0">
                          {isEditing ? (
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  isNew ? saveNewRow(id) : saveEditingRow(id);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isNew) {
                                    removeNewRow(id);
                                  } else {
                                    setEditingRows((prev) => {
                                      const newState = { ...prev };
                                      delete newState[id];
                                      return newState;
                                    });
                                    setValidationErrors((prev) => {
                                      const newErrors = { ...prev };
                                      delete newErrors[id];
                                      return newErrors;
                                    });
                                  }
                                }}
                                className="border-gray-300 hover:bg-gray-100 h-8 px-3"
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(id, data.nome);
                              }}
                              className="hover:bg-red-50 h-8 px-2"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
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

      <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-base pt-4">
              Deseja realmente excluir o projeto <strong>"{deleteModal.nome}"</strong>?
              <br />
              <br />
              Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, id: 0, nome: "" })}
              className="border-2 border-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

