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
import { CheckSquare, Trash2, Save, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Subtarefas() {
  const { data: subtarefas, isLoading, refetch } = trpc.subtarefas.list.useQuery();
  const { data: atividades } = trpc.atividades.list.useQuery();
  const { data: pessoas } = trpc.pessoas.list.useQuery();
  const createSubtarefa = trpc.subtarefas.create.useMutation();
  const updateSubtarefa = trpc.subtarefas.update.useMutation();
  const deleteSubtarefa = trpc.subtarefas.delete.useMutation();

  const [editedSubtarefas, setEditedSubtarefas] = useState<Record<number, any>>({});
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<number>>(new Set());

  const handleAdd = async () => {
    if (!atividades || atividades.length === 0) {
      toast.error(
        "❌ Não é possível criar subtarefas!\n\nPrimeiro você precisa criar pelo menos uma atividade.",
        { duration: 5000 }
      );
      return;
    }

    try {
      await createSubtarefa.mutateAsync({
        codigo: `SUB${Date.now()}`,
        nome: "",
        atividadeId: atividades[0].id,
      });
      await refetch();
      toast.success("Subtarefa adicionada!");
    } catch (error) {
      toast.error("Erro ao adicionar subtarefa");
    }
  };

  const handleChange = (id: number, field: string, value: any) => {
    setEditedSubtarefas((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    try {
      const updates = Object.entries(editedSubtarefas);
      if (updates.length === 0 && markedForDeletion.size === 0) {
        toast.info("Nenhuma alteração para salvar");
        return;
      }

      for (const [idStr, data] of updates) {
        const id = parseInt(idStr);
        if (!markedForDeletion.has(id)) {
          await updateSubtarefa.mutateAsync({ id, ...data });
        }
      }

      for (const id of Array.from(markedForDeletion)) {
        await deleteSubtarefa.mutateAsync({ id });
      }

      setEditedSubtarefas({});
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

  const getValue = (subtarefa: any, field: string) => {
    return editedSubtarefas[subtarefa.id]?.[field] ?? subtarefa[field] ?? "";
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
            <CheckSquare className="h-8 w-8" />
            SubAtividades
          </h2>
          <div className="flex gap-3">
            <Button
              onClick={handleAdd}
              className="bg-[#F5B800] hover:bg-[#F5B800]/90 text-[#005CA9] font-semibold px-6 py-6 text-lg rounded-xl"
              disabled={!atividades || atividades.length === 0}
            >
              + Adicionar Subtarefa
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

        {!atividades || atividades.length === 0 ? (
          <div className="border-4 border-[#005CA9] rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <CheckSquare className="h-20 w-20 text-[#005CA9]/30" />
              <p className="text-xl text-gray-500 font-medium">
                Nenhuma atividade cadastrada
              </p>
              <p className="text-gray-400">Primeiro crie uma atividade</p>
            </div>
          </div>
        ) : !subtarefas || subtarefas.length === 0 ? (
          <div className="border-4 border-[#005CA9] rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <CheckSquare className="h-20 w-20 text-[#005CA9]/30" />
              <p className="text-xl text-gray-500 font-medium">
                Nenhuma subtarefa cadastrada
              </p>
              <p className="text-gray-400">Clique em "Adicionar Subtarefa"</p>
            </div>
          </div>
        ) : (
          <div className="border-4 border-[#005CA9] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#005CA9] text-white">
                  <tr>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm min-w-[120px]">
                      Código
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm min-w-[250px]">
                      Nome
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm min-w-[200px]">
                      Atividade
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm min-w-[200px]">
                      Responsável
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm min-w-[150px]">
                      Status
                    </th>
                    <th className="px-4 py-4 text-center font-bold uppercase text-sm min-w-[100px] bg-[#F5B800] text-[#005CA9]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {subtarefas.map((subtarefa, index) => {
                    const isMarked = markedForDeletion.has(subtarefa.id);

                    return (
                      <tr
                        key={subtarefa.id}
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
                            value={getValue(subtarefa, "codigo")}
                            onChange={(e) =>
                              handleChange(subtarefa.id, "codigo", e.target.value)
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                            disabled={isMarked}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={getValue(subtarefa, "nome")}
                            onChange={(e) =>
                              handleChange(subtarefa.id, "nome", e.target.value)
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                            disabled={isMarked}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={String(getValue(subtarefa, "atividadeId") || "")}
                            onValueChange={(value) =>
                              handleChange(
                                subtarefa.id,
                                "atividadeId",
                                parseInt(value)
                              )
                            }
                            disabled={isMarked}
                          >
                            <SelectTrigger className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {atividades?.map((ativ) => (
                                <SelectItem key={ativ.id} value={String(ativ.id)}>
                                  {ativ.tarefa}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={String(getValue(subtarefa, "responsavelId") || "")}
                            onValueChange={(value) =>
                              handleChange(
                                subtarefa.id,
                                "responsavelId",
                                value ? parseInt(value) : null
                              )
                            }
                            disabled={isMarked}
                          >
                            <SelectTrigger className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]">
                              <SelectValue placeholder="Selecionar..." />
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
                            value={getValue(subtarefa, "status")}
                            onChange={(e) =>
                              handleChange(subtarefa.id, "status", e.target.value)
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                            disabled={isMarked}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMarkForDeletion(subtarefa.id)}
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
              ⚠️ {markedForDeletion.size} subtarefa(s) marcada(s) para remoção
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

