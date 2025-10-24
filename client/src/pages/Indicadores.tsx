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
  Users,
  Building2,
  AlertTriangle,
  Timer,
} from "lucide-react";

export default function Indicadores() {
  const { data: projetos } = trpc.projetos.list.useQuery();
  const { data: atividades } = trpc.atividades.list.useQuery();
  const { data: subtarefas } = trpc.subtarefas.list.useQuery();
  const { data: pessoas } = trpc.pessoas.list.useQuery();

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

  // Calcular horas totais
  const totalHorasProjetadas = (atividades?.reduce((sum, a) => sum + (a.quantidadeHoras || 0), 0) || 0) +
    (subtarefas?.reduce((sum, s) => sum + (s.quantidadeHoras || 0), 0) || 0);

  const totalHorasUsadas = (atividades?.reduce((sum, a) => sum + (a.horasUtilizadas || 0), 0) || 0) +
    (subtarefas?.reduce((sum, s) => sum + (s.horasUtilizadas || 0), 0) || 0);

  // Projetos por Responsável
  const projetosPorResponsavel = () => {
    const map = new Map<string, number>();
    projetos?.forEach((p) => {
      if (p.responsaveis) {
        const ids = p.responsaveis.split(',');
        ids.forEach((id) => {
          const pessoa = pessoas?.find((ps) => ps.id === parseInt(id.trim()));
          if (pessoa) {
            const nome = pessoa.nome;
            map.set(nome, (map.get(nome) || 0) + 1);
          }
        });
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };

  // Projetos por Setor
  const projetosPorSetor = () => {
    const map = new Map<string, number>();
    projetos?.forEach((p) => {
      if (p.responsaveis) {
        const ids = p.responsaveis.split(',');
        ids.forEach((id) => {
          const pessoa = pessoas?.find((ps) => ps.id === parseInt(id.trim()));
          if (pessoa && pessoa.setor) {
            const setor = pessoa.setor;
            map.set(setor, (map.get(setor) || 0) + 1);
          }
        });
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };

  // Projetos por Prioridade
  const projetosPorPrioridade = () => {
    const map = new Map<string, number>();
    projetos?.forEach((p) => {
      const prioridade = p.prioridade || 'Não definida';
      map.set(prioridade, (map.get(prioridade) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => {
      const ordem = { 'Crítica': 1, 'Alta': 2, 'Média': 3, 'Baixa': 4, 'Não definida': 5 };
      return (ordem[a[0] as keyof typeof ordem] || 99) - (ordem[b[0] as keyof typeof ordem] || 99);
    });
  };

  // Atividades por Responsável
  const atividadesPorResponsavel = () => {
    const map = new Map<string, number>();
    atividades?.forEach((a) => {
      if (a.responsaveisTarefa) {
        const ids = a.responsaveisTarefa.split(',');
        ids.forEach((id) => {
          const pessoa = pessoas?.find((ps) => ps.id === parseInt(id.trim()));
          if (pessoa) {
            const nome = pessoa.nome;
            map.set(nome, (map.get(nome) || 0) + 1);
          }
        });
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };

  // Atividades por Setor
  const atividadesPorSetor = () => {
    const map = new Map<string, number>();
    atividades?.forEach((a) => {
      if (a.responsaveisTarefa) {
        const ids = a.responsaveisTarefa.split(',');
        ids.forEach((id) => {
          const pessoa = pessoas?.find((ps) => ps.id === parseInt(id.trim()));
          if (pessoa && pessoa.setor) {
            const setor = pessoa.setor;
            map.set(setor, (map.get(setor) || 0) + 1);
          }
        });
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };

  // Atividades por Status
  const atividadesPorStatus = () => {
    return [
      { status: 'Concluídas', count: tarefasConcluidas, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-500' },
      { status: 'Em Andamento', count: tarefasEmAndamento, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-500' },
      { status: 'Não Iniciadas', count: tarefasNaoIniciadas, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-500' },
      { status: 'Canceladas', count: tarefasCanceladas, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-500' },
    ];
  };

  const corPrioridade = (prioridade: string) => {
    const cores = {
      'Crítica': { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-600' },
      'Alta': { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-600' },
      'Média': { text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-600' },
      'Baixa': { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-600' },
      'Não definida': { text: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-600' },
    };
    return cores[prioridade as keyof typeof cores] || cores['Não definida'];
  };

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

        {/* HORAS Cards */}
        <div>
          <h3 className="text-xl font-bold text-[#005CA9] mb-4 flex items-center gap-2">
            ⏱️ HORAS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-4 border-purple-500 rounded-2xl p-6 bg-purple-50">
              <div className="flex items-center gap-4">
                <Timer className="h-12 w-12 text-purple-600" />
                <div>
                  <div className="text-5xl font-bold text-purple-600">
                    {totalHorasProjetadas.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 uppercase">
                    HORAS PROJETADAS
                  </div>
                </div>
              </div>
            </div>
            <div className="border-4 border-indigo-500 rounded-2xl p-6 bg-indigo-50">
              <div className="flex items-center gap-4">
                <Clock className="h-12 w-12 text-indigo-600" />
                <div>
                  <div className="text-5xl font-bold text-indigo-600">
                    {totalHorasUsadas.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 uppercase">
                    HORAS USADAS
                  </div>
                </div>
              </div>
            </div>
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

        {/* PROJETOS POR RESPONSÁVEL */}
        <div>
          <h3 className="text-xl font-bold text-[#005CA9] mb-4 flex items-center gap-2">
            <Users className="h-6 w-6" />
            PROJETOS POR RESPONSÁVEL
          </h3>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projetosPorResponsavel().map(([nome, count]) => (
                <div key={nome} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <span className="font-semibold text-gray-700">{nome}</span>
                  <span className="text-2xl font-bold text-blue-600">{count}</span>
                </div>
              ))}
              {projetosPorResponsavel().length === 0 && (
                <p className="text-gray-500 col-span-3 text-center py-4">Nenhum dado disponível</p>
              )}
            </div>
          </div>
        </div>

        {/* PROJETOS POR SETOR */}
        <div>
          <h3 className="text-xl font-bold text-[#005CA9] mb-4 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            PROJETOS POR SETOR
          </h3>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projetosPorSetor().map(([setor, count]) => (
                <div key={setor} className="flex items-center justify-between p-4 bg-cyan-50 rounded-lg border-2 border-cyan-200">
                  <span className="font-semibold text-gray-700">{setor}</span>
                  <span className="text-2xl font-bold text-cyan-600">{count}</span>
                </div>
              ))}
              {projetosPorSetor().length === 0 && (
                <p className="text-gray-500 col-span-3 text-center py-4">Nenhum dado disponível</p>
              )}
            </div>
          </div>
        </div>

        {/* PROJETOS POR PRIORIDADE */}
        <div>
          <h3 className="text-xl font-bold text-[#005CA9] mb-4 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            PROJETOS POR PRIORIDADE
          </h3>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {projetosPorPrioridade().map(([prioridade, count]) => {
                const cor = corPrioridade(prioridade);
                return (
                  <div key={prioridade} className={`flex items-center justify-between p-4 ${cor.bg} rounded-lg border-2 ${cor.border}`}>
                    <span className={`font-semibold ${cor.text}`}>{prioridade}</span>
                    <span className={`text-2xl font-bold ${cor.text}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ATIVIDADES POR RESPONSÁVEL */}
        <div>
          <h3 className="text-xl font-bold text-[#005CA9] mb-4 flex items-center gap-2">
            <Users className="h-6 w-6" />
            ATIVIDADES POR RESPONSÁVEL
          </h3>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {atividadesPorResponsavel().map(([nome, count]) => (
                <div key={nome} className="flex items-center justify-between p-4 bg-teal-50 rounded-lg border-2 border-teal-200">
                  <span className="font-semibold text-gray-700">{nome}</span>
                  <span className="text-2xl font-bold text-teal-600">{count}</span>
                </div>
              ))}
              {atividadesPorResponsavel().length === 0 && (
                <p className="text-gray-500 col-span-3 text-center py-4">Nenhum dado disponível</p>
              )}
            </div>
          </div>
        </div>

        {/* ATIVIDADES POR SETOR */}
        <div>
          <h3 className="text-xl font-bold text-[#005CA9] mb-4 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            ATIVIDADES POR SETOR
          </h3>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {atividadesPorSetor().map(([setor, count]) => (
                <div key={setor} className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                  <span className="font-semibold text-gray-700">{setor}</span>
                  <span className="text-2xl font-bold text-emerald-600">{count}</span>
                </div>
              ))}
              {atividadesPorSetor().length === 0 && (
                <p className="text-gray-500 col-span-3 text-center py-4">Nenhum dado disponível</p>
              )}
            </div>
          </div>
        </div>

        {/* ATIVIDADES POR STATUS */}
        <div>
          <h3 className="text-xl font-bold text-[#005CA9] mb-4 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            ATIVIDADES POR STATUS
          </h3>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {atividadesPorStatus().map((item) => (
                <div key={item.status} className={`flex items-center justify-between p-4 ${item.bgColor} rounded-lg border-2 ${item.borderColor}`}>
                  <span className={`font-semibold ${item.color}`}>{item.status}</span>
                  <span className={`text-2xl font-bold ${item.color}`}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

