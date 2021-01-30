'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  // validation
  if (typeof data.text !== 'string' || typeof data.checked !== 'boolean') {
    console.error('Validation Failed');
    callback(null, {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: 'Couldn\'t update the member.',
    });
    return;
  }

  const params = {
    TableName: process.env.MEMBERS_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
    ExpressionAttributeNames: {
      '#member_name': 'name',
      '#member_email': 'email',
      '#member_mobile': 'mobile',
      '#member_designation': 'designation',
      '#member_about': 'about',
    },
    ExpressionAttributeValues: {
      ':name': data.name,
      ':email': data.email,
      ':mobile': data.mobile,
      ':designation': data.designation,
      ':about': data.about,
      ':updatedAt': timestamp,
    },
    UpdateExpression: 'SET #member_text = :name, email = :email, mobile = :mobile, designation = :designation, about = :about, updatedAt = :updatedAt',
    ReturnValues: 'ALL_NEW',
  };

  // update the member in the database
  dynamoDb.update(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: 'Couldn\'t fetch the member.',
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.Attributes),
    };
    callback(null, response);
  });
};