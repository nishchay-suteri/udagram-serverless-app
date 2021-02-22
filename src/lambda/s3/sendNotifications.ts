import { S3Handler, S3Event } from "aws-lambda";
import "source-map-support/register";
import * as AWS from "aws-sdk";

const docClient = new AWS.DynamoDB.DocumentClient();

const connectionsTable = process.env.CONNECTIONS_TABLE;
const stage = process.env.STAGE;
const apiId = process.env.API_ID;

const connectionParam = {
    apiVersion: "2018-11-29",
    endpoint: `${apiId}.execute-api.us-east-1.amazonaws.com/${stage}`,
};

const apiGateway = new AWS.ApiGatewayManagementApi(connectionParam);

export const handler: S3Handler = async (event: S3Event) => {
    for (const record of event.Records) {
        const key = record.s3.object.key;
        console.log("Processing S3 Items with key: ", key);

        const connections = await docClient
            .scan({
                TableName: connectionsTable,
            })
            .promise();

        const payload = {
            imageId: key,
        };

        for (const connection of connections.Items) {
            const connectionId = connection.id;
            await sendMessageToClient(connectionId, payload);
        }
    }
};

const sendMessageToClient = async (connectionId, payload) => {
    try {
        console.log("Sending message to a connection: ", connectionId);
        await apiGateway
            .postToConnection({
                ConnectionId: connectionId,
                Data: JSON.stringify(payload),
            })
            .promise();
    } catch (err) {
        console.log("Failed to send message, ", JSON.stringify(err));
        if (err.statusCode === 410) {
            console.log("stale connection");
            await docClient
                .delete({
                    TableName: connectionsTable,
                    Key: {
                        id: connectionId,
                    },
                })
                .promise();
        }
    }
};
