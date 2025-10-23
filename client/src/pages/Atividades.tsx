import MainLayout from "@/components/MainLayout";
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
import { Zap, Trash2, Save, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Atividades() {
  const { data: atividades, isLoading, refetch } = trpc.atividades.list.useQuery();
  const { data: projetos } = trpc.projetos.list.useQuery();
  const { data: pessoas } = trpc.pessoas.list.useQuery();
  const createAtividade = trpc.atividades.create.useMutation();
  const updateAtividade = trpc.atividades.update.useMutation();
  const deleteAtividade = trpc.atividades.delete.useMutation();

  const [editedAtividades, setEditedAtividades] = useState<Record<number, any>>({});
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<number>>(new Set());

  const handleAdd = async () => {
    if (!projetos || projetos.length === 0) {
      toast.error(
        "❌ Não é possível criar atividades!\n\nPrimeiro você precisa criar pelo menos um projeto na aba 'Projetos'.",
        { duration: 5000 }
      );
      return;
    }

    try {
      await createAtividade.mutateAsync({
        codigo: `ATV${Date.now()}`,
        tarefa: "",
        projetoId: projetos[0].id,
      });
      await refetch();
      toast.success("Atividade adicionada!");
    } catch (error) {
      toast.error("Erro ao adicionar atividade");
    }
  };

  const handleChange = (id: number, field: string, value: any) => {
    setEditedAtividades((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    try {
      const updates = Object.entries(editedAtividades);
      if (updates.length === 0 && markedForDeletion.size === 0) {
        toast.info("Nenhuma alteração para salvar");
        return;
      }

      for (const [idStr, data] of updates) {
        const id = parseInt(idStr);
        if (!markedForDeletion.has(id)) {
          await updateAtividade.mutateAsync({ id, ...data });
        }
      }

      for (const id of Array.from(markedForDeletion)) {
        await deleteAtividade.mutateAsync({ id });
      }

      setEditedAtividades({});
      setMarkedForDeletion(new Set());
      await refetch();
      toast.success("✓ Alterações Salvas!", { duration: 2000 });
    } catch (error) {
      toast.error("Erro ao salvar alterações");
    }
  };

  const toggleMarkForDeletion = (id: number) => {
    setMarkedForDeletion((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getValue = (atividade: any, field: string) => {
    return editedAtividades[atividade.id]?.[field] ?? atividade[field] ?? "";
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12">Carregando...</div>
      </MainLayout>
    );
  }

  const pessoasAtivas = pessoas?.filter((p) => p.ativo) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-[#005CA9] flex items-center gap-3">
            <Zap className="h-8 w-8" />
            Atividades
          </h2>
          <div className="flex gap-3">
            <Button
              onClick={handleAdd}
              className="bg-[#F5B800] hover:bg-[#F5B800]/90 text-[#005CA9] font-semibold px-6 py-6 text-lg rounded-xl"
              disabled={!projetos || projetos.length === 0}
            >
              + Adicionar Atividade
            </Button>
            <Button
              onClick={handleSaveAll}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-6 text-lg rounded-xl"
            >
              <Save className="h-5 w-5 mr-2" />
              Salvar
            </Button>
          </div>
        </div>

        {!projetos || projetos.length === 0 ? (
          <div className="border-4 border-[#005CA9] rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Zap className="h-20 w-20 text-[#005CA9]/30" />
              <p className="text-xl text-gray-500 font-medium">
                Nenhum projeto cadastrado
              </p>
              <p className="text-gray-400">
                Primeiro crie um projeto na aba "Projetos"
              </p>
            </div>
          </div>
        ) : !atividades || atividades.length === 0 ? (
          <div className="border-4 border-[#005CA9] rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Zap className="h-20 w-20 text-[#005CA9]/30" />
              <p className="text-xl text-gray-500 font-medium">
                Nenhuma atividade cadastrada
              </p>
              <p className="text-gray-400">Clique em "Adicionar Atividade"</p>
            </div>
          </div>
        ) : (
          <div className="border-4 border-[#005CA9] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#005CA9] text-white">
                  <tr>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm min-w-[140px]">
                      Código
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm min-w-[200px]">
                      Projeto *
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm min-w-[250px]">
                      Tarefa
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm min-w-[200px]">
                      Responsável
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm min-w-[150px]">
                      Dias Prev.
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm min-w-[180px]">
                      Data Início
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm min-w-[120px] bg-gray-700">
                      Progresso %
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm min-w-[100px] bg-[#F5B800] text-[#005CA9]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {atividades.map((atividade, index) => {
                    const isMarked = markedForDeletion.has(atividade.id);

                    return (
                      <tr
                        key={atividade.id}
                        className={`border-b-2 border-[#005CA9]/10 transition-colors ${
                          isMarked
                            ? "marked-for-deletion"
                            : index % 2 === 0
                            ? "bg-white hover:bg-blue-50"
                            : "bg-gray-50 hover:bg-blue-50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <Input
                            value={getValue(atividade, "codigo")}
                            onChange={(e) =>
                              handleChange(atividade.id, "codigo", e.target.value)
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                            disabled={isMarked}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={String(getValue(atividade, "projetoId") || "")}
                            onValueChange={(value) =>
                              handleChange(atividade.id, "projetoId", parseInt(value))
                            }
                            disabled={isMarked}
                          >
                            <SelectTrigger className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {projetos?.map((proj) => (
                                <SelectItem key={proj.id} value={String(proj.id)}>
                                  {proj.codigo} - {proj.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={getValue(atividade, "tarefa")}
                            onChange={(e) =>
                              handleChange(atividade.id, "tarefa", e.target.value)
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                            disabled={isMarked}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={String(getValue(atividade, "responsavelId") || "")}
                            onValueChange={(value) =>
                              handleChange(
                                atividade.id,
                                "responsavelId",
                                value ? parseInt(value) : null
                              )
                            }
                            disabled={isMarked}
                          >
                            <SelectTrigger className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Nenhum</SelectItem>
                              {pessoasAtivas.map((pessoa) => (
                                <SelectItem key={pessoa.id} value={String(pessoa.id)}>
                                  {pessoa.nome || `Pessoa ${pessoa.id}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={getValue(atividade, "diasPrevistos")}
                            onChange={(e) =>
                              handleChange(
                                atividade.id,
                                "diasPrevistos",
                                parseInt(e.target.value)
                              )
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                            disabled={isMarked}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="date"
                            value={
                              atividade.dataInicio
                                ? new Date(atividade.dataInicio)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              handleChange(atividade.id, "dataInicio", e.target.value)
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                            disabled={isMarked}
                          />
                        </td>
                        <td className="px-4 py-3 bg-gray-100">
                          <div className="text-sm text-gray-600 font-medium text-center">
                            {atividade.progresso || 0}%
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMarkForDeletion(atividade.id)}
                            className={
                              isMarked ? "hover:bg-green-50" : "hover:bg-red-50"
                            }
                          >
                            {isMarked ? (
                              <Undo2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Trash2 className="h-5 w-5 text-red-600" />
                            )}
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

        {markedForDeletion.size > 0 && (
          <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 text-center">
            <p className="text-red-800 font-semibold">
              ⚠️ {markedForDeletion.size} atividade(s) marcada(s) para remoção
            </p>
            <p className="text-red-600 text-sm mt-1">
              Clique em "Salvar" para confirmar ou no ícone de desfazer
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

