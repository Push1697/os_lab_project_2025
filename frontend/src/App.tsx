import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import AdminLogin from './pages/adminlogin';
import AdminDashboard from './pages/admindashboard';
// import AdminAddData from './pages/adminadddata';
import CreateAdmin from './pages/createadmin';
import About from './pages/about';
import Home from './pages/home';
import VerifyResult from './pages/verifyResult';

function AppLayout() {
  const location = useLocation();

  // In pages me Header hide hoga
  const hideHeaderRoutes = [
    "/admin/dashboard",
    "/admin-dashboard",
    "/admin-add-data",
    "/admin/create-admin",
    "/create-admin"
  ];

  const shouldHideHeader = hideHeaderRoutes.includes(location.pathname);

  return (
    <div className="App">
      {!shouldHideHeader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        {/* <Route path="/admin-add-data" element={<AdminAddData />} /> */}
        <Route path="/admin/create-admin" element={<CreateAdmin />} />
        <Route path="/create-admin" element={<CreateAdmin />} />
        <Route path="/verify-result" element={<VerifyResult />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
