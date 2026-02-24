import { Link } from 'react-router-dom';
import './Auth.css';

function VerifyEmail() {
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="verify-icon">📧</div>
                <h1>Verify Your Email</h1>
                <p className="verify-message">
                    We've sent a verification link to your email address.
                    Please check your inbox and click the link to verify your account.
                </p>

                <div className="verify-steps">
                    <div className="step">
                        <span className="step-number">1</span>
                        <p>Check your email inbox</p>
                    </div>
                    <div className="step">
                        <span className="step-number">2</span>
                        <p>Click the verification link</p>
                    </div>
                    <div className="step">
                        <span className="step-number">3</span>
                        <p>Return here to sign in</p>
                    </div>
                </div>

                <Link to="/" className="btn-primary">
                    Go to Login
                </Link>

                <p className="verify-note">
                    Didn't receive the email? Check your spam folder or contact support.
                </p>
            </div>
        </div>
    );
}

export default VerifyEmail;
