import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { FolderKanban, Trash2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Projetos() {
  const { data: projetos, isLoading, refetch } = trpc.projetos.list.useQuery();
  const { data: pessoas } = trpc.pessoas.list.useQuery();
  const { data: atividades } = trpc.atividades.list.useQuery();
  const createProjeto = trpc.projetos.create.useMutation();
  const updateProjeto = trpc.projetos.update.useMutation();
  const deleteProjeto = trpc.projetos.delete.useMutation();

  const [editedProjetos, setEditedProjetos] = useState<Record<number, any>>({});
  const [selectedResponsaveis, setSelectedResponsaveis] = useState<
    Record<number, number[]>
  >({});

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

  const toggleResponsavel = (projetoId: number, pessoaId: number) => {
    setSelectedResponsaveis((prev) => {
      const current = prev[projetoId] || [];
      const updated = current.includes(pessoaId)
        ? current.filter((id) => id !== pessoaId)
        : [...current, pessoaId];

      handleChange(projetoId, "responsaveis", updated.join(","));

      return {
        ...prev,
        [projetoId]: updated,
      };
    });
  };

  const getResponsaveisIds = (projeto: any): number[] => {
    if (selectedResponsaveis[projeto.id]) {
      return selectedResponsaveis[projeto.id];
    }
    if (projeto.responsaveis) {
      return projeto.responsaveis
        .split(",")
        .map((id: string) => parseInt(id.trim()))
        .filter((id: number) => !isNaN(id));
    }
    return [];
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
        `❌ Este projeto possui ${atividadesVinculadas.length} atividade(s) vinculada(s)!\n\nPara remover este projeto, primeiro exclua todas as atividades vinculadas a ele na aba 'Atividades'.`,
        { duration: 6000 }
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

  const pessoasAtivas = pessoas?.filter((p) => p.ativo) || [];

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
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[100px]">
                      Código
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[200px]">
                      Nome *
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[300px]">
                      Descrição *
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[150px]">
                      Prioridade *
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[250px]">
                      Responsáveis *
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[180px]">
                      Início Planejado
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[180px]">
                      Fim Planejado *
                    </th>
                    <th className="px-4 py-4 text-center font-bold uppercase text-sm whitespace-nowrap min-w-[120px]">
                      Aprovação
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap bg-gray-700 min-w-[140px]">
                      Início Real
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap bg-gray-700 min-w-[140px]">
                      Fim Previsto
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap bg-gray-700 min-w-[120px]">
                      Qtd Horas
                    </th>
                    <th className="px-4 py-4 text-center font-bold uppercase text-sm whitespace-nowrap bg-[#F5B800] text-[#005CA9] min-w-[100px]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {projetos.map((projeto, index) => {
                    const responsaveisIds = getResponsaveisIds(projeto);
                    const responsaveisNomes = responsaveisIds
                      .map((id) => pessoasAtivas.find((p) => p.id === id)?.nome)
                      .filter(Boolean)
                      .join(", ");

                    return (
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
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={getValue(projeto, "nome")}
                            onChange={(e) =>
                              handleChange(projeto.id, "nome", e.target.value)
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Textarea
                            value={getValue(projeto, "descricao")}
                            onChange={(e) =>
                              handleChange(projeto.id, "descricao", e.target.value)
                            }
                            className="border-2 border-[#005CA9]/20 focus:border-[#005CA9] min-h-[44px]"
                            rows={2}
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
                              <SelectItem value="Selecionar...">Selecionar...</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left border-2 border-[#005CA9]/20 hover:border-[#005CA9] min-h-[44px]"
                              >
                                <span className="truncate">
                                  {responsaveisIds.length > 0
                                    ? `${responsaveisIds.length} responsáveis selecionados`
                                    : "Selecionar..."}
                                </span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 max-h-96 overflow-y-auto">
                              <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-[#005CA9] mb-3">
                                  Selecione os Responsáveis
                                </h4>
                                {pessoasAtivas.length === 0 ? (
                                  <p className="text-sm text-gray-500">
                                    Nenhuma pessoa cadastrada
                                  </p>
                                ) : (
                                  pessoasAtivas.map((pessoa) => (
                                    <label
                                      key={pessoa.id}
                                      className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={responsaveisIds.includes(pessoa.id)}
                                        onCheckedChange={() =>
                                          toggleResponsavel(projeto.id, pessoa.id)
                                        }
                                      />
                                      <span className="text-sm">
                                        {pessoa.nome || `Pessoa ${pessoa.id}`}
                                      </span>
                                    </label>
                                  ))
                                )}
                              </div>
                              {responsaveisIds.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <p className="text-xs text-gray-600 font-medium">
                                    Selecionados:
                                  </p>
                                  <p className="text-xs text-gray-800 mt-1">
                                    {responsaveisNomes}
                                  </p>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
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
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={
                              editedProjetos[projeto.id]?.aprovacao ?? projeto.aprovacao
                            }
                            onChange={(e) =>
                              handleChange(projeto.id, "aprovacao", e.target.checked)
                            }
                            className="h-6 w-6 accent-[#005CA9]"
                          />
                        </td>
                        <td className="px-4 py-3 bg-gray-100">
                          <div className="text-sm text-gray-600 text-center">-</div>
                        </td>
                        <td className="px-4 py-3 bg-gray-100">
                          <div className="text-sm text-gray-600 text-center">-</div>
                        </td>
                        <td className="px-4 py-3 bg-gray-100">
                          <div className="text-sm text-gray-600 text-center">0</div>
                        </td>
                        <td className="px-4 py-3 text-center">
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

