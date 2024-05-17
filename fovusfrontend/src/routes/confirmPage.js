import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirmSignUp } from '../services/authService';
import { Button, Label, TextInput, Card } from "flowbite-react";

const ConfirmUserPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState(location.state?.email || '');
    const [confirmationCode, setConfirmationCode] = useState('');

    const handleConfirmation = async (event) => {
        event.preventDefault();
        try {
            await confirmSignUp(email, confirmationCode);
            alert("Account confirmed successfully!\nSign in on next page.");
            navigate('/login');
        } catch (error) {
            alert(`Failed to confirm account: ${error}`);
        }
    };

    return (
        <div className="h-screen bg-gray-100 p-4 flex items-center justify-center">
            <Card className='p-4 sm:p-2'>
                <h1 className="block text-2xl text-center ml-3 mr-3 font-semibold text-gray-700">Confirm Account</h1>
                <p className="block font-thin text-center text-sm text-gray-700">Check your email for code</p>
                
                <form className="flex max-w-md flex-col gap-4" onSubmit={handleConfirmation}>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="email" value="Email " />
                        </div>
                        <TextInput className="" disabled id="email" type="email" value={email} placeholder="Email" readonly />
                    </div>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="confirm" value="Confirmation Code " /><span class="text-red-500">*</span>
                        </div>
                        <TextInput id="confirm" type="text" value={confirmationCode} onChange={(e) => setConfirmationCode(e.target.value)} placeholder="Six digit code" required />

                    </div>
                    <Button className='mt-2' type="submit">Confirm Email</Button>

                </form>
            </Card >
        </div >
    );

};

export default ConfirmUserPage;