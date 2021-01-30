'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);
  console.log({body: event.body});
  if (typeof data.name !== 'string') {
    console.error('Validation Failed');
    callback(null, {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Couldn\'t create the member item.',
    });
    return;
  }

  const params = {
    TableName: process.env.MEMBERS_TABLE,
    Item: {
      id: uuid.v1(),
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      designation: data.designation,
      about: data.about,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };

  // write the member to the database
  dynamoDb.put(params, (error) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t create the member.',
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(params.Item),
    };
    callback(null, response);
  });
};