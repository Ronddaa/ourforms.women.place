import { Routes, Route } from "react-router-dom";
import MainPage from "./components/MainPage/MainPage";
import FormSexIQOrder from "./components/FormSexIQOrder/FormSexIQOrder";
import FormSexIQStandart from "./components/FormSexIQ/FormSexIQStandart";
import FormSexIQVIP from "./components/FormSexIQ/FormSexIQVIP";
import FormSexIQPersonalWork from "./components/FormSexIQ/FormSexIQPersonalWork";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} /> // Just a Page

      //Sex IQ Pages
      <Route path="/sexiq" element={<FormSexIQOrder />} />
      <Route path="/sexiqstandart" element={<FormSexIQStandart />} />
      <Route path="/sexiqvip" element={<FormSexIQVIP />} /> // SexVIP
      <Route path="/sexiqpersonalwork" element={<FormSexIQPersonalWork />} /> // SexVIP
    </Routes>
  );
}
