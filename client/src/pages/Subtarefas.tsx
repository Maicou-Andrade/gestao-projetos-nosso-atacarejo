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
import { ListChecks, Save, Plus, Trash2, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// Funções auxiliares para conversão de datas
const formatDateToBR = (dateStr: string | Date | null): string => {
  if (!dateStr) return "";
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateToInput = (brDate: string): string => {
  if (!brDate || brDate.length !== 10) return "";
  const [day, month, year] = brDate.split('/');
  return `${year}-${month}-${day}`;
};

const formatInputToBR = (inputDate: string): string => {
  if (!inputDate) return "";
  const [year, month, day] = inputDate.split('-');
  return `${day}/${month}/${year}`;
};

export default function Subtarefas() {
  const { data: subtarefas, isLoading, refetch } = trpc.subtarefas.list.useQuery();
  const { data: atividades } = trpc.atividades.list.useQuery();
  const { data: pessoas } = trpc.pessoas.list.useQuery();
  const { data: projetos } = trpc.projetos.list.useQuery();
  const createSubtarefa = trpc.subtarefas.create.useMutation();
  const updateSubtarefa = trpc.subtarefas.update.useMutation();
  const deleteSubtarefa = trpc.subtarefas.delete.useMutation();

  const [editingRows, setEditingRows] = useState<Record<number, any>>({});
  const [newRows, setNewRows] = useState<any[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [selectedAtividade, setSelectedAtividade] = useState<number | null>(null);
  const [qtdSubtarefas, setQtdSubtarefas] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number; nome: string }>({ 
    open: false, id: 0, nome: "" 
  });
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

  const pessoasAtivas = pessoas?.filter((p) => p.ativo) || [];
  const atividadesDisponiveis = atividades || [];

  // Persistência: carregar do localStorage ao montar
  useEffect(() => {
    const saved = localStorage.getItem('subtarefas_newRows');
    if (saved) {
      try {
        setNewRows(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao carregar newRows:', e);
      }
    }
  }, []);

  // Persistência: salvar no localStorage quando newRows mudar
  useEffect(() => {
    if (newRows.length > 0) {
      localStorage.setItem('subtarefas_newRows', JSON.stringify(newRows));
    } else {
      localStorage.removeItem('subtarefas_newRows');
    }
  }, [newRows]);

  // Calcular resumo
  const totalSubtarefas = (subtarefas?.length || 0) + newRows.length;
  const subtarefasConcluidas = subtarefas?.filter((s) => s.progresso === 100).length || 0;

  const openAddModal = () => {
    if (atividadesDisponiveis.length === 0) {
      toast.error("Cadastre pelo menos uma atividade antes de adicionar subtarefas!");
      return;
    }
    setAddModal(true);
  };

  const createSubtarefasFromModal = () => {
    if (!selectedAtividade) {
      toast.error("Selecione uma atividade!");
      return;
    }
    
    const quantidade = parseInt(String(qtdSubtarefas)) || 1;
    if (quantidade < 1 || quantidade > 50) {
      toast.error("A quantidade deve ser entre 1 e 50 subtarefas!");
      return;
    }

    const atividade = atividadesDisponiveis.find((a) => a.id === selectedAtividade);
    if (!atividade) return;

    const projeto = projetos?.find((p) => p.id === atividade.projetoId);

    const novasSubtarefas = Array.from({ length: quantidade }, (_, index) => ({
      tempId: Date.now() + index,
      atividadeId: atividade.id,
      codigoAtividade: atividade.codigo,
      nomeAtividade: atividade.tarefa,
      codigoProjeto: projeto?.codigo || "-",
      nomeProjeto: projeto?.nome || "-",
      nome: "",
      responsavel: null,
      diasPrevistos: 0,
      dataInicio: "",
      previsaoEntrega: "",
      statusPrazo: "Dentro do Prazo",
      progresso: 0,
      qtdHoras: 0,
      horasUsadas: 0,
      observacoes: "",
    }));

    setNewRows([...newRows, ...novasSubtarefas]);
    setAddModal(false);
    setSelectedAtividade(null);
    setQtdSubtarefas(1);
    toast.success(`${quantidade} subtarefa(s) adicionada(s)!`);
  };

  const updateNewRow = (tempId: number, field: string, value: any) => {
    setNewRows((rows) =>
      rows.map((row) => {
        if (row.tempId === tempId) {
          const updated = { ...row, [field]: value };
          
          // Calcular Prev. Entrega
          if (field === "dataInicio" || field === "diasPrevistos") {
            if (updated.dataInicio && updated.diasPrevistos > 0) {
              const [ano, mes, dia] = updated.dataInicio.split('-').map(Number);
              const dataInicio = new Date(ano, mes - 1, dia);
              dataInicio.setDate(dataInicio.getDate() + parseInt(updated.diasPrevistos));
              const diaFim = String(dataInicio.getDate()).padStart(2, '0');
              const mesFim = String(dataInicio.getMonth() + 1).padStart(2, '0');
              const anoFim = dataInicio.getFullYear();
              updated.previsaoEntrega = `${diaFim}/${mesFim}/${anoFim}`;
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
          const [ano, mes, dia] = updated.dataInicio.split('-').map(Number);
          const dataInicio = new Date(ano, mes - 1, dia);
          dataInicio.setDate(dataInicio.getDate() + parseInt(updated.diasPrevistos));
          const diaFim = String(dataInicio.getDate()).padStart(2, '0');
          const mesFim = String(dataInicio.getMonth() + 1).padStart(2, '0');
          const anoFim = dataInicio.getFullYear();
          updated.previsaoEntrega = `${diaFim}/${mesFim}/${anoFim}`;
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

  const startEditing = (subtarefa: any) => {
    if (!editingRows[subtarefa.id]) {
      setEditingRows((prev) => ({
        ...prev,
        [subtarefa.id]: {
          ...subtarefa,
          dataInicio: subtarefa.dataInicio
            ? new Date(subtarefa.dataInicio as any).toISOString().split("T")[0]
            : "",
        },
      }));
    }
  };

  const saveNewRow = async (tempId: number) => {
    const row = newRows.find((r) => r.tempId === tempId);
    if (!row) return;

    const errors: string[] = [];
    if (!row.nome) errors.push("nome");
    if (!row.responsavel) errors.push("responsavel");

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
      await createSubtarefa.mutateAsync({
        codigo: `ST${Date.now()}`,
        atividadeId: row.atividadeId,
        nome: row.nome,
        responsavel: row.responsavel ? String(row.responsavel) : "",
        diasPrevistos: row.diasPrevistos || 0,
        dataInicio: row.dataInicio || undefined,
        progresso: row.progresso || 0,
        horasUtilizadas: row.horasUsadas || 0,
        observacoes: row.observacoes || "",
      });
      setNewRows((rows) => rows.filter((r) => r.tempId !== tempId));
      await refetch();
      toast.success("Subtarefa cadastrada!");
    } catch (error) {
      toast.error("Erro ao cadastrar subtarefa");
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
      await updateSubtarefa.mutateAsync({
        id,
        nome: row.nome,
        responsavel: row.responsavel ? String(row.responsavel) : "",
        diasPrevistos: row.diasPrevistos,
        dataInicio: row.dataInicio || undefined,
        progresso: row.progresso,
        horasUtilizadas: row.horasUsadas,
        observacoes: row.observacoes || "",
      });
      setEditingRows((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      await refetch();
      toast.success("Subtarefa atualizada!");
    } catch (error) {
      toast.error("Erro ao atualizar subtarefa");
    }
  };

  const removeNewRow = (tempId: number) => {
    setNewRows((rows) => rows.filter((r) => r.tempId !== tempId));
  };

  const openDeleteModal = (id: number, nome: string) => {
    setDeleteModal({ open: true, id, nome });
  };

  const confirmDelete = async () => {
    try {
      await deleteSubtarefa.mutateAsync({ id: deleteModal.id });
      await refetch();
      toast.success("Subtarefa removida!");
      setDeleteModal({ open: false, id: 0, nome: "" });
    } catch (error) {
      toast.error("Erro ao remover subtarefa");
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </MainLayout>
    );
  }

  // Combinar subtarefas salvas com novas linhas
  const allRows = [
    ...(subtarefas || []).map((s) => {
      const atividade = atividades?.find((a) => a.id === s.atividadeId);
      const projeto = projetos?.find((p) => p.id === atividade?.projetoId);
      return {
        ...s,
        isNew: false,
        codigoAtividade: atividade?.codigo || "-",
        nomeAtividade: atividade?.tarefa || "-",
        codigoProjeto: projeto?.codigo || "-",
        nomeProjeto: projeto?.nome || "-",
        projetoAprovado: projeto?.aprovacao || false,
      };
    }),
    ...newRows.map((r) => ({ ...r, isNew: true })),
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ListChecks className="h-8 w-8 text-[#005CA9]" />
            <h1 className="text-3xl font-bold text-[#005CA9]">SubAtividades</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200">
              Total: <span className="font-semibold text-[#005CA9]">{totalSubtarefas}</span> | 
              Concluídas: <span className="font-semibold text-green-600">{subtarefasConcluidas}</span>
            </div>
            <Button
              onClick={openAddModal}
              className="bg-[#005CA9] hover:bg-[#005CA9]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Subtarefa
            </Button>
            {newRows.length > 0 && (
              <Button
                onClick={saveAllRows}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            )}
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#005CA9] text-white">
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">Código Projeto</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">Projeto</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">Código Atividade</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">Atividade</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase bg-[#F5B800] text-black">Subtarefa *</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase bg-[#F5B800] text-black">Responsável *</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">Dias Prev.</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">Data Início</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">Prev. Entrega</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">Status</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">Status Prazo</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">Progresso %</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">QTD Horas</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">Horas Usadas</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">Dif. Horas</th>
                  <th className="px-3 py-3 text-left font-semibold text-xs uppercase">Observações</th>
                  <th className="px-3 py-3 text-center font-semibold text-xs uppercase bg-[#F5B800] text-black">Ações</th>
                </tr>
              </thead>
              <tbody>
                {allRows.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="px-6 py-12 text-center">
                      <ListChecks className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Nenhuma subtarefa cadastrada</p>
                      <p className="text-gray-400 text-sm mt-1">Clique em "Adicionar Subtarefa" para começar</p>
                    </td>
                  </tr>
                ) : (
                  allRows.map((subtarefa) => {
                    const isNew = subtarefa.isNew;
                    const id = isNew ? subtarefa.tempId : subtarefa.id;
                    const isEditing = isNew || !!editingRows[id];
                    const data = isEditing ? (isNew ? subtarefa : editingRows[id]) : subtarefa;
                    const errors = validationErrors[id] || [];
                    const projetoAprovado = subtarefa.projetoAprovado || false;

                    // Calcular QTD Horas e Dif. Horas
                    const qtdHoras = (data.diasPrevistos || 0) * 7;
                    const horasUsadas = data.horasUsadas || 0;
                    const difHoras = qtdHoras - horasUsadas;
                    const difHorasColor = difHoras >= 0 ? "text-green-600" : "text-red-600";

                    return (
                      <tr
                        key={id}
                        className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                        onClick={() => !isNew && startEditing(subtarefa)}
                      >
                        {/* Código Projeto */}
                        <td className="px-3 py-2">
                          <span className="text-xs font-mono text-[#005CA9] font-semibold">
                            {data.codigoProjeto}
                          </span>
                        </td>

                        {/* Projeto */}
                        <td className="px-3 py-2">
                          <span className="text-xs">{data.nomeProjeto}</span>
                        </td>

                        {/* Código Atividade */}
                        <td className="px-3 py-2">
                          <span className="text-xs font-mono text-[#005CA9] font-semibold">
                            {data.codigoAtividade}
                          </span>
                        </td>

                        {/* Atividade */}
                        <td className="px-3 py-2">
                          <span className="text-xs">{data.nomeAtividade}</span>
                        </td>

                        {/* Subtarefa */}
                        <td className="px-3 py-2 bg-yellow-50">
                          <Input
                            value={data.nome || ""}
                            onChange={(e) =>
                              isNew
                                ? updateNewRow(id, "nome", e.target.value)
                                : updateEditingRow(id, "nome", e.target.value)
                            }
                            className={`h-9 text-xs min-w-[250px] ${!isEditing ? "border-0 bg-transparent" : ""} ${errors.includes("nome") ? "border-2 border-red-500" : ""}`}
                            placeholder="Nome da subtarefa"
                            readOnly={!isEditing}
                          />
                        </td>

                        {/* Responsável */}
                        <td className="px-3 py-2 bg-yellow-50">
                          {isEditing ? (
                            <select
                              value={data.responsavel || ""}
                              onChange={(e) =>
                                isNew
                                  ? updateNewRow(id, "responsavel", e.target.value)
                                  : updateEditingRow(id, "responsavel", e.target.value)
                              }
                              className={`h-9 text-xs border rounded px-2 w-full min-w-[150px] ${errors.includes("responsavel") ? "border-2 border-red-500" : ""}`}
                            >
                              <option value="">Selecionar...</option>
                              {pessoasAtivas.map((pessoa) => (
                                <option key={pessoa.id} value={pessoa.id}>
                                  {pessoa.nome}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs">
                              {pessoasAtivas.find((p) => p.id === parseInt(data.responsavel))?.nome || "-"}
                            </span>
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
                          {isEditing ? (
                            <Input
                              type="date"
                              value={data.dataInicio || ""}
                              onChange={(e) =>
                                isNew
                                  ? updateNewRow(id, "dataInicio", e.target.value)
                                  : updateEditingRow(id, "dataInicio", e.target.value)
                              }
                              className="h-9 text-xs"
                            />
                          ) : (
                            <span className="text-xs">
                              {data.dataInicio ? formatInputToBR(data.dataInicio) : "-"}
                            </span>
                          )}
                        </td>

                        {/* Prev. Entrega */}
                        <td className="px-3 py-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {data.previsaoEntrega || "-"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2 text-xs text-center">
                          {(() => {
                            const progresso = data.progresso || 0;
                            const aprovado = projetoAprovado;
                            
                            let statusTexto = "Não Iniciado";
                            let statusCor = "#dc2626";
                            let statusBg = "#fee2e2";
                            
                            if (!aprovado) {
                              statusTexto = "Aguardando Aprovação";
                              statusCor = "#6b7280";
                              statusBg = "#f3f4f6";
                            } else if (progresso === -1) {
                              statusTexto = "Cancelado";
                              statusCor = "#ff0000";
                              statusBg = "#fee2e2";
                            } else if (progresso === 0) {
                              statusTexto = "Não Iniciado";
                              statusCor = "#dc2626";
                              statusBg = "#fee2e2";
                            } else if (progresso === 100) {
                              statusTexto = "Concluído";
                              statusCor = "#16a34a";
                              statusBg = "#dcfce7";
                            } else if (progresso > 0 && progresso < 100) {
                              statusTexto = "Em Andamento";
                              if (progresso <= 20) {
                                statusCor = "#f87171";
                                statusBg = "#fee2e2";
                              } else if (progresso <= 50) {
                                statusCor = "#fb923c";
                                statusBg = "#ffedd5";
                              } else if (progresso <= 70) {
                                statusCor = "#eab308";
                                statusBg = "#fef9c3";
                              } else if (progresso <= 90) {
                                statusCor = "#facc15";
                                statusBg = "#fef9c3";
                              } else {
                                statusCor = "#22c55e";
                                statusBg = "#dcfce7";
                              }
                            }
                            
                            return (
                              <span
                                className="px-2 py-1 rounded text-xs font-semibold"
                                style={{
                                  color: statusCor,
                                  backgroundColor: statusBg,
                                }}
                              >
                                {statusTexto}
                              </span>
                            );
                          })()}
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

                        {/* QTD Horas */}
                        <td className="px-3 py-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">
                            {qtdHoras}
                          </span>
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

                        {/* Dif. Horas */}
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
                                  startEditing(subtarefa);
                                }}
                                className="bg-[#005CA9] hover:bg-[#005CA9]/90 text-white h-7 px-2"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {isNew ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewRows(prev => prev.filter(row => row.tempId !== id));
                                  toast.success("Linha removida");
                                }}
                                className="hover:bg-red-50 h-7 px-2"
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(id, subtarefa.nome);
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
      </div>

      {/* Modal Adicionar Subtarefas */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#005CA9]">Adicionar Subtarefas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Atividade *</label>
              <select
                value={selectedAtividade || ""}
                onChange={(e) => setSelectedAtividade(parseInt(e.target.value))}
                className="w-full h-10 text-sm border rounded px-3"
              >
                <option value="">Selecione uma atividade...</option>
                {atividadesDisponiveis.map((atividade) => {
                  const projeto = projetos?.find((p) => p.id === atividade.projetoId);
                  return (
                    <option key={atividade.id} value={atividade.id}>
                      {projeto?.codigo} - {atividade.tarefa}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Quantidade de Subtarefas *</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={qtdSubtarefas}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= 50) {
                    setQtdSubtarefas(val);
                  } else if (e.target.value === '') {
                    setQtdSubtarefas(1);
                  }
                }}
                onFocus={(e) => e.target.select()}
                className="w-full"
                placeholder="Digite a quantidade (1-50)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddModal(false);
                setSelectedAtividade(null);
                setQtdSubtarefas(1);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={createSubtarefasFromModal}
              className="bg-[#F5B800] hover:bg-[#F5B800]/90 text-black"
            >
              Criar Subtarefas
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
            Tem certeza que deseja remover a subtarefa <strong>"{deleteModal.nome}"</strong>?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, id: 0, nome: "" })}
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

