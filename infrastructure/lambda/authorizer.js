const { CognitoJwtVerifier } = require('aws-jwt-verify');

const mapGroupsToPaths = [
  { path: '/POST/upload-url', groups: ['Admin'] },
  { path: '/GET/preview-url', groups: ['BasicUser', 'Admin'] },
  { path: '/GET/download-url', groups: ['BasicUser', 'Admin'] },
  { path: '/DELETE/delete-movie', groups: ['Admin'] },
  { path: '/GET/get-movie', groups: ['BasicUser', 'Admin'] },
  { path: '/GET/query-movies', groups: ['BasicUser', 'Admin'] },
  { path: '/PUT/put-movie', groups: ['Admin'] },
  { path: '/POST/post-subscription', groups: ['BasicUser'] },
  { path: '/PUT/put-subscription', groups: ['BasicUser'] },
  { path: '/GET/movies', groups: ['BasicUser', 'Admin'] },
  { path: '/GET/get-subscription', groups: ['BasicUser'] },
  { path: '/GET/get-topics', groups: ['BasicUser'] },
  { path: '/POST/post-like', groups: ['BasicUser'] },
  { path: '/GET/get-like', groups: ['BasicUser'] },
  { path: '/DELETE/delete-like', groups: ['BasicUser'] },
  { path: '/GET/get-feed', groups: ['BasicUser'] },
];

function extractPathFromMethodArn(methodArn) {
  const arnParts = methodArn.split(':');

  const apiGatewayPart = arnParts[arnParts.length - 1];

  const apiGatewayParts = apiGatewayPart.split('/');

  const path = `/${apiGatewayParts.slice(2).join('/')}`;
  return path;
}

function generatePolicy(principalId, effect, resource) {
  if (!effect || !resource) return null;

  const policyDocument = {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }
    ]
  };

  return {
    principalId: principalId,
    policyDocument: policyDocument
  };
}

exports.handler = async function (event) {
  console.log('Event:', JSON.stringify(event));

  const requestPath = extractPathFromMethodArn(event.routeArn);
  console.log('Request path:', requestPath);

  const existingPaths = mapGroupsToPaths.map((config) => config.path);

  if (!existingPaths.includes(requestPath)) {
    console.log('Invalid path');
    return {
      statusCode: 403,
      isAuthorized: false,
      body: JSON.stringify({ message: 'Invalid path' })
    };
  }

  const authHeader = event.identitySource[0];
  console.log(authHeader);
  if (!authHeader) {
    console.log('No auth header');
    return {
      statusCode: 401,
      isAuthorized: false,
      body: JSON.stringify({ message: 'No authorization header found' })
    };
  }

  const token = authHeader.split(' ')[1];
  const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.USER_POOL_ID,
    tokenUse: 'access',
    clientId: process.env.CLIENT_ID,
  });

  let payload;
  try {
    payload = await verifier.verify(token);
    console.log('Token is valid. Payload:', payload);
  } catch (error) {
    console.log('Token not valid!', error);
    return {
      statusCode: 401,
      isAuthorized: false,
      body: JSON.stringify({ message: 'Invalid token' })
    };
  }

  const matchingPathConfig = mapGroupsToPaths.find(
    (config) => requestPath === config.path
  );
  const userGroups = payload['cognito:groups'];

  const isAuthorized = userGroups.some((group) =>
    matchingPathConfig.groups.includes(group)
  );

  if (isAuthorized) {
    console.log("GOOOOOOOOOOD!");
    console.log(generatePolicy(payload.sub, 'Allow', event.methodArn));
    return {
      statusCode: 200,
      isAuthorized: true,
    };
  }

  return {
    statusCode: 403,
    isAuthorized: false,
    body: JSON.stringify({ message: 'User not authorized' })
  };
}
