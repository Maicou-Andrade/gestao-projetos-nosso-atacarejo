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
import { Zap, Trash2, Edit, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Atividades() {
  const { data: atividades, isLoading, refetch } = trpc.atividades.list.useQuery();
  const { data: projetos } = trpc.projetos.list.useQuery();
  const { data: pessoas } = trpc.pessoas.list.useQuery();
  const createAtividade = trpc.atividades.create.useMutation();
  const updateAtividade = trpc.atividades.update.useMutation();
  const deleteAtividade = trpc.atividades.delete.useMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAtividade, setEditingAtividade] = useState<any>(null);
  const [formData, setFormData] = useState({
    projetoId: 0,
    tarefa: "",
    responsaveisTarefa: [] as number[],
    diasPrevistos: 0,
    dataInicio: "",
    horasUtilizadas: 0,
    progresso: 0,
    observacoes: "",
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const openModal = (atividade?: any) => {
    if (atividade) {
      setEditingAtividade(atividade);
      const responsaveisIds = atividade.responsaveisTarefa
        ? atividade.responsaveisTarefa
            .split(",")
            .map((id: string) => parseInt(id.trim()))
            .filter((id: number) => !isNaN(id))
        : [];

      setFormData({
        projetoId: atividade.projetoId || 0,
        tarefa: atividade.tarefa || "",
        responsaveisTarefa: responsaveisIds,
        diasPrevistos: atividade.diasPrevistos || 0,
        dataInicio: atividade.dataInicio
          ? new Date(atividade.dataInicio).toISOString().split("T")[0]
          : "",
        horasUtilizadas: atividade.horasUtilizadas || 0,
        progresso: atividade.progresso || 0,
        observacoes: atividade.observacoes || "",
      });
    } else {
      setEditingAtividade(null);
      setFormData({
        projetoId: 0,
        tarefa: "",
        responsaveisTarefa: [],
        diasPrevistos: 0,
        dataInicio: "",
        horasUtilizadas: 0,
        progresso: 0,
        observacoes: "",
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAtividade(null);
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
      const updated = prev.responsaveisTarefa.includes(pessoaId)
        ? prev.responsaveisTarefa.filter((id) => id !== pessoaId)
        : [...prev.responsaveisTarefa, pessoaId];
      return { ...prev, responsaveisTarefa: updated };
    });
    if (errors.responsaveisTarefa) {
      setErrors((prev) => ({ ...prev, responsaveisTarefa: false }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};

    if (!formData.projetoId) newErrors.projetoId = true;
    if (!formData.tarefa.trim()) newErrors.tarefa = true;
    if (formData.responsaveisTarefa.length === 0) newErrors.responsaveisTarefa = true;

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
        codigo: editingAtividade?.codigo || `ATV${Date.now()}`,
        responsaveisTarefa: formData.responsaveisTarefa.join(","),
        quantidadeHoras: formData.diasPrevistos * 7,
      };

      if (editingAtividade) {
        await updateAtividade.mutateAsync({
          id: editingAtividade.id,
          ...data,
        });
        toast.success("Atividade atualizada com sucesso!");
      } else {
        await createAtividade.mutateAsync(data);
        toast.success("Atividade cadastrada com sucesso!");
      }
      await refetch();
      closeModal();
    } catch (error) {
      toast.error("Erro ao salvar atividade");
    }
  };

  const handleDelete = async (id: number, tarefa: string) => {
    if (!confirm(`Deseja realmente excluir a atividade "${tarefa}"?`)) return;

    try {
      await deleteAtividade.mutateAsync({ id });
      await refetch();
      toast.success("Atividade excluída!");
    } catch (error) {
      toast.error("Erro ao excluir atividade");
    }
  };

  const calcularPrevisaoEntrega = (dataInicio: string, diasPrevistos: number) => {
    if (!dataInicio || !diasPrevistos) return "-";
    const data = new Date(dataInicio);
    data.setDate(data.getDate() + diasPrevistos);
    return data.toLocaleDateString("pt-BR");
  };

  const calcularStatusPrazo = (dataInicio: string, diasPrevistos: number, status: string) => {
    if (!dataInicio || !diasPrevistos) return "Não Iniciado";
    if (status === "Concluído" || status === "Finalizado") return "Dentro do Prazo";
    
    const previsaoEntrega = new Date(dataInicio);
    previsaoEntrega.setDate(previsaoEntrega.getDate() + diasPrevistos);
    const hoje = new Date();
    
    return hoje > previsaoEntrega ? "Fora do Prazo" : "Dentro do Prazo";
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12">Carregando...</div>
      </MainLayout>
    );
  }

  const pessoasAtivas = pessoas?.filter((p) => p.ativo) || [];
  const projetosDisponiveis = projetos || [];

  if (projetosDisponiveis.length === 0) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-[#005CA9] flex items-center gap-3">
              <Zap className="h-8 w-8" />
              Atividades
            </h2>
          </div>

          <div className="border-4 border-[#005CA9] rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Zap className="h-20 w-20 text-[#005CA9]/30" />
              <p className="text-xl text-gray-500 font-medium">
                Nenhum projeto cadastrado
              </p>
              <p className="text-gray-400">
                Cadastre um projeto primeiro para poder criar atividades
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-[#005CA9] flex items-center gap-3">
            <Zap className="h-8 w-8" />
            Atividades
          </h2>
          <Button
            onClick={() => openModal()}
            className="bg-[#F5B800] hover:bg-[#F5B800]/90 text-[#005CA9] font-semibold px-6 py-6 text-lg rounded-xl"
          >
            + Nova Atividade
          </Button>
        </div>

        {!atividades || atividades.length === 0 ? (
          <div className="border-4 border-[#005CA9] rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Zap className="h-20 w-20 text-[#005CA9]/30" />
              <p className="text-xl text-gray-500 font-medium">
                Nenhuma atividade cadastrada
              </p>
              <p className="text-gray-400">Clique em "Nova Atividade" para começar</p>
            </div>
          </div>
        ) : (
          <div className="border-4 border-[#005CA9] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#005CA9] text-white">
                  <tr>
                    <th className="px-2 py-3 text-left font-bold uppercase text-xs whitespace-nowrap">Cód. Projeto</th>
                    <th className="px-2 py-3 text-left font-bold uppercase text-xs whitespace-nowrap">Projeto</th>
                    <th className="px-2 py-3 text-left font-bold uppercase text-xs whitespace-nowrap">Resp. Projeto</th>
                    <th className="px-2 py-3 text-left font-bold uppercase text-xs whitespace-nowrap">Início Plan.</th>
                    <th className="px-2 py-3 text-left font-bold uppercase text-xs whitespace-nowrap">Fim Plan.</th>
                    <th className="px-2 py-3 text-left font-bold uppercase text-xs whitespace-nowrap">Tarefa</th>
                    <th className="px-2 py-3 text-left font-bold uppercase text-xs whitespace-nowrap">Resp. Tarefa</th>
                    <th className="px-2 py-3 text-center font-bold uppercase text-xs whitespace-nowrap">Dias Prev.</th>
                    <th className="px-2 py-3 text-left font-bold uppercase text-xs whitespace-nowrap">Data Início</th>
                    <th className="px-2 py-3 text-left font-bold uppercase text-xs whitespace-nowrap">Prev. Entrega</th>
                    <th className="px-2 py-3 text-center font-bold uppercase text-xs whitespace-nowrap">Status</th>
                    <th className="px-2 py-3 text-center font-bold uppercase text-xs whitespace-nowrap">Status Prazo</th>
                    <th className="px-2 py-3 text-center font-bold uppercase text-xs whitespace-nowrap">Progresso %</th>
                    <th className="px-2 py-3 text-center font-bold uppercase text-xs whitespace-nowrap">QTD Horas</th>
                    <th className="px-2 py-3 text-center font-bold uppercase text-xs whitespace-nowrap">Horas Usadas</th>
                    <th className="px-2 py-3 text-center font-bold uppercase text-xs whitespace-nowrap">Dif. Horas</th>
                    <th className="px-2 py-3 text-left font-bold uppercase text-xs whitespace-nowrap">Observações</th>
                    <th className="px-2 py-3 text-center font-bold uppercase text-xs bg-[#F5B800] text-[#005CA9] whitespace-nowrap">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {atividades.map((atividade, index) => {
                    const projeto = projetosDisponiveis.find((p: any) => p.id === atividade.projetoId);
                    const responsaveisIds = atividade.responsaveisTarefa
                      ? atividade.responsaveisTarefa.split(",").map((id: string) => parseInt(id.trim()))
                      : [];
                    const responsaveisNomes = responsaveisIds
                      .map((id: number) => pessoasAtivas.find((p) => p.id === id)?.nome)
                      .filter(Boolean)
                      .join(", ");

                    const qtdHoras = (atividade.diasPrevistos || 0) * 7;
                    const difHoras = qtdHoras - (atividade.horasUtilizadas || 0);
                    const statusPrazo = calcularStatusPrazo(
                      atividade.dataInicio as any,
                      atividade.diasPrevistos || 0,
                      atividade.status || ""
                    );

                    const responsaveisProjeto = projeto?.responsaveis
                      ? projeto.responsaveis
                          .split(",")
                          .map((id: string) => pessoasAtivas.find((p) => p.id === parseInt(id.trim()))?.nome)
                          .filter(Boolean)
                          .join(", ")
                      : "-";

                    return (
                      <tr
                        key={atividade.id}
                        className={`border-b-2 border-[#005CA9]/10 hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-2 py-2 text-xs">{projeto?.codigo || "-"}</td>
                        <td className="px-2 py-2 text-xs font-medium max-w-[150px] truncate">{projeto?.nome || "-"}</td>
                        <td className="px-2 py-2 text-xs max-w-[120px] truncate">{responsaveisProjeto}</td>
                        <td className="px-2 py-2 text-xs whitespace-nowrap">
                          {projeto?.inicioPlanejado
                            ? new Date(projeto.inicioPlanejado as any).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>
                        <td className="px-2 py-2 text-xs whitespace-nowrap">
                          {projeto?.fimPlanejado
                            ? new Date(projeto.fimPlanejado as any).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>
                        <td className="px-2 py-2 text-xs max-w-[200px] truncate" title={atividade.tarefa}>{atividade.tarefa}</td>
                        <td className="px-2 py-2 text-xs max-w-[120px] truncate">{responsaveisNomes || "-"}</td>
                        <td className="px-2 py-2 text-center text-xs">{atividade.diasPrevistos || "-"}</td>
                        <td className="px-2 py-2 text-xs whitespace-nowrap">
                          {atividade.dataInicio
                            ? new Date(atividade.dataInicio).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>
                        <td className="px-2 py-2 text-xs whitespace-nowrap">
                          {calcularPrevisaoEntrega(atividade.dataInicio as any, atividade.diasPrevistos || 0)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                            {atividade.status || "Não Iniciado"}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              statusPrazo === "Fora do Prazo"
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {statusPrazo}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center text-xs">{atividade.progresso || 0}%</td>
                        <td className="px-2 py-2 text-center text-xs whitespace-nowrap">{qtdHoras}h</td>
                        <td className="px-2 py-2 text-center text-xs whitespace-nowrap">{atividade.horasUtilizadas || 0}h</td>
                        <td className="px-2 py-2 text-center">
                          <span
                            className={`font-semibold text-xs whitespace-nowrap ${
                              difHoras >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {difHoras >= 0 ? "+" : ""}
                            {difHoras}h
                          </span>
                        </td>
                        <td className="px-2 py-2 text-xs max-w-[150px] truncate" title={atividade.observacoes || ""}>
                          {atividade.observacoes || "-"}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModal(atividade)}
                              className="hover:bg-blue-50 p-1 h-auto"
                            >
                              <Edit className="h-4 w-4 text-[#005CA9]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(atividade.id, atividade.tarefa)}
                              className="hover:bg-red-50 p-1 h-auto"
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
              {editingAtividade ? "Editar Atividade" : "Nova Atividade"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="projetoId" className="text-sm font-semibold">
                Projeto *
              </Label>
              <Select
                value={formData.projetoId.toString()}
                onValueChange={(value) => handleChange("projetoId", parseInt(value))}
              >
                <SelectTrigger className={`mt-1 ${errors.projetoId ? "border-red-500 border-2" : ""}`}>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projetosDisponiveis.map((projeto: any) => (
                    <SelectItem key={projeto.id} value={projeto.id.toString()}>
                      {projeto.codigo} - {projeto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="tarefa" className="text-sm font-semibold">
                Tarefa *
              </Label>
              <Textarea
                id="tarefa"
                value={formData.tarefa}
                onChange={(e) => handleChange("tarefa", e.target.value)}
                className={`mt-1 ${errors.tarefa ? "border-red-500 border-2" : ""}`}
                placeholder="Descreva a tarefa"
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label className="text-sm font-semibold">Responsáveis da Tarefa *</Label>
              <div
                className={`mt-2 border-2 rounded-md p-3 max-h-40 overflow-y-auto ${
                  errors.responsaveisTarefa ? "border-red-500" : "border-gray-200"
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
                          checked={formData.responsaveisTarefa.includes(pessoa.id)}
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
              <Label htmlFor="diasPrevistos" className="text-sm font-semibold">
                Dias Previstos
              </Label>
              <Input
                id="diasPrevistos"
                type="number"
                value={formData.diasPrevistos}
                onChange={(e) => handleChange("diasPrevistos", parseInt(e.target.value) || 0)}
                className="mt-1"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="dataInicio" className="text-sm font-semibold">
                Data Início
              </Label>
              <Input
                id="dataInicio"
                type="date"
                value={formData.dataInicio}
                onChange={(e) => handleChange("dataInicio", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="horasUtilizadas" className="text-sm font-semibold">
                Horas Utilizadas
              </Label>
              <Input
                id="horasUtilizadas"
                type="number"
                value={formData.horasUtilizadas}
                onChange={(e) => handleChange("horasUtilizadas", parseInt(e.target.value) || 0)}
                className="mt-1"
                min="0"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">QTD Horas (Calculado)</Label>
              <Input
                value={`${formData.diasPrevistos * 7}h`}
                disabled
                className="mt-1 bg-gray-100"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="observacoes" className="text-sm font-semibold">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                className="mt-1"
                placeholder="Informações adicionais"
                rows={3}
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

