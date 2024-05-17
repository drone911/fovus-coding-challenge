import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../services/authService';
import { Button, Label, TextInput, Card } from "flowbite-react";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const navigate = useNavigate();

    const handleSignIn = async (event) => {
        event.preventDefault();
        try {
            const session = await signIn(email, password);
            console.log('Sign in successful', session);
            if (session && typeof session.AccessToken !== 'undefined') {
                sessionStorage.setItem('accessToken', session.AccessToken);
                if (sessionStorage.getItem('accessToken')) {
                    window.location.href = '/home';
                } else {
                    console.error('Session token was not set properly.');
                }
            } else {
                console.error('SignIn session or AccessToken is undefined.');
            }
        } catch (error) {
            console.error(error);
            alert(`Sign in failed, Incorrect username or password`);
        }
    };

    const handleSignUp = async (event) => {
        event.preventDefault();
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        try {
            await signUp(email, password);
            navigate('/confirm', { state: { email } });
        } catch (error) {
            alert(`Sign up failed, please try again`);
            
        }
    };

    return (
        <div className="h-screen bg-gray-100 p-4 flex items-center justify-center">
            <Card className='p-4 sm:p-2'>
                <h1 className="block text-2xl font-semibold text-gray-700">
                    {isSignUp ? 'Sign up to create an account' : 'Sign in to your account'}
                </h1>
                <form className="flex max-w-md flex-col gap-4" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="email" value="Email " /><span class="text-red-500">*</span>
                        </div>
                        <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
                    </div>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="password" value="Password " /><span class="text-red-500">*</span>
                        </div>
                        <TextInput id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />

                    </div>
                    {isSignUp && (
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="confirmPassword" value="Confirm Password " /><span class="text-red-500">*</span>
                            </div>
                            <TextInput id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Password" required />
                        </div>
                    )}
                    <Button className='mt-2' type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</Button>
                    <Button color="green" onClick={() => setIsSignUp(!isSignUp)}>
                        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                    </Button>

                </form>
            </Card >
        </div >
    )
};

export default LoginPage;