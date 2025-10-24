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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { FolderKanban, Trash2, Edit, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Projetos() {
  const { data: projetos, isLoading, refetch } = trpc.projetos.list.useQuery();
  const { data: pessoas } = trpc.pessoas.list.useQuery();
  const { data: atividades } = trpc.atividades.list.useQuery();
  const createProjeto = trpc.projetos.create.useMutation();
  const updateProjeto = trpc.projetos.update.useMutation();
  const deleteProjeto = trpc.projetos.delete.useMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<any>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    descricao: "",
    prioridade: "Média" as "Baixa" | "Média" | "Alta" | "Crítica",
    responsaveis: [] as number[],
    inicioPlanejado: "",
    fimPlanejado: "",
    aprovacao: false,
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const openModal = (projeto?: any) => {
    if (projeto) {
      setEditingProjeto(projeto);
      const responsaveisIds = projeto.responsaveis
        ? projeto.responsaveis
            .split(",")
            .map((id: string) => parseInt(id.trim()))
            .filter((id: number) => !isNaN(id))
        : [];

      setFormData({
        codigo: projeto.codigo || "",
        nome: projeto.nome || "",
        descricao: projeto.descricao || "",
        prioridade: projeto.prioridade || "Média",
        responsaveis: responsaveisIds,
        inicioPlanejado: projeto.inicioPlanejado
          ? new Date(projeto.inicioPlanejado).toISOString().split("T")[0]
          : "",
        fimPlanejado: projeto.fimPlanejado
          ? new Date(projeto.fimPlanejado).toISOString().split("T")[0]
          : "",
        aprovacao: projeto.aprovacao || false,
      });
    } else {
      setEditingProjeto(null);
      setFormData({
        codigo: `PRJ${Date.now()}`,
        nome: "",
        descricao: "",
        prioridade: "Média" as "Baixa" | "Média" | "Alta" | "Crítica",
        responsaveis: [],
        inicioPlanejado: "",
        fimPlanejado: "",
        aprovacao: false,
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProjeto(null);
    setErrors({});
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const toggleResponsavel = (pessoaId: number) => {
    setFormData((prev) => {
      const updated = prev.responsaveis.includes(pessoaId)
        ? prev.responsaveis.filter((id) => id !== pessoaId)
        : [...prev.responsaveis, pessoaId];
      return { ...prev, responsaveis: updated };
    });
    if (errors.responsaveis) {
      setErrors((prev) => ({ ...prev, responsaveis: false }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};

    if (!formData.nome.trim()) newErrors.nome = true;
    if (!formData.descricao.trim()) newErrors.descricao = true;
    if (formData.responsaveis.length === 0) newErrors.responsaveis = true;
    if (!formData.fimPlanejado) newErrors.fimPlanejado = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("❌ Preencha todos os campos obrigatórios!");
      return;
    }

    try {
      const data = {
        ...formData,
        responsaveis: formData.responsaveis.join(","),
      };

      if (editingProjeto) {
        await updateProjeto.mutateAsync({
          id: editingProjeto.id,
          ...data,
        });
        toast.success("Projeto atualizado com sucesso!");
      } else {
        await createProjeto.mutateAsync(data);
        toast.success("Projeto cadastrado com sucesso!");
      }
      await refetch();
      closeModal();
    } catch (error) {
      toast.error("Erro ao salvar projeto");
    }
  };

  const handleDelete = async (id: number, codigo: string) => {
    const atividadesVinculadas = atividades?.filter((a) => a.projetoId === id);

    if (atividadesVinculadas && atividadesVinculadas.length > 0) {
      toast.error(
        `❌ Este projeto possui ${atividadesVinculadas.length} atividade(s) vinculada(s)!\n\nPara remover este projeto, primeiro exclua todas as atividades vinculadas.`,
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
          <Button
            onClick={() => openModal()}
            className="bg-[#F5B800] hover:bg-[#F5B800]/90 text-[#005CA9] font-semibold px-6 py-6 text-lg rounded-xl"
          >
            + Novo Projeto
          </Button>
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
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm">Código</th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm">Nome</th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm">Descrição</th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm">Prioridade</th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm">Responsáveis</th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm">Início Plan.</th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm">Fim Plan.</th>
                    <th className="px-4 py-4 text-center font-bold uppercase text-sm">Aprovação</th>
                    <th className="px-4 py-4 text-center font-bold uppercase text-sm bg-[#F5B800] text-[#005CA9]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {projetos.map((projeto, index) => {
                    const responsaveisIds = projeto.responsaveis
                      ? projeto.responsaveis.split(",").map((id) => parseInt(id.trim()))
                      : [];
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
                        <td className="px-4 py-3 text-sm">{projeto.codigo}</td>
                        <td className="px-4 py-3 text-sm font-medium">{projeto.nome}</td>
                        <td className="px-4 py-3 text-sm max-w-xs truncate">
                          {projeto.descricao}
                        </td>
                        <td className="px-4 py-3 text-sm">{projeto.prioridade}</td>
                        <td className="px-4 py-3 text-sm">{responsaveisNomes || "-"}</td>
                        <td className="px-4 py-3 text-sm">
                          {projeto.inicioPlanejado
                            ? new Date(projeto.inicioPlanejado).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {projeto.fimPlanejado
                            ? new Date(projeto.fimPlanejado).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              projeto.aprovacao
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {projeto.aprovacao ? "Aprovado" : "Pendente"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModal(projeto)}
                              className="hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4 text-[#005CA9]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(projeto.id, projeto.codigo)}
                              className="hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#005CA9]">
              {editingProjeto ? "Editar Projeto" : "Novo Projeto"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="codigo" className="text-sm font-semibold">
                Código
              </Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => handleChange("codigo", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="prioridade" className="text-sm font-semibold">
                Prioridade *
              </Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value) => handleChange("prioridade", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="nome" className="text-sm font-semibold">
                Nome *
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                className={`mt-1 ${errors.nome ? "border-red-500 border-2" : ""}`}
                placeholder="Nome do projeto"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="descricao" className="text-sm font-semibold">
                Descrição *
              </Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                className={`mt-1 ${errors.descricao ? "border-red-500 border-2" : ""}`}
                placeholder="Descreva o projeto"
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label className="text-sm font-semibold">Responsáveis *</Label>
              <div
                className={`mt-2 border-2 rounded-md p-3 max-h-40 overflow-y-auto ${
                  errors.responsaveis ? "border-red-500" : "border-gray-200"
                }`}
              >
                {pessoasAtivas.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma pessoa cadastrada</p>
                ) : (
                  <div className="space-y-2">
                    {pessoasAtivas.map((pessoa) => (
                      <label
                        key={pessoa.id}
                        className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.responsaveis.includes(pessoa.id)}
                          onCheckedChange={() => toggleResponsavel(pessoa.id)}
                        />
                        <span className="text-sm">{pessoa.nome || `Pessoa ${pessoa.id}`}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="inicioPlanejado" className="text-sm font-semibold">
                Início Planejado
              </Label>
              <Input
                id="inicioPlanejado"
                type="date"
                value={formData.inicioPlanejado}
                onChange={(e) => handleChange("inicioPlanejado", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="fimPlanejado" className="text-sm font-semibold">
                Fim Planejado *
              </Label>
              <Input
                id="fimPlanejado"
                type="date"
                value={formData.fimPlanejado}
                onChange={(e) => handleChange("fimPlanejado", e.target.value)}
                className={`mt-1 ${errors.fimPlanejado ? "border-red-500 border-2" : ""}`}
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.aprovacao}
                  onCheckedChange={(checked) => handleChange("aprovacao", checked)}
                />
                <span className="text-sm font-semibold">Projeto Aprovado</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeModal}
              className="border-2 border-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

