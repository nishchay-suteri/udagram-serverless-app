import { CustomAuthorizerEvent, CustomAuthorizerResult } from "aws-lambda";
import "source-map-support/register";

import { verify } from "jsonwebtoken";
import { JwtToken } from "../../auth/jwtToken";

const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJXFJIbw1JokvvMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi1oN3NibHdtNy51cy5hdXRoMC5jb20wHhcNMjEwMjI3MTQwMDU4WhcN
MzQxMTA2MTQwMDU4WjAkMSIwIAYDVQQDExlkZXYtaDdzYmx3bTcudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr4nSddc6R+/C3gC5
VKdQSFr8jVKWTFl6bAru7GlI9k2T+XhrPTX4krYNUp2nptPZDkLwuz8dvx4zYpF9
fPN5DScime3xGjBmxYs1ECCAijwnVTRmUkHtV/3vo5olcqP49FVGl/i8jlOA7n7F
bfie4MyMF7DLD1VVApEWsS2Ha+I0B0bp2Dxe8ShvxyF0SWNhLpkdKHTEYVz8Ehcu
5swmlKI5oRb4KqdC4+L8bWgi3jQRz0Di+MITsf6l5i37FYPBckTtFds1swxvrerL
5NKXH+6TLvPRcMbt7dH8zsiv1QtUriYlQHQ5MaNgnRdWGYx/WvtizRoSuIJMzYnI
oFjOawIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTOyPJNIAqI
RN2Z6z4qpYgSvBQsxjAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AJElJhngRNjndX46AMPfiOVTRZpnfSLwEHFHnMiy2m9dsE8k1RqJ7lDEULP+H6NG
PBIvp3k7OVMQ0A0v3oGO6kgkd7XnT9elx+qhOL8vTjRXpyxrp1vn4Xajbgq2rySz
bzyJZ9vGN5mwUtdlXb3TezJGOIT+tz+66QlET0Vp/cnRwi6N5jFih0IXcirry1pG
5W1LeNK79t+AKoBSkkSD8W+brsIzEzIwbwafXN9sXX9zjqijdycg+LdrypxM9vDk
4ECqH0OWh0CW1YiKad6/049RdJj0UBU2nAh0WniO3GeswdqkQI88Hb5gn8NGCc8p
sVjUT7wf0aRll0fZJGcq1pQ=
-----END CERTIFICATE-----`;

export const handler = async (
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

    return verify(token, cert, { algorithms: ["RS256"] }) as JwtToken;
    // a reqquest has been authorized
};
