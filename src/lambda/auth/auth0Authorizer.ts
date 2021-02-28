import {
    CustomAuthorizerEvent,
    CustomAuthorizerResult,
    CustomAuthorizerHandler,
} from "aws-lambda";
import "source-map-support/register";

import { verify } from "jsonwebtoken";
import { JwtToken } from "../../auth/jwtToken";

const auth0Secret = process.env.AUTH_0_SECRET;

export const handler: CustomAuthorizerHandler = async (
    event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
    try {
        const decodedToken = verifyToken(event.authorizationToken);
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

const verifyToken = (authHeader: string): JwtToken => {
    if (!authHeader) {
        throw new Error("No authorization header");
    }
    if (!authHeader.toLocaleLowerCase().startsWith("bearer ")) {
        throw new Error("Invalid authorization header");
    }
    const split = authHeader.split(" ");
    const token = split[1];

    return verify(token, auth0Secret) as JwtToken;

    // a reqquest has been authorized
};
