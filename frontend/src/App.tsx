import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { AppShell } from "./components/AppShell";
import { CriticalAlertOverlay } from "./components/CriticalAlertOverlay";
import Login from "./pages/Login";
import CommandCenter from "./pages/CommandCenter";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import MachineHealth from "./pages/MachineHealth";
import Safety from "./pages/Safety";
import WorkZone from "./pages/WorkZone";
import Incidents from "./pages/Incidents";
import Training from "./pages/Training";
import Analytics from "./pages/Analytics";
import Handover from "./pages/Handover";
import Assistant from "./pages/Assistant";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid h-full place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-cat" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <CriticalAlertOverlay />
      <AppShell>
        <Routes>
          <Route path="/" element={<CommandCenter />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/machine" element={<MachineHealth />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/zone" element={<WorkZone />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/training" element={<Training />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/handover" element={<Handover />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </>
  );
}
