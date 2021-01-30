'use strict';

const uuid = require('uuid');
const id = uuid.v4();
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const s3Bucket = new AWS.S3({ params: { Bucket: process.env.PROFILE_BUCKET } });
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const timestamp = new Date().getTime();

module.exports.handler = (event, context, callback) => {
  const data = JSON.parse(event.body);

  if (typeof data.name !== 'string') {
    console.error('Validation Failed');
    callback(null, {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Couldn\'t create the member item.',
    });
    return;
  }
  if (!data.photo) {
    return
  }
  saveProfilePhoto(id, data.photo).then(res => {
    console.log({ res });
    saveDataInDB(res.photo, data).then(params => {
      const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(params.Item),
      };
      return response
    }, err => {
      return {
        statusCode: err.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: 'Couldn\'t create the member.',
      };)
  })
}


const saveProfilePhoto = async (uid, photo) => {
  const buf = Buffer.from(photo.replace(/^data:image\/\w+;base64,/, ""), 'base64');
  const data = {
    Key: uid,
    Body: buf,
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg'
  }
  try {
    await s3Bucket.putObject(data).promise()
    return {
      photo: `https://${process.env.PROFILE_BUCKET}.s3.amazonaws.com/${id}`
    }
  } catch (error) {
    console.log({ error });
    throw new Error('Error while saving picture')
  }
}


const saveDataInDB = async (photo, data) => {
  console.log('inside savedataindb');
  const params = {
    TableName: process.env.MEMBERS_TABLE,
    Item: {
      id,
      photo,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      designation: data.designation,
      about: data.about,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };

  try {
    console.log('trying to save in db...')
    await dynamoDb.put(params).promise();
    console.log('saved!')
    return params
  } catch (error) {
    console.log('problem in db put method');
    throw new Error('problem in db put method')
  }

}