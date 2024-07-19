# User Lambda Endpoints

## Steps for Setup

### AWS

1. Walk through steps at https://aws.amazon.com/ to create an AWS account
1. Once logged in, go to IAM and create a new user with an Admin permissions policy.
   - Ideally you wouldn't have an admin with these permissions, but it is the recommended from the Serverless documentation in initial setup. https://www.serverless.com/framework/docs/providers/aws/guide/credentials
1. Ensure you can login with this user, as you'll need to do so during the Serverless setup when it creates CloudFormation. (Steps will tell you to login as the user and run the stage setup)

### Serverless

1. Install Node
1. Install NPM
1. Install Serverless globally
1. Update Serverless
   - This should not be necessary with serverless v4, but no harm in doing so

I personally use NVM for Node versioning. The setup for this might look like this:

Install NVM:

`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`

Install Node, NPM, and Serverless

`nvm install v20 --latest-npm && npm install -g serverless`

- We're using v20 here because that's what serverless uses as its latest node version supported by Lambdas

Update Serverless

- `serverless update`
- `cd /user && npm install`

## Deploying

- Run `serverless dev` to create a local instanced version for testing
- Run `serverless deploy` to push the builds into AWS and be available publically

Either command will return a url that you can use for actual testing. Eg: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com

## Testing

### Unit

Unit tests have been written for the user endpoints. To run them, simply go into the `/user` folder and run `npm test` after you've run `npm install`

### Endpoints

The following endpoints are available:

- GET `/users`
  - Scan's DynamoDB and pulls all users
- POST `/users/`
  - Inserts a new user with the body of the request values: `userId`, `name`, `email`, `dateOfBirth`
- GET `/users/:userId`
  - Gets a single Item from Dynamo using the userId as a key
- PUT `/users/:userId`
  - Overwrites the entire stored user with the request values, using the userId param as a Key: `name`, `email`, `dateOfBirth`
- PATCH `/users/:userId`
  - Overwrites PARTS of the stored user with the request values, using the userId param as a Key: `name`, `email`, `dateOfBirth`
- DELETE `/users/:userId`
  - Deletes a user using th euserId as a Key

For ease of testing, I've included an export of a Postman Collection which has endpoints for each of the ones listed above, along with some test data. The only thing that needs to be done for it to work after import is to update the "Host" variable in the Collection to the one that your `serverless dev` or `serverless deploy` returns.
