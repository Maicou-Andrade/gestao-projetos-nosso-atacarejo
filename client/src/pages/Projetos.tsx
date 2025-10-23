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
import { FolderKanban, Trash2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Projetos() {
  const { data: projetos, isLoading, refetch } = trpc.projetos.list.useQuery();
  const { data: atividades } = trpc.atividades.list.useQuery();
  const createProjeto = trpc.projetos.create.useMutation();
  const updateProjeto = trpc.projetos.update.useMutation();
  const deleteProjeto = trpc.projetos.delete.useMutation();

  const [editedProjetos, setEditedProjetos] = useState<Record<number, any>>({});

  const handleAdd = async () => {
    try {
      await createProjeto.mutateAsync({
        codigo: `PRJ${Date.now()}`,
        nome: "",
        prioridade: "Média",
        aprovacao: false,
      });
      await refetch();
      toast.success("Projeto adicionado!");
    } catch (error) {
      toast.error("Erro ao adicionar projeto");
    }
  };

  const handleChange = (id: number, field: string, value: any) => {
    setEditedProjetos((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    try {
      const updates = Object.entries(editedProjetos);
      if (updates.length === 0) {
        toast.info("Nenhuma alteração para salvar");
        return;
      }

      for (const [idStr, data] of updates) {
        const id = parseInt(idStr);
        await updateProjeto.mutateAsync({ id, ...data });
      }

      setEditedProjetos({});
      await refetch();
      toast.success("✓ Alterações Salvas!", { duration: 2000 });
    } catch (error) {
      toast.error("Erro ao salvar alterações");
    }
  };

  const handleDelete = async (id: number, codigo: string) => {
    const atividadesVinculadas = atividades?.filter((a) => a.projetoId === id);

    if (atividadesVinculadas && atividadesVinculadas.length > 0) {
      toast.error(
        `Este projeto possui ${atividadesVinculadas.length} atividade(s) vinculada(s). Para remover este projeto, primeiro exclua todas as atividades vinculadas a ele na aba 'Atividades'.`,
        { duration: 5000 }
      );
      return;
    }

    if (!confirm(`Deseja realmente excluir o projeto ${codigo}?`)) return;

    try {
      await deleteProjeto.mutateAsync({ id });
      await refetch();
      toast.success("Projeto excluído!");
    } catch (error) {
      toast.error("Erro ao excluir projeto");
    }
  };

  const getValue = (projeto: any, field: string) => {
    return editedProjetos[projeto.id]?.[field] ?? projeto[field] ?? "";
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
            <FolderKanban className="h-8 w-8" />
            Projetos
          </h2>
          <div className="flex gap-3">
            <Button
              onClick={handleAdd}
              className="bg-[#F5B800] hover:bg-[#F5B800]/90 text-[#005CA9] font-semibold px-6 py-6 text-lg rounded-xl"
            >
              + Novo Projeto
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
              <FolderKanban className="h-20 w-20 text-[#005CA9]/30" />
              <p className="text-xl text-gray-500 font-medium">
                Nenhum projeto cadastrado
              </p>
              <p className="text-gray-400">Clique em "Novo Projeto" para começar</p>
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
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[200px]">
                      Nome *
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[300px]">
                      Descrição
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Prioridade
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[300px]">
                      Responsáveis
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Início Planejado
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Fim Planejado
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap bg-gray-700">
                      Progresso %
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Observações
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap">
                      Aprovação
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap bg-[#F5B800] text-[#005CA9]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {projetos.map((projeto, index) => (
                    <tr
                      key={projeto.id}
                      className={`border-b-2 border-[#005CA9]/10 hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Input
                          value={getValue(projeto, "codigo")}
                          onChange={(e) =>
                            handleChange(projeto.id, "codigo", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={getValue(projeto, "nome")}
                          onChange={(e) =>
                            handleChange(projeto.id, "nome", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={getValue(projeto, "descricao")}
                          onChange={(e) =>
                            handleChange(projeto.id, "descricao", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={getValue(projeto, "prioridade") || "Média"}
                          onValueChange={(value) =>
                            handleChange(projeto.id, "prioridade", value)
                          }
                        >
                          <SelectTrigger className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]">
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
                      <td className="px-4 py-3">
                        <Input
                          value={getValue(projeto, "responsaveis")}
                          onChange={(e) =>
                            handleChange(projeto.id, "responsaveis", e.target.value)
                          }
                          placeholder="IDs separados por vírgula"
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="date"
                          value={
                            projeto.inicioPlanejado
                              ? new Date(projeto.inicioPlanejado)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleChange(projeto.id, "inicioPlanejado", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="date"
                          value={
                            projeto.fimPlanejado
                              ? new Date(projeto.fimPlanejado)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleChange(projeto.id, "fimPlanejado", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={getValue(projeto, "status")}
                          onChange={(e) =>
                            handleChange(projeto.id, "status", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                        />
                      </td>
                      <td className="px-4 py-3 bg-gray-100">
                        <div className="text-sm text-gray-600 font-medium text-center">
                          {projeto.progresso || 0}%
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={getValue(projeto, "observacoes")}
                          onChange={(e) =>
                            handleChange(projeto.id, "observacoes", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={
                            editedProjetos[projeto.id]?.aprovacao ??
                            projeto.aprovacao
                          }
                          onChange={(e) =>
                            handleChange(projeto.id, "aprovacao", e.target.checked)
                          }
                          className="h-5 w-5 accent-[#005CA9]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(projeto.id, projeto.codigo)}
                          className="hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

