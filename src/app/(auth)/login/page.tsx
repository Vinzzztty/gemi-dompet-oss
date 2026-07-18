import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh' 
        }}>
            <LoginForm />
        </div>
    );
}
