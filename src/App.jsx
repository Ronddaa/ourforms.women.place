import { Routes, Route } from "react-router-dom";
import MainPage from "./components/MainPage/MainPage";
import FormSexIQ from "./components/FormSexIQ/FormSexIQ";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} /> // Just a Page
      <Route path="/sexiq" element={<FormSexIQ />} /> // Sex IQ Page
    </Routes>
  );
}
