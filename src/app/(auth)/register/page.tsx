import RegisterForm from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh' 
        }}>
            <RegisterForm />
        </div>
    );
}
