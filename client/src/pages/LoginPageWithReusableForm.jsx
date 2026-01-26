import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { ReusableForm } from '../components/forms';

export default function LoginPageWithReusableForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const loginFields = [
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      fullWidth: true
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true,
      fullWidth: true
    }
  ];

  const validationRules = {
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    password: {
      minLength: 6,
      message: 'Password must be at least 6 characters long'
    }
  };

  const handleLogin = async (formData) => {
    const data = await authAPI.login(formData);
    login(data.data.user, data.data.token);
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-lg md:text-2xl font-bold mb-6 text-center">LabFalcon Login</h1>
        
        <ReusableForm
          fields={loginFields}
          onSubmit={handleLogin}
          submitText="Login"
          validationRules={validationRules}
          showCancelButton={false}
          submitButtonProps={{
            fullWidth: true,
            size: 'large'
          }}
        />
      </div>
    </div>
  );
}
