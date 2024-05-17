import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FileUpload from './routes/fileUpload';
import LoginPage from './routes/loginPage';
import ConfirmUserPage from './routes/confirmPage';

function App() {
  const isAuthenticated = () => {
    const accessToken = sessionStorage.getItem('accessToken');
    return !!accessToken;
  };
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated() ? <Navigate replace to="/home" /> : <Navigate replace to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/confirm" element={<ConfirmUserPage />} />
        <Route path="/home" element={isAuthenticated() ? <FileUpload /> : <Navigate replace to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
