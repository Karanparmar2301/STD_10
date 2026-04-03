import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkSession } from './store/authSlice';
import './App.css';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SubjectPage = lazy(() => import('./pages/SubjectPage'));
const PDFViewer = lazy(() => import('./pages/PDFViewer'));

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
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<div className="loading-screen">Loading...</div>}>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
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
                    <Route
                        path="/books/:subject"
                        element={
                            <PrivateRoute>
                                <SubjectPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/books/:subject/chapter/:chapterId"
                        element={
                            <PrivateRoute>
                                <PDFViewer />
                            </PrivateRoute>
                        }
                    />
                    {/* Catch-all: redirect unknown URLs to login */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
