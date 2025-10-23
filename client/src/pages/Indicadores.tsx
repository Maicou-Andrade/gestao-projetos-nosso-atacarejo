import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import {
  FolderKanban,
  Zap,
  CheckCircle2,
  Clock,
  XCircle,
  Circle,
  BarChart3,
  AlertCircle,
} from "lucide-react";

export default function Indicadores() {
  const { data: projetos } = trpc.projetos.list.useQuery();
  const { data: atividades } = trpc.atividades.list.useQuery();
  const { data: subtarefas } = trpc.subtarefas.list.useQuery();

  const totalProjetos = projetos?.length || 0;
  const totalTarefas = (atividades?.length || 0) + (subtarefas?.length || 0);

  const tarefasConcluidas =
    (atividades?.filter((a) => (a.progresso ?? 0) === 100).length || 0) +
    (subtarefas?.filter((s) => (s.progresso ?? 0) === 100).length || 0);

  const tarefasEmAndamento =
    (atividades?.filter((a) => (a.progresso ?? 0) > 0 && (a.progresso ?? 0) < 100).length || 0) +
    (subtarefas?.filter((s) => (s.progresso ?? 0) > 0 && (s.progresso ?? 0) < 100).length || 0);

  const tarefasCanceladas =
    (atividades?.filter((a) => (a.progresso ?? 0) === -1).length || 0) +
    (subtarefas?.filter((s) => (s.progresso ?? 0) === -1).length || 0);

  const tarefasNaoIniciadas =
    (atividades?.filter((a) => (a.progresso ?? 0) === 0).length || 0) +
    (subtarefas?.filter((s) => (s.progresso ?? 0) === 0).length || 0);

  const calcularAtrasadas = () => {
    const hoje = new Date();
    let atrasadas = 0;

    atividades?.forEach((a) => {
      if (a.dataInicio && a.diasPrevistos) {
        const previsao = new Date(a.dataInicio);
        previsao.setDate(previsao.getDate() + a.diasPrevistos);
        if (previsao < hoje && (a.progresso ?? 0) < 100) atrasadas++;
      }
    });

    subtarefas?.forEach((s) => {
      if (s.dataInicio && s.diasPrevistos) {
        const previsao = new Date(s.dataInicio);
        previsao.setDate(previsao.getDate() + s.diasPrevistos);
        if (previsao < hoje && (s.progresso ?? 0) < 100) atrasadas++;
      }
    });

    return atrasadas;
  };

  const tarefasAtrasadas = calcularAtrasadas();

  const cards = [
    {
      title: "TOTAL PROJETOS",
      value: totalProjetos,
      icon: FolderKanban,
      color: "border-blue-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "TOTAL TAREFAS",
      value: totalTarefas,
      icon: Zap,
      color: "border-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-700",
    },
    {
      title: "TAREFAS CONCLUÍDAS",
      value: tarefasConcluidas,
      icon: CheckCircle2,
      color: "border-green-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "TAREFAS EM ANDAMENTO",
      value: tarefasEmAndamento,
      icon: Clock,
      color: "border-orange-500",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "TAREFAS CANCELADAS",
      value: tarefasCanceladas,
      icon: XCircle,
      color: "border-red-500",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "TAREFAS NÃO INICIADAS",
      value: tarefasNaoIniciadas,
      icon: Circle,
      color: "border-gray-500",
      bgColor: "bg-gray-50",
      iconColor: "text-gray-600",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-[#005CA9] flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          Indicadores de Performance
        </h2>

        {/* STATUS Cards */}
        <div>
          <h3 className="text-xl font-bold text-[#005CA9] mb-4 flex items-center gap-2">
            📊 STATUS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`border-4 ${card.color} rounded-2xl p-6 ${card.bgColor} transition-transform hover:scale-105`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`${card.iconColor} mb-2`}>
                        <Icon className="h-10 w-10" />
                      </div>
                      <div className={`text-5xl font-bold ${card.iconColor}`}>
                        {card.value}
                      </div>
                      <div className="text-sm font-semibold text-gray-600 mt-2 uppercase">
                        {card.title}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STATUS PRAZO */}
        <div>
          <h3 className="text-xl font-bold text-[#005CA9] mb-4 flex items-center gap-2">
            ⏰ STATUS PRAZO
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-4 border-green-500 rounded-2xl p-6 bg-green-50">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <div>
                  <div className="text-5xl font-bold text-green-600">
                    {totalTarefas - tarefasAtrasadas}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 uppercase">
                    TAREFAS DENTRO DO PRAZO
                  </div>
                </div>
              </div>
            </div>
            <div className="border-4 border-red-500 rounded-2xl p-6 bg-red-50">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
                <div>
                  <div className="text-5xl font-bold text-red-600">
                    {tarefasAtrasadas}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 uppercase">
                    TAREFAS ATRASADAS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

