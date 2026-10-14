import { BrowserRouter, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css"

import './App.css'

import Layout from "./components/Layout";
import NoPage from "./components/NoPage";
import ScheduleDays from "./components/ScheduleDays";
import ProposalComponent from "./components/ProposalComponent";
import Home from "./components/Home";
import ParticipantSelection from "./components/ParticipantSelection";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="participants" element={<ParticipantSelection />} />
          <Route path="/login/:token" element={<Home />} />
          <Route path="schedule/:scheduleId" element={<ScheduleDays />} />
          <Route path="schedule/:scheduleId/day/:dayId" element={<ProposalComponent />} />
          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
