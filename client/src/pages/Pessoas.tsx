import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Users, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";

export default function Pessoas() {
  const { data: pessoas, isLoading, refetch } = trpc.pessoas.list.useQuery();
  const createPessoa = trpc.pessoas.create.useMutation();
  const updatePessoa = trpc.pessoas.update.useMutation();
  const deletePessoa = trpc.pessoas.delete.useMutation();

  const handleAdd = async () => {
    try {
      await createPessoa.mutateAsync({
        codigo: `P${Date.now()}`,
        nome: "",
        setor: "",
        email: "",
        telefone: "",
        cargo: "",
        departamento: "",
        ativo: true,
      });
      await refetch();
      toast.success("Pessoa adicionada!");
    } catch (error) {
      toast.error("Erro ao adicionar pessoa");
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      await updatePessoa.mutateAsync({ id, ...data });
      await refetch();
    } catch (error) {
      toast.error("Erro ao atualizar pessoa");
    }
  };

  const handleInactivate = async (id: number, nome: string) => {
    if (!confirm(`Tem certeza que deseja inativar ${nome}?`)) return;
    try {
      await updatePessoa.mutateAsync({ id, ativo: false });
      await refetch();
      toast.success("Pessoa inativada!");
    } catch (error) {
      toast.error("Erro ao inativar pessoa");
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
            <Users className="h-8 w-8" />
            Pessoas
          </h2>
          <Button
            onClick={handleAdd}
            className="bg-[#F5B800] hover:bg-[#F5B800]/90 text-[#005CA9] font-semibold px-6 py-6 text-lg rounded-xl"
          >
            + Nova Pessoa
          </Button>
        </div>

        {pessoasAtivas.length === 0 ? (
          <div className="border-4 border-[#005CA9] rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Users className="h-20 w-20 text-[#005CA9]/30" />
              <p className="text-xl text-gray-500 font-medium">
                Nenhuma pessoa cadastrada
              </p>
              <p className="text-gray-400">
                Clique em "Nova Pessoa" para começar
              </p>
            </div>
          </div>
        ) : (
          <div className="border-4 border-[#005CA9] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#005CA9] text-white">
                <tr>
                  <th className="px-4 py-4 text-left font-bold uppercase text-sm">Código</th>
                  <th className="px-4 py-4 text-left font-bold uppercase text-sm">Nome</th>
                  <th className="px-4 py-4 text-left font-bold uppercase text-sm">Email</th>
                  <th className="px-4 py-4 text-left font-bold uppercase text-sm">Telefone</th>
                  <th className="px-4 py-4 text-left font-bold uppercase text-sm">Cargo</th>
                  <th className="px-4 py-4 text-left font-bold uppercase text-sm">Departamento</th>
                  <th className="px-4 py-4 text-left font-bold uppercase text-sm">Setor</th>
                  <th className="px-4 py-4 text-left font-bold uppercase text-sm">Status</th>
                  <th className="px-4 py-4 text-left font-bold uppercase text-sm">Ativo</th>
                  <th className="px-4 py-4 text-left font-bold uppercase text-sm">Observações</th>
                  <th className="px-4 py-4 text-left font-bold uppercase text-sm bg-[#F5B800] text-[#005CA9]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {pessoasAtivas.map((pessoa, index) => (
                  <tr
                    key={pessoa.id}
                    className={`border-b-2 border-[#005CA9]/10 hover:bg-blue-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Input
                        value={pessoa.codigo || ""}
                        onChange={(e) =>
                          handleUpdate(pessoa.id, { codigo: e.target.value })
                        }
                        className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={pessoa.nome || ""}
                        onChange={(e) =>
                          handleUpdate(pessoa.id, { nome: e.target.value })
                        }
                        className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={pessoa.email || ""}
                        onChange={(e) =>
                          handleUpdate(pessoa.id, { email: e.target.value })
                        }
                        className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={pessoa.telefone || ""}
                        onChange={(e) =>
                          handleUpdate(pessoa.id, { telefone: e.target.value })
                        }
                        className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={pessoa.cargo || ""}
                        onChange={(e) =>
                          handleUpdate(pessoa.id, { cargo: e.target.value })
                        }
                        className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={pessoa.departamento || ""}
                        onChange={(e) =>
                          handleUpdate(pessoa.id, { departamento: e.target.value })
                        }
                        className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={pessoa.setor || ""}
                        onChange={(e) =>
                          handleUpdate(pessoa.id, { setor: e.target.value })
                        }
                        className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={pessoa.status || ""}
                        onChange={(e) =>
                          handleUpdate(pessoa.id, { status: e.target.value })
                        }
                        className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={pessoa.ativo}
                        onChange={(e) =>
                          handleUpdate(pessoa.id, { ativo: e.target.checked })
                        }
                        className="h-5 w-5 accent-[#005CA9]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={pessoa.observacoes || ""}
                        onChange={(e) =>
                          handleUpdate(pessoa.id, { observacoes: e.target.value })
                        }
                        className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInactivate(pessoa.id, pessoa.nome || "esta pessoa")}
                        className="hover:bg-red-50"
                      >
                        <UserX className="h-5 w-5 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end">
          <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-6 text-lg rounded-xl">
            💾 Salvar
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

