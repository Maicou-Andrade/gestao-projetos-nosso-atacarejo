import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Pessoas() {
  const { data: pessoas, isLoading, refetch } = trpc.pessoas.list.useQuery();
  const createPessoa = trpc.pessoas.create.useMutation();
  const updatePessoa = trpc.pessoas.update.useMutation();
  const deletePessoa = trpc.pessoas.delete.useMutation();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});

  const handleAdd = async () => {
    try {
      await createPessoa.mutateAsync({
        codigo: `P${Date.now()}`,
        nome: "",
        setor: "",
        ativo: true,
      });
      await refetch();
      toast.success("Pessoa adicionada com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar pessoa");
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      await updatePessoa.mutateAsync({ id, ...data });
      await refetch();
      toast.success("Pessoa atualizada!");
    } catch (error) {
      toast.error("Erro ao atualizar pessoa");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente excluir esta pessoa?")) return;
    try {
      await deletePessoa.mutateAsync({ id });
      await refetch();
      toast.success("Pessoa excluída!");
    } catch (error) {
      toast.error("Erro ao excluir pessoa");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">👥 Pessoas</h1>
          <p>Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">👥 Pessoas</h1>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Pessoa
          </Button>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Código</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Telefone</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Cargo</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Departamento</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Setor</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Ativo</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Observações</th>
                <th className="px-4 py-3 text-left text-sm font-medium w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pessoas?.map((pessoa) => (
                <tr key={pessoa.id} className="border-t hover:bg-muted/50">
                  <td className="px-4 py-2">
                    <Input
                      value={pessoa.codigo}
                      onChange={(e) =>
                        handleUpdate(pessoa.id, { codigo: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={pessoa.nome || ""}
                      onChange={(e) =>
                        handleUpdate(pessoa.id, { nome: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={pessoa.email || ""}
                      onChange={(e) =>
                        handleUpdate(pessoa.id, { email: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={pessoa.telefone || ""}
                      onChange={(e) =>
                        handleUpdate(pessoa.id, { telefone: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={pessoa.cargo || ""}
                      onChange={(e) =>
                        handleUpdate(pessoa.id, { cargo: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={pessoa.departamento || ""}
                      onChange={(e) =>
                        handleUpdate(pessoa.id, { departamento: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={pessoa.setor || ""}
                      onChange={(e) =>
                        handleUpdate(pessoa.id, { setor: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={pessoa.status || ""}
                      onChange={(e) =>
                        handleUpdate(pessoa.id, { status: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={pessoa.ativo}
                      onChange={(e) =>
                        handleUpdate(pessoa.id, { ativo: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={pessoa.observacoes || ""}
                      onChange={(e) =>
                        handleUpdate(pessoa.id, { observacoes: e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(pessoa.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

