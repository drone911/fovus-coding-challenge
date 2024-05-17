import axios from "axios";
import { useState } from 'react';
import { Button, FileInput, Label, TextInput, Card } from "flowbite-react";
import { S3Client, PutObjectCommand, S3, crede } from "@aws-sdk/client-s3";
import { parseJwt, logOut } from '../services/authService';
import { useNavigate } from "react-router-dom";

function FileUpload() {
    const [inputText, setInputText] = useState('');
    const [inputFile, setInputFile] = useState();
    const navigate = useNavigate();
    const idToken = parseJwt(sessionStorage.idToken.toString());

    const handleUpload = async (e) => {
        e.preventDefault();

        if (inputFile.size > Number(process.env.REACT_APP_MAX_UPLOAD_FILE_SIZE)) {
            alert(`Upload file less than ${process.env.REACT_APP_MAX_UPLOAD_FILE_SIZE / 1000000} MB}`);
            return;
        };
        try {
            const handleFileRead = async (e) => {
                const content = fileReader.result;
                const fileKey = `${idToken.email}/${inputFile.name}`
                const signedUrlResponse = await axios.post("https://igg89j0mnf.execute-api.us-east-1.amazonaws.com/prod//signed/", {
                    "file_key": fileKey
                })
                const presignedS3Url = signedUrlResponse.data.signedUrl;
                await axios.post(presignedS3Url, {
                    data: content
                }, {
                    headers: {
                        'Content-Type': 'application/octet-stream'
                    }
                })

                axios.post(process.env.REACT_APP_API_URL, {
                    "input_text": inputText,
                    "input_file_path": `${process.env.REACT_APP_BUCKET_NAME}/${fileKey}`
                }, {
                    headers: {
                        "Authorization": sessionStorage.idToken,
                    }
                })
                alert('File Uploaded Successfully');
            };

            let fileReader = new FileReader();
            fileReader.onloadend = handleFileRead;
            fileReader.readAsText(inputFile);

        } catch (e) {
            alert(`Error occured while uploading the file`);
        }

    }
    return (
        <div className="h-screen bg-gray-100 p-4 flex items-center justify-center">
            <Card className='p-4 sm:p-2'>
                <h1 className="block text-2xl font-semibold text-gray-700">
                    User File Upload
                </h1>
                <form className="flex max-w-md flex-col gap-4" onSubmit={handleUpload}>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="input_text" value="Text Input " /><span class="text-red-500">*</span>
                        </div>
                        <TextInput id="input_text" placeholder="" value={inputText} onChange={(e) => setInputText(e.target.value)} required />
                    </div>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="file-upload" value="File Input " /><span class="text-red-500">*</span>
                        </div>
                        <FileInput id="file-upload" onChange={(e) => setInputFile(e.target.files[0])} required />
                    </div>
                    <Button className='mt-2' type="submit">Submit</Button>
                </form>
                <Button onClick={() => {
                    logOut();
                    navigate('/login');
                }} color="red">Log Out</Button>
            </Card>
        </div>
    );
}

export default FileUpload;
