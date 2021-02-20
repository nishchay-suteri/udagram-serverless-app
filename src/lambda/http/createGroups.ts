import {
    APIGatewayProxyHandler,
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
} from "aws-lambda";
import "source-map-support/register";
import * as AWS from "aws-sdk";
import * as uuid from "uuid";

const docClient = new AWS.DynamoDB.DocumentClient();
const groupTable = process.env.GROUPS_TABLE;

export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    console.log("Processing events: ", event);
    const itemID = uuid.v4();
    const parsedBody = JSON.parse(event.body);

    const newItem = {
        id: itemID,
        ...parsedBody,
    };
    await docClient
        .put({
            TableName: groupTable,
            Item: newItem,
        })
        .promise();

    return {
        statusCode: 201,
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            newItem,
        }),
    };
};
