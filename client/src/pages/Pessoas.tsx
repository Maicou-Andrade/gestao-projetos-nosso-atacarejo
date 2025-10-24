import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Users, Trash2, Edit, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Pessoas() {
  const { data: pessoas, isLoading, refetch } = trpc.pessoas.list.useQuery();
  const createPessoa = trpc.pessoas.create.useMutation();
  const updatePessoa = trpc.pessoas.update.useMutation();
  const deletePessoa = trpc.pessoas.delete.useMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPessoa, setEditingPessoa] = useState<any>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    email: "",
    telefone: "",
    cargo: "",
    setor: "",
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const openModal = (pessoa?: any) => {
    if (pessoa) {
      setEditingPessoa(pessoa);
      setFormData({
        codigo: pessoa.codigo || "",
        nome: pessoa.nome || "",
        email: pessoa.email || "",
        telefone: pessoa.telefone || "",
        cargo: pessoa.cargo || "",
        setor: pessoa.setor || "",
      });
    } else {
      setEditingPessoa(null);
      setFormData({
        codigo: `P${Date.now()}`,
        nome: "",
        email: "",
        telefone: "",
        cargo: "",
        setor: "",
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPessoa(null);
    setFormData({
      codigo: "",
      nome: "",
      email: "",
      telefone: "",
      cargo: "",
      setor: "",
    });
    setErrors({});
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    
    if (!formData.nome.trim()) newErrors.nome = true;
    if (!formData.email.trim()) newErrors.email = true;
    if (!formData.cargo.trim()) newErrors.cargo = true;
    if (!formData.setor.trim()) newErrors.setor = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("❌ Preencha todos os campos obrigatórios!");
      return;
    }

    try {
      if (editingPessoa) {
        await updatePessoa.mutateAsync({
          id: editingPessoa.id,
          ...formData,
        });
        toast.success("Pessoa atualizada com sucesso!");
      } else {
        await createPessoa.mutateAsync({
          ...formData,
          ativo: true,
        });
        toast.success("Pessoa cadastrada com sucesso!");
      }
      await refetch();
      closeModal();
    } catch (error) {
      toast.error("Erro ao salvar pessoa");
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Deseja realmente excluir ${nome}?`)) return;

    try {
      await deletePessoa.mutateAsync({ id });
      await refetch();
      toast.success("Pessoa excluída!");
    } catch (error) {
      toast.error("Erro ao excluir pessoa");
    }
  };

  const handleToggleAtivo = async (id: number, currentStatus: boolean) => {
    try {
      await updatePessoa.mutateAsync({ id, ativo: !currentStatus });
      await refetch();
      toast.success(!currentStatus ? "Pessoa ativada!" : "Pessoa inativada!");
    } catch (error) {
      toast.error("Erro ao alterar status");
    }
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
            <Users className="h-8 w-8" />
            Pessoas
          </h2>
          <Button
            onClick={() => openModal()}
            className="bg-[#F5B800] hover:bg-[#F5B800]/90 text-[#005CA9] font-semibold px-6 py-6 text-lg rounded-xl"
          >
            + Nova Pessoa
          </Button>
        </div>

        {!pessoas || pessoas.length === 0 ? (
          <div className="border-4 border-[#005CA9] rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Users className="h-20 w-20 text-[#005CA9]/30" />
              <p className="text-xl text-gray-500 font-medium">
                Nenhuma pessoa cadastrada
              </p>
              <p className="text-gray-400">Clique em "Nova Pessoa" para começar</p>
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
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm">Email</th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm">Telefone</th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm">Cargo</th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm">Setor</th>
                    <th className="px-4 py-4 text-center font-bold uppercase text-sm">Status</th>
                    <th className="px-4 py-4 text-center font-bold uppercase text-sm">Ativo</th>
                    <th className="px-4 py-4 text-center font-bold uppercase text-sm bg-[#F5B800] text-[#005CA9]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {pessoas.map((pessoa, index) => (
                    <tr
                      key={pessoa.id}
                      className={`border-b-2 border-[#005CA9]/10 hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } ${!pessoa.ativo ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3 text-sm">{pessoa.codigo}</td>
                      <td className="px-4 py-3 text-sm font-medium">{pessoa.nome}</td>
                      <td className="px-4 py-3 text-sm">{pessoa.email}</td>
                      <td className="px-4 py-3 text-sm">{pessoa.telefone || "-"}</td>
                      <td className="px-4 py-3 text-sm">{pessoa.cargo}</td>
                      <td className="px-4 py-3 text-sm">{pessoa.setor}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            pessoa.ativo
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {pessoa.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={pessoa.ativo}
                          onChange={() => handleToggleAtivo(pessoa.id, pessoa.ativo)}
                          className="h-5 w-5 accent-[#005CA9] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal(pessoa)}
                            className="hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4 text-[#005CA9]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pessoa.id, pessoa.nome)}
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#005CA9]">
              {editingPessoa ? "Editar Pessoa" : "Nova Pessoa"}
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
                disabled
              />
            </div>

            <div>
              <Label htmlFor="telefone" className="text-sm font-semibold">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                className="mt-1"
                placeholder="(00) 00000-0000"
              />
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
                placeholder="Nome completo"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`mt-1 ${errors.email ? "border-red-500 border-2" : ""}`}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="cargo" className="text-sm font-semibold">
                Cargo *
              </Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => handleChange("cargo", e.target.value)}
                className={`mt-1 ${errors.cargo ? "border-red-500 border-2" : ""}`}
                placeholder="Ex: Gerente"
              />
            </div>

            <div>
              <Label htmlFor="setor" className="text-sm font-semibold">
                Setor *
              </Label>
              <Input
                id="setor"
                value={formData.setor}
                onChange={(e) => handleChange("setor", e.target.value)}
                className={`mt-1 ${errors.setor ? "border-red-500 border-2" : ""}`}
                placeholder="Ex: Desenvolvimento"
              />
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

