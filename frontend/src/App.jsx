import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkSession } from './store/authSlice';
import { ThemeProvider } from './store/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import './App.css';

function PrivateRoute({ children }) {
    const { isAuthenticated, isAuthChecked, user } = useSelector((state) => state.auth);

    if (!isAuthChecked) {
        return <div className="loading-screen">Initializing...</div>;
    }

    // Redirect to login if not authenticated or no valid user
    if (!isAuthenticated || !user || !user.uid) {
        return <Navigate to="/" />;
    }

    return children;
}

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(checkSession());
    }, [dispatch]);

    return (
        <ThemeProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route
                    path="/dashboard/:uid"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <ProfilePage />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
        </ThemeProvider>
    );
}

export default App;
