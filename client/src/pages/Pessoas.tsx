import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Users, Trash2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Pessoas() {
  const { data: pessoas, isLoading, refetch } = trpc.pessoas.list.useQuery();
  const createPessoa = trpc.pessoas.create.useMutation();
  const updatePessoa = trpc.pessoas.update.useMutation();
  const deletePessoa = trpc.pessoas.delete.useMutation();

  const [editedPessoas, setEditedPessoas] = useState<Record<number, any>>({});

  const handleAdd = async () => {
    try {
      await createPessoa.mutateAsync({
        codigo: `P${Date.now()}`,
        nome: "",
        email: "",
        telefone: "",
        cargo: "",
        departamento: "",
        setor: "",
        ativo: true,
      });
      await refetch();
      toast.success("Pessoa adicionada!");
    } catch (error) {
      toast.error("Erro ao adicionar pessoa");
    }
  };

  const handleChange = (id: number, field: string, value: any) => {
    setEditedPessoas((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    try {
      const updates = Object.entries(editedPessoas);
      if (updates.length === 0) {
        toast.info("Nenhuma alteração para salvar");
        return;
      }

      for (const [idStr, data] of updates) {
        const id = parseInt(idStr);
        await updatePessoa.mutateAsync({ id, ...data });
      }

      setEditedPessoas({});
      await refetch();
      toast.success("✓ Alterações Salvas!", { duration: 2000 });
    } catch (error) {
      toast.error("Erro ao salvar alterações");
    }
  };

  const handleToggleAtivo = async (id: number, currentStatus: boolean) => {
    try {
      await updatePessoa.mutateAsync({ id, ativo: !currentStatus });
      await refetch();
      toast.success(
        !currentStatus ? "Pessoa ativada!" : "Pessoa inativada!"
      );
    } catch (error) {
      toast.error("Erro ao alterar status");
    }
  };

  const getValue = (pessoa: any, field: string) => {
    return editedPessoas[pessoa.id]?.[field] ?? pessoa[field] ?? "";
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
          <div className="flex gap-3">
            <Button
              onClick={handleAdd}
              className="bg-[#F5B800] hover:bg-[#F5B800]/90 text-[#005CA9] font-semibold px-6 py-6 text-lg rounded-xl"
            >
              + Nova Pessoa
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

        {!pessoas || pessoas.length === 0 ? (
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#005CA9] text-white">
                  <tr>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[120px]">
                      Código
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[250px]">
                      Nome
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[250px]">
                      Email
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[180px]">
                      Telefone
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[200px]">
                      Cargo
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[200px]">
                      Departamento
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[180px]">
                      Setor
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[120px]">
                      Status
                    </th>
                    <th className="px-4 py-4 text-center font-bold uppercase text-sm whitespace-nowrap min-w-[100px]">
                      Ativo
                    </th>
                    <th className="px-4 py-4 text-left font-bold uppercase text-sm whitespace-nowrap min-w-[300px]">
                      Observações
                    </th>
                    <th className="px-4 py-4 text-center font-bold uppercase text-sm whitespace-nowrap bg-[#F5B800] text-[#005CA9] min-w-[100px]">
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
                      <td className="px-4 py-3">
                        <Input
                          value={getValue(pessoa, "codigo")}
                          onChange={(e) =>
                            handleChange(pessoa.id, "codigo", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          disabled={!pessoa.ativo}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={getValue(pessoa, "nome")}
                          onChange={(e) =>
                            handleChange(pessoa.id, "nome", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          disabled={!pessoa.ativo}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="email"
                          value={getValue(pessoa, "email")}
                          onChange={(e) =>
                            handleChange(pessoa.id, "email", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          disabled={!pessoa.ativo}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={getValue(pessoa, "telefone")}
                          onChange={(e) =>
                            handleChange(pessoa.id, "telefone", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          disabled={!pessoa.ativo}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={getValue(pessoa, "cargo")}
                          onChange={(e) =>
                            handleChange(pessoa.id, "cargo", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          disabled={!pessoa.ativo}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={getValue(pessoa, "departamento")}
                          onChange={(e) =>
                            handleChange(pessoa.id, "departamento", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          disabled={!pessoa.ativo}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={getValue(pessoa, "setor")}
                          onChange={(e) =>
                            handleChange(pessoa.id, "setor", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          disabled={!pessoa.ativo}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              pessoa.ativo
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {pessoa.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={pessoa.ativo}
                          onChange={() =>
                            handleToggleAtivo(pessoa.id, pessoa.ativo)
                          }
                          className="h-6 w-6 accent-[#005CA9] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={getValue(pessoa, "observacoes")}
                          onChange={(e) =>
                            handleChange(pessoa.id, "observacoes", e.target.value)
                          }
                          className="border-2 border-[#005CA9]/20 focus:border-[#005CA9]"
                          disabled={!pessoa.ativo}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleAtivo(pessoa.id, pessoa.ativo)
                          }
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

