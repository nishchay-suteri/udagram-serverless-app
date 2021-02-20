import {
    APIGatewayProxyHandler,
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
} from "aws-lambda";
import "source-map-support/register";
import * as AWS from "aws-sdk";

const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;

export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    console.log("Processing event: ", event);

    const groupId = event.pathParameters.groupId;
    const validGroupId = await groupExists(groupId);

    if (!validGroupId) {
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                error: "Group Doesn't Exists",
            }),
        };
    }

    const images = await getImagesPerGroup(groupId);

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            items: images,
        }),
    };
};

const groupExists = async (groupId: string) => {
    const result = await docClient
        .get({
            TableName: groupsTable,
            Key: {
                id: groupId,
            },
        })
        .promise();
    console.log("Get Groups: ", result);
    return !!result.Item;
};

const getImagesPerGroup = async (groupId: string) => {
    const result = await docClient
        .query({
            TableName: imagesTable,
            KeyConditionExpression: "groupId = :groupId",
            ExpressionAttributeValues: {
                ":groupId": groupId,
            },
            ScanIndexForward: false,
        })
        .promise();
    return result.Items;
};
