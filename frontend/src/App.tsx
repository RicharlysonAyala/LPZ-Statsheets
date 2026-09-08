import { Routes, Route } from 'react-router-dom';
import MatchPage from './pages/MatchPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import MatchStatsheetPage from './pages/MatchStatsheetPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MatchPage />} />
      <Route path="/teams" element={<TeamsPage />} />
      <Route path="/teams/:teamId" element={<TeamDetailPage />} />
      <Route path="/matches/:matchId" element={<MatchStatsheetPage />} />
    </Routes>
  );
}