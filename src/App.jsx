import { Routes, Route } from "react-router-dom";
import MainPage from "./components/MainPage/MainPage";
import FormSexIQOrder from "./components/FormSexIQOrder/FormSexIQOrder";
import FormSexIQStandart from "./components/FormSexIQ/FormSexIQStandart";
import FormSexIQVIP from "./components/FormSexIQ/FormSexIQVIP";
import FormSexIQPersonalWork from "./components/FormSexIQ/FormSexIQPersonalWork";
import FormSexIQPrepayment from "./components/FormSexIQ/FormSexIQPrepayment";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} /> 
      <Route path="/sexiq" element={<FormSexIQOrder />} />
      <Route path="/sexiqstandart" element={<FormSexIQStandart />} />
      <Route path="/sexiqvip" element={<FormSexIQVIP />} />
      <Route path="/sexiqpersonalwork" element={<FormSexIQPersonalWork />} />
      <Route path="/sexiqprepayment" element={<FormSexIQPrepayment />} />
    </Routes>
  );
}
