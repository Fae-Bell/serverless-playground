const assert = require("assert");
const sinon = require("sinon");
const { User, UserService, UserHandler } = require("./users");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const validUser = new User("test", "Test User", "test@test.com", "1990/01/01");
describe("UserService", () => {
  let userService;
  let docClientMock;
  beforeEach(() => {
    docClientMock = sinon.createStubInstance(DynamoDBDocumentClient);
    userService = new UserService(docClientMock);
  });
  describe("getAll", () => {
    it("should successfully getAll", async () => {
      const expectedUsers = [validUser];
      const expectedCode = 200;
      docClientMock.send.resolves({ Items: expectedUsers });
      const [code, actualUsers] = await userService.getAll();
      assert.strictEqual(code, expectedCode);
      assert.deepEqual(actualUsers, expectedUsers);
      sinon.assert.calledOnce(docClientMock.send);
    });
    it("should throw because of dynamodb error", () => {
      const expectedErr = new Error("DynamoDB Error");
      docClientMock.send.throws(expectedErr);
      assert.rejects(() => userService.getAll(), expectedErr);
      sinon.assert.calledOnce(docClientMock.send);
    });
  });
  describe("get", () => {
    it("should successfully get", async () => {
      const expectedUser = validUser;
      const expectedCode = 200;
      docClientMock.send.resolves({ Item: expectedUser });
      const [code, actualUser] = await userService.get("test");
      assert.strictEqual(code, expectedCode);
      assert.deepEqual(actualUser, expectedUser);
      sinon.assert.calledOnce(docClientMock.send);
    });
    it("should throw because of dynamodb error", async () => {
      const expectedErr = new Error("DynamoDB Error");
      docClientMock.send.throws(expectedErr);
      assert.rejects(() => userService.get("test"), expectedErr);
      sinon.assert.calledOnce(docClientMock.send);
    });
  });
  describe("post", () => {
    it("should successfully post", async () => {
      const expectedResp = { msg: "User created successfully" };
      const expectedCode = 200;
      docClientMock.send.resolves();
      const [code, actualResp] = await userService.post(validUser);
      assert.strictEqual(code, expectedCode);
      assert.deepEqual(actualResp, expectedResp);
      sinon.assert.calledOnce(docClientMock.send);
    });
    it("should throw because of validation error", async () => {
      const expectedMsg = '"userId" is required';
      const expectedCode = 400;
      const invalidUser = new User(
        "",
        "Test User",
        "test@test.com",
        "1990/01/01"
      );
      const [code, actualMsg] = await userService.post(invalidUser);
      assert.strictEqual(code, expectedCode);
      assert.strictEqual(actualMsg, expectedMsg);
      sinon.assert.notCalled(docClientMock.send);
    });
    it("should throw because of dynamodb error", async () => {
      const expectedErr = new Error("DynamoDB Error");
      docClientMock.send.throws(expectedErr);
      assert.rejects(() => userService.post(validUser), expectedErr);
      sinon.assert.calledOnce(docClientMock.send);
    });
  });
  describe("put", () => {
    it("should successfully put", async () => {
      const expectedResp = { msg: "User updated successfully" };
      const expectedCode = 200;
      docClientMock.send.resolves();
      const [code, actualResp] = await userService.put(validUser);
      assert.strictEqual(code, expectedCode);
      assert.deepEqual(actualResp, expectedResp);
      sinon.assert.calledOnce(docClientMock.send);
    });
    it("should throw because of validation error", async () => {
      const expectedMsg = '"userId" is required';
      const expectedCode = 400;
      const invalidUser = new User(
        "",
        "Test User",
        "test@test.com",
        "1990/01/01"
      );
      const [code, actualMsg] = await userService.put(invalidUser);
      assert.strictEqual(code, expectedCode);
      assert.strictEqual(actualMsg, expectedMsg);
      sinon.assert.notCalled(docClientMock.send);
    });
    it("should throw because of dynamodb error", async () => {
      const expectedErr = new Error("DynamoDB Error");
      docClientMock.send.throws(expectedErr);
      assert.rejects(() => userService.put(validUser), expectedErr);
      sinon.assert.calledOnce(docClientMock.send);
    });
  });
  describe("patch", () => {
    it("should successfully patch full object", async () => {
      const expectedResp = validUser;
      const expectedCode = 200;
      docClientMock.send.resolves({
        Attributes: expectedResp,
        $metadata: { httpStatusCode: 200 },
      });
      const [code, actualResp] = await userService.patch(expectedResp);
      assert.strictEqual(code, expectedCode);
      assert.deepEqual(actualResp, expectedResp);
      sinon.assert.calledWith(
        docClientMock.send,
        sinon.match({
          clientCommand: {
            input: {
              ExpressionAttributeValues: {
                ":name": expectedResp.name,
                ":email": expectedResp.email,
                ":dateOfBirth": expectedResp.dateOfBirth,
              },
              Key: { userId: expectedResp.userId },
              UpdateExpression:
                "SET #name = :name, email = :email, dateOfBirth = :dateOfBirth",
            },
          },
        })
      );
    });
    it("should successfully patch partial object", async () => {
      const expectedResp = new User("test", "Test2 User", "", "");
      const expectedCode = 200;
      docClientMock.send.resolves({
        Attributes: expectedResp,
        $metadata: { httpStatusCode: 200 },
      });
      const [code, actualResp] = await userService.patch(expectedResp);
      assert.strictEqual(code, expectedCode);
      assert.deepEqual(actualResp, expectedResp);
      sinon.assert.calledWith(
        docClientMock.send,
        sinon.match({
          clientCommand: {
            input: {
              ExpressionAttributeValues: {
                ":name": expectedResp.name,
              },
              Key: { userId: expectedResp.userId },
              UpdateExpression: "SET #name = :name",
            },
          },
        })
      );
    });
    it("should throw because of missing userId", async () => {
      const expectedMsg = '"userId" is required';
      const expectedCode = 400;
      const invalidUser = new User("", "Test User", "", "");
      const [code, actualMsg] = await userService.patch(invalidUser);
      assert.strictEqual(code, expectedCode);
      assert.strictEqual(actualMsg, expectedMsg);
      sinon.assert.notCalled(docClientMock.send);
    });
    it("should throw because of invalid dateOfBirth", async () => {
      const expectedMsg =
        '"dateOfBirth" must be a valid date formatted as yyyy/MM/dd';
      const expectedCode = 400;
      const invalidUser = new User("test", "", "", "1990-01-01");
      const [code, actualMsg] = await userService.patch(invalidUser);
      assert.strictEqual(code, expectedCode);
      assert.strictEqual(actualMsg, expectedMsg);
      sinon.assert.notCalled(docClientMock.send);
    });
    it("should throw because of no updated properties", async () => {
      const expectedMsg = "No valid properties to update";
      const expectedCode = 400;
      const invalidUser = new User("test", "", "", "");
      const [code, actualMsg] = await userService.patch(invalidUser);
      assert.strictEqual(code, expectedCode);
      assert.strictEqual(actualMsg, expectedMsg);
      sinon.assert.notCalled(docClientMock.send);
    });
    it("should throw because dynamodb metadata status code is not 200", async () => {
      const expectedMsg = { msg: "Could not update user" };
      const expectedCode = 500;
      docClientMock.send.resolves({
        $metadata: { httpStatusCode: expectedCode },
      });
      const [code, actualMsg] = await userService.patch(validUser);
      assert.strictEqual(code, expectedCode);
      assert.deepEqual(actualMsg, expectedMsg);
      sinon.assert.calledOnce(docClientMock.send);
    });
    it("should throw because of dynamodb error", async () => {
      const expectedErr = new Error("DynamoDB Error");
      docClientMock.send.throws(expectedErr);
      assert.rejects(() => userService.patch(validUser), expectedErr);
      sinon.assert.calledOnce(docClientMock.send);
    });
  });
  describe("delete", () => {
    it("should successfully delete", async () => {
      const expectedUser = validUser;
      const expectedCode = 200;
      docClientMock.send.returns({ Attributes: expectedUser });
      const [code, actualUser] = await userService.delete("test");
      assert.strictEqual(code, expectedCode);
      assert.deepEqual(actualUser, expectedUser);
      sinon.assert.calledOnce(docClientMock.send);
    });
    it("should throw because of dynamodb error", async () => {
      const expectedErr = new Error("DynamoDB Error");
      docClientMock.send.throws(expectedErr);
      assert.rejects(() => userService.delete("test"), expectedErr);
      sinon.assert.calledOnce(docClientMock.send);
    });
  });
});

