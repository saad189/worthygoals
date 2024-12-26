// const awsConfig = {
//     Auth: {
//         region: 'YOUR_AWS_REGION', // e.g., 'us-east-1'
//         userPoolId: 'YOUR_USER_POOL_ID',
//         userPoolWebClientId: 'YOUR_APP_CLIENT_ID',
//         mandatorySignIn: true,
//         authenticationFlowType: 'USER_PASSWORD_AUTH',
//     },
// };

// export default awsConfig;

const cognitoAuthConfig = {
    authority: "https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_SDeWWTU2X",
    client_id: "4qgdldt5nqddo9f9jh074tmbfn",
    redirect_uri: "https://d84l1y8p4kdic.cloudfront.net",
    response_type: "code",
    scope: "email openid phone",
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
};


export default cognitoAuthConfig;