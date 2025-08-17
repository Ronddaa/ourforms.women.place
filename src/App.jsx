import { Routes, Route } from "react-router-dom";
import MainPage from "./components/MainPage/MainPage";
import FormSexIQOrder from "./components/FormSexIQOrder/FormSexIQOrder";
import FormSexIQStandart from "./components/FormSexIQ/FormSexIQStandart";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} /> // Just a Page
      <Route path="/sexiq" element={<FormSexIQOrder />} /> // Sex IQ Page Order
      <Route path="/sexiqstandart" element={<FormSexIQStandart />} /> // Sex IQ
      Page
    </Routes>
  );
}
