import {
    CognitoIdentityProviderClient, InitiateAuthCommand,
    SignUpCommand, ConfirmSignUpCommand
} from "@aws-sdk/client-cognito-identity-provider";

export const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.REACT_APP_AWS_REGION,
});

export const signIn = async (username, password) => {
    const params = {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.REACT_APP_CLIENT_ID,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
        },
    };
    const command = new InitiateAuthCommand(params);
    const { AuthenticationResult } = await cognitoClient.send(command);
    if (AuthenticationResult) {
        sessionStorage.setItem("idToken", AuthenticationResult.IdToken || '');
        sessionStorage.setItem("accessToken", AuthenticationResult.AccessToken || '');
        sessionStorage.setItem("refreshToken", AuthenticationResult.RefreshToken || '');
        return AuthenticationResult;
    }

};

export const signUp = async (email, password) => {
    const params = {
        ClientId: process.env.REACT_APP_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
            {
                Name: "email",
                Value: email,
            },
        ],
    };
    const command = new SignUpCommand(params);
    const response = await cognitoClient.send(command);
    return response;
};

export const confirmSignUp = async (username, code) => {
    const params = {
        ClientId: process.env.REACT_APP_CLIENT_ID,
        Username: username,
        ConfirmationCode: code,
    };
    const command = new ConfirmSignUpCommand(params);
    await cognitoClient.send(command);
    return true;
};

export const logOut = () => {
    sessionStorage.clear();
}

export const parseJwt = (token) => {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}