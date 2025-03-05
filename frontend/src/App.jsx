import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../Pages/Login/Login";
import Dashboard from "../Pages/Dashboard/Dashboard";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;