import { APP_LOGO } from "@/const";
import { useLocation } from "wouter";
import { Users, FolderKanban, Zap, CheckSquare, BarChart3, Download } from "lucide-react";
import { Button } from "./ui/button";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location, setLocation] = useLocation();

  const tabs = [
    { id: "pessoas", label: "Pessoas", icon: Users, path: "/pessoas" },
    { id: "projetos", label: "Projetos", icon: FolderKanban, path: "/projetos" },
    { id: "atividades", label: "Atividades", icon: Zap, path: "/atividades" },
    { id: "subtarefas", label: "SubAtividades", icon: CheckSquare, path: "/subtarefas" },
    { id: "indicadores", label: "Indicadores", icon: BarChart3, path: "/indicadores" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#005CA9] via-[#0066BB] to-[#F5B800]">
      {/* Header */}
      <div className="border-2 border-white/30 rounded-3xl m-4 p-6 bg-[#005CA9]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <img src={APP_LOGO} alt="Logo" className="w-20 h-20 rounded-xl bg-white p-2 shadow-lg" />
            <div>
              <h1 className="text-3xl font-bold text-white">
                Sistema de Gerenciamento de Projetos
              </h1>
              <p className="text-[#F5B800] text-sm">Controle total de projetos e atividades</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="bg-[#F5B800] hover:bg-[#F5B800]/90 text-[#005CA9] border-none font-semibold"
          >
            <Download className="h-4 w-4 mr-2" />
            Carregar Dados de Exemplo
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            return (
              <button
                key={tab.id}
                onClick={() => setLocation(tab.path)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
                  ${
                    active
                      ? "bg-[#F5B800] text-[#005CA9] shadow-lg scale-105"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="mx-4 mb-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 min-h-[600px]">
          {children}
        </div>
      </div>
    </div>
  );
}