describe("UserHandler", () => {
  let userHandler;
  let userServiceMock;
  let consoleErrMock;
  beforeEach(() => {
    userServiceMock = sinon.createStubInstance(UserService);
    userHandler = new UserHandler(userServiceMock);
    consoleErrMock = sinon.stub(console, "error");
  });
  afterEach(() => {
    consoleErrMock.restore();
  });
  describe.skip("setupRoutes", () => {
    it("should setup routes", () => {
      // Potentially create a mock server that we pass to setupRoutes then override the methods on the handler to ensure they are being called.
      // That's a lot of work for a relatively minor piece of code.
    });
  });
  describe("getAll", () => {
    it("should successfully getAll", async () => {
      const expectedUsers = [validUser];
      const expectedCode = 200;
      userServiceMock.getAll.resolves([expectedCode, expectedUsers]);
      const req = {};
      const res = { json: sinon.stub() };
      await userHandler.getAll(req, res);
      sinon.assert.calledOnce(userServiceMock.getAll);
      sinon.assert.calledWith(res.json, expectedUsers);
    });
    it("should return an unexpected error", async () => {
      const expectedErr = new Error("Unexpected Error");
      const expectedCode = 500;
      userServiceMock.getAll.rejects(expectedErr);
      const req = {};
      const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
      await userHandler.getAll(req, res);
      sinon.assert.calledOnce(userServiceMock.getAll);
      sinon.assert.calledWith(res.status, expectedCode);
      sinon.assert.calledWith(res.status().json, {
        error: "Could not retrieve users",
      });
      sinon.assert.calledWith(consoleErrMock, expectedErr);
    });
    it("should return an expected error", async () => {
      const expectedErr = { msg: "Expected Error" };
      const expectedCode = 400;
      userServiceMock.getAll.resolves([expectedCode, expectedErr]);
      const req = {};
      const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
      await userHandler.getAll(req, res);
      sinon.assert.calledOnce(userServiceMock.getAll);
      sinon.assert.calledWith(res.status, expectedCode);
      sinon.assert.calledWith(res.status().json, { error: expectedErr });
    });
  });
  describe("get", () => {
    it("should successfully get", async () => {
      const expectedUser = validUser;
      const expectedCode = 200;
      userServiceMock.get.resolves([expectedCode, expectedUser]);
      const req = {
        params: { userId: "test" },
      };
      const res = { json: sinon.stub() };
      await userHandler.get(req, res);
      sinon.assert.calledWith(userServiceMock.get, req.params.userId);
      sinon.assert.calledWith(res.json, expectedUser);
    });
    it("should return an unexpected error", async () => {
      const expectedErr = new Error("Unexpected Error");
      const expectedCode = 500;
      userServiceMock.get.rejects(expectedErr);
      const req = {
        params: { userId: "test" },
      };
      const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
      await userHandler.get(req, res);
      sinon.assert.calledWith(userServiceMock.get, req.params.userId);
      sinon.assert.calledWith(res.status, expectedCode);
      sinon.assert.calledWith(res.status().json, {
        error: "Could not retrieve user",
      });
      sinon.assert.calledWith(consoleErrMock, expectedErr);
    });
    it("should return an expected error", async () => {
      const expectedErr = { msg: "Expected Error" };
      const expectedCode = 400;
      userServiceMock.get.resolves([expectedCode, expectedErr]);
      const req = {
        params: { userId: "test" },
      };
      const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
      await userHandler.get(req, res);
      sinon.assert.calledWith(userServiceMock.get, req.params.userId);
      sinon.assert.calledWith(res.status, expectedCode);
      sinon.assert.calledWith(res.status().json, { error: expectedErr });
    });
  });
  describe("post", () => {
    it("should successfully post", async () => {
      const expectedResp = { msg: "User created successfully" };
      const expectedCode = 200;
      userServiceMock.post.resolves([expectedCode, expectedResp]);
      const req = {
        body: validUser,
      };
      const res = { json: sinon.stub() };
      await userHandler.post(req, res);
      sinon.assert.calledWith(userServiceMock.post, validUser);
      sinon.assert.calledWith(res.json, expectedResp);
    });
    it("should return an unexpected error", async () => {
      const expectedErr = new Error("Unexpected Error");
      const expectedCode = 500;
      userServiceMock.post.rejects(expectedErr);
      const req = {
        body: validUser,
      };
      const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
      await userHandler.post(req, res);
      sinon.assert.calledWith(userServiceMock.post, validUser);
      sinon.assert.calledWith(res.status, expectedCode);
      sinon.assert.calledWith(res.status().json, {
        error: "Could not create user",
      });
      sinon.assert.calledWith(consoleErrMock, expectedErr);
    });
    it("should return an expected error", async () => {
      const expectedErr = { msg: "Expected Error" };
      const expectedCode = 400;
      userServiceMock.post.resolves([expectedCode, expectedErr]);
      const req = {
        body: validUser,
      };
      const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
      await userHandler.post(req, res);
      sinon.assert.calledWith(userServiceMock.post, validUser);
      sinon.assert.calledWith(res.status, expectedCode);
      sinon.assert.calledWith(res.status().json, { error: expectedErr });
    });
  });
  describe("put", () => {
    it("should successfully put", async () => {
      const expectedResp = { msg: "User updated successfully" };
      const expectedCode = 200;
      userServiceMock.put.resolves([expectedCode, expectedResp]);
      const req = {
        body: validUser,
        params: { userId: "test2" },
      };
      const res = { json: sinon.stub() };
      await userHandler.put(req, res);
      sinon.assert.calledWith(
        userServiceMock.put,
        new User(
          req.params.userId,
          req.body.name,
          req.body.email,
          req.body.dateOfBirth
        )
      );
      sinon.assert.calledWith(res.json, expectedResp);
    });
    it("should return an unexpected error", async () => {
      const expectedErr = new Error("Unexpected Error");
      const expectedCode = 500;
      userServiceMock.put.rejects(expectedErr);
      const req = {
        body: validUser,
        params: { userId: "test2" },
      };
      const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
      await userHandler.put(req, res);
      sinon.assert.calledWith(
        userServiceMock.put,
        new User(
          req.params.userId,
          req.body.name,
          req.body.email,
          req.body.dateOfBirth
        )
      );
      sinon.assert.calledWith(res.status, expectedCode);
      sinon.assert.calledWith(res.status().json, {
        error: "Could not update user",
      });
      sinon.assert.calledWith(consoleErrMock, expectedErr);
    });
    it("should return an expected error", async () => {
      const expectedErr = { msg: "Expected Error" };
      const expectedCode = 400;
      userServiceMock.put.resolves([expectedCode, expectedErr]);
      const req = {
        body: validUser,
        params: { userId: "test2" },
      };
      const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
      await userHandler.put(req, res);
      sinon.assert.calledWith(
        userServiceMock.put,
        new User(
          req.params.userId,
          req.body.name,
          req.body.email,
          req.body.dateOfBirth
        )
      );
      sinon.assert.calledWith(res.status, expectedCode);
      sinon.assert.calledWith(res.status().json, { error: expectedErr });
    });
  });
  describe("patch", () => {
    it("should successfully patch", async () => {
      const expectedResp = { msg: "User updated successfully" };
      const expectedCode = 200;
      userServiceMock.patch.resolves([expectedCode, expectedResp]);
      const req = {
        body: validUser,
        params: { userId: "test2" },
      };
      const res = { json: sinon.stub() };
      await userHandler.patch(req, res);
      sinon.assert.calledWith(
        userServiceMock.patch,
        new User(
          req.params.userId,
          req.body.name,
          req.body.email,
          req.body.dateOfBirth
        )
      );
      sinon.assert.calledWith(res.json, expectedResp);
    });
    it("should return an unexpected error", async () => {
      const expectedErr = new Error("Unexpected Error");
      const expectedCode = 500;
      userServiceMock.patch.rejects(expectedErr);
      const req = {
        body: validUser,
        params: { userId: "test2" },
      };
      const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
      await userHandler.patch(req, res);
      sinon.assert.calledWith(
        userServiceMock.patch,
        new User(
          req.params.userId,
          req.body.name,
          req.body.email,
          req.body.dateOfBirth
        )
      );
      sinon.assert.calledWith(res.status, expectedCode);
      sinon.assert.calledWith(res.status().json, {
        error: "Could not update user",
      });
      sinon.assert.calledWith(consoleErrMock, expectedErr);
    });
    it("should return an expected error", async () => {
      const expectedErr = { msg: "Expected Error" };
      const expectedCode = 400;
      userServiceMock.patch.resolves([expectedCode, expectedErr]);
      const req = {
        body: validUser,
        params: { userId: "test2" },
      };
      const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
      await userHandler.patch(req, res);
      sinon.assert.calledWith(
        userServiceMock.patch,
        new User(
          req.params.userId,
          req.body.name,
          req.body.email,
          req.body.dateOfBirth
        )
      );
      sinon.assert.calledWith(res.status, expectedCode);
      sinon.assert.calledWith(res.status().json, { error: expectedErr });
    });
  });
  describe("delete", () => {
    it("should successfully delete", async () => {
      const expectedUser = validUser;
      const expectedCode = 200;
      userServiceMock.delete.resolves([expectedCode, expectedUser]);
      const req = {
        params: { userId: "test" },
      };
      const res = { json: sinon.stub() };
      await userHandler.delete(req, res);
      sinon.assert.calledWith(userServiceMock.delete, req.params.userId);
      sinon.assert.calledWith(res.json, expectedUser);
    });
    it("should return an unexpected error", async () => {
      const expectedErr = new Error("Unexpected Error");
      const expectedCode = 500;
      userServiceMock.delete.rejects(expectedErr);
      const req = {
        params: { userId: "test" },
      };
      const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
      await userHandler.delete(req, res);
      sinon.assert.calledWith(userServiceMock.delete, req.params.userId);
      sinon.assert.calledWith(res.status, expectedCode);
      sinon.assert.calledWith(res.status().json, {
        error: "Could not delete user",
      });
      sinon.assert.calledWith(consoleErrMock, expectedErr);
    });
    it("should return an expected error", async () => {
      const expectedErr = { msg: "Expected Error" };
      const expectedCode = 400;
      userServiceMock.delete.resolves([expectedCode, expectedErr]);
      const req = {
        params: { userId: "test" },
      };
      const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
      await userHandler.delete(req, res);
      sinon.assert.calledWith(userServiceMock.delete, req.params.userId);
      sinon.assert.calledWith(res.status, expectedCode);
      sinon.assert.calledWith(res.status().json, { error: expectedErr });
    });
  });
});
