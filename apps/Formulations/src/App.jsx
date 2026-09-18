import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { FormulationProvider } from './context/FormulationContext';
import Dashboard from './pages/Dashboard';
import FormulationEditor from './pages/FormulationEditor';
import BatchCalculator from './pages/BatchCalculator';

function App() {
  return (
    <FormulationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor" element={<FormulationEditor />} />
          <Route path="/editor/:id" element={<FormulationEditor />} />
          <Route path="/calculator" element={<BatchCalculator />} />
        </Routes>
      </Router>
    </FormulationProvider>
  );
}

export default App;
