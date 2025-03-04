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

const config = {
    scope: "email openid phone",
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
};


export default config;