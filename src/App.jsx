import { Routes, Route } from "react-router-dom";
import Form from "./components/Form/Form";
import FormSexIQ from "./components/FormSexIQ/FormSexIQ";

export default function App() {

  return (
    <Routes>
      <Route
        path="/"
        element={<Form />}
      />

      <Route
        path="/sexiq"
        element={<FormSexIQ />}
      />
    </Routes>
  );
}
