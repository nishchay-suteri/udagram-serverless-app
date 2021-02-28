import {
    CustomAuthorizerEvent,
    CustomAuthorizerResult,
    CustomAuthorizerHandler,
} from "aws-lambda";
import "source-map-support/register";

import * as AWS from "aws-sdk";

import { verify } from "jsonwebtoken";
import { JwtToken } from "../../auth/jwtToken";

const secretId = process.env.AUTH_0_SECRET_ID;
const secretField = process.env.AUTH_0_SECRET_FIELD;

const client = new AWS.SecretsManager();

// Cache secret if lambda instance is reused
let cacheSecret: string;

export const handler: CustomAuthorizerHandler = async (
    event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
    try {
        const decodedToken = await verifyToken(event.authorizationToken);
        console.log("User was authorized");
        return {
            principalId: decodedToken.sub,
            policyDocument: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "execute-api:Invoke",
                        Effect: "Allow",
                        Resource: "*",
                    },
                ],
            },
        };
    } catch (err) {
        console.log("user was not authorized", err.message);
        return {
            principalId: "user",
            policyDocument: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "execute-api:Invoke",
                        Effect: "Deny",
                        Resource: "*",
                    },
                ],
            },
        };
    }
};

const verifyToken = async (authHeader: string): Promise<JwtToken> => {
    if (!authHeader) {
        throw new Error("No authorization header");
    }
    if (!authHeader.toLocaleLowerCase().startsWith("bearer ")) {
        throw new Error("Invalid authorization header");
    }
    const split = authHeader.split(" ");
    const token = split[1];

    const secretObject: any = await getSecret();
    const auth0Secret = secretObject[secretField];

    return verify(token, auth0Secret) as JwtToken;

    // a reqquest has been authorized
};

const getSecret = async () => {
    if (cacheSecret) return cacheSecret;

    const data = await client
        .getSecretValue({
            SecretId: secretId,
        })
        .promise();

    cacheSecret = data.SecretString;

    return JSON.parse(cacheSecret);
};
