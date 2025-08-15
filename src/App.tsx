import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./../node_modules/bootstrap/dist/css/bootstrap.min.css"

import './App.css'

import Layout from "./components/Layout";
import NoPage from "./components/NoPage";
import Login from "./components/Login";
import Schedules from "./components/Schedules";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Schedules />} />
          <Route path="login/:token" element={<Login />} />
          <Route path="schedules/" element={<Schedules />} />
          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
