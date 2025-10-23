import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Pessoas from "./pages/Pessoas";
import Projetos from "./pages/Projetos";
import Atividades from "./pages/Atividades";
import Subtarefas from "./pages/Subtarefas";
import Indicadores from "./pages/Indicadores";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/pessoas"} component={Pessoas} />
      <Route path={"/projetos"} component={Projetos} />
      <Route path={"/atividades"} component={Atividades} />
      <Route path={"/subtarefas"} component={Subtarefas} />
      <Route path={"/indicadores"} component={Indicadores} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

