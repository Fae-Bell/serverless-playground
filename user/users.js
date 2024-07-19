const { ReturnValue } = require("@aws-sdk/client-dynamodb");
const {
  GetCommand,
  ScanCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const luxon = require("luxon");

const USERS_TABLE = process.env.USERS_TABLE;

const validateDateOfBirth = (dateOfBirth) => {
  let parsedDateOfBirth;
  try {
    parsedDateOfBirth = luxon.DateTime.fromFormat(dateOfBirth, "yyyy/MM/dd");
  } catch (error) {
    console.error(error);
    return "Invalid dateOfBirth";
  }
  if (parsedDateOfBirth.invalid) {
    return '"dateOfBirth" must be a valid date formatted as yyyy/MM/dd';
  }

  return "";
};

class User {
  constructor(userId, name, email, dateOfBirth) {
    this.userId = userId;
    this.name = name;
    this.email = email;
    this.dateOfBirth = dateOfBirth;
  }
  fullValidate() {
    if (typeof this.userId !== "string") {
      return '"userId" must be a string';
    } else if (typeof this.name !== "string") {
      return '"name" must be a string';
    } else if (typeof this.email !== "string") {
      return '"email" must be a string';
    } else if (typeof this.dateOfBirth !== "string") {
      return '"dateOfBirth" must be a string';
    } else if (this.userId.trim() === "") {
      return '"userId" is required';
    }

    return validateDateOfBirth(this.dateOfBirth);
  }
}

class UserService {
  constructor(docClient) {
    this.docClient = docClient;
  }
  async getAll() {
    const params = {
      TableName: USERS_TABLE,
    };

    const command = new ScanCommand(params);
    const { Items } = await this.docClient.send(command);
    return [
      200,
      Items.map(
        ({ userId, name, email, dateOfBirth }) =>
          new User(userId, name, email, dateOfBirth)
      ),
    ];
  }
  async get(userId) {
    const params = {
      TableName: USERS_TABLE,
      Key: {
        userId,
      },
    };

    const command = new GetCommand(params);
    const { Item } = await this.docClient.send(command);
    return [
      200,
      new User(Item.userId, Item.name, Item.email, Item.dateOfBirth),
    ];
  }
  async post(user) {
    const msg = user.fullValidate();
    if (msg) {
      return [400, msg];
    }

    const params = {
      TableName: USERS_TABLE,
      Item: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
      },
    };

    const command = new PutCommand(params);
    await this.docClient.send(command);
    return [200, { msg: "User created successfully" }];
  }
  async put(user) {
    const msg = user.fullValidate();
    if (msg) {
      return [400, msg];
    }

    const params = {
      TableName: USERS_TABLE,
      Item: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
      },
    };

    const command = new PutCommand(params);
    await this.docClient.send(command);
    return [200, { msg: "User updated successfully" }];
  }
  async patch(user) {
    if (!user.userId) {
      return [400, '"userId" is required'];
    }
    const updateExpression = [];
    let expressionAttributeNames = null;
    const expressionAttributeValues = {};
    if (user.name) {
      updateExpression.push("#name = :name");
      expressionAttributeNames = { "#name": "name" };
      expressionAttributeValues[":name"] = user.name;
    }
    if (user.email) {
      updateExpression.push("email = :email");
      expressionAttributeValues[":email"] = user.email;
    }
    if (user.dateOfBirth) {
      const msg = validateDateOfBirth(user.dateOfBirth);
      if (msg) {
        return [400, msg];
      }
      updateExpression.push("dateOfBirth = :dateOfBirth");
      expressionAttributeValues[":dateOfBirth"] = user.dateOfBirth;
    }

    if (updateExpression.length === 0) {
      return [400, "No valid properties to update"];
    }

    const params = {
      TableName: USERS_TABLE,
      Key: { userId: user.userId },
      ReturnValues: ReturnValue.ALL_NEW,
      UpdateExpression: "SET " + updateExpression.join(", "),
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    };
    const cmd = new UpdateCommand(params);
    const { $metadata, Attributes } = await this.docClient.send(cmd);
    if ($metadata.httpStatusCode !== 200) {
      return [$metadata.httpStatusCode, { msg: "Could not update user" }];
    }
    return [
      200,
      new User(
        Attributes.userId,
        Attributes.name,
        Attributes.email,
        Attributes.dateOfBirth
      ),
    ];
  }
  async delete(userId) {
    const params = {
      TableName: USERS_TABLE,
      ReturnValues: ReturnValue.ALL_OLD,
      Key: {
        userId,
      },
    };

    const command = new DeleteCommand(params);
    const { Attributes } = await this.docClient.send(command);
    return [
      200,
      new User(
        Attributes.userId,
        Attributes.name,
        Attributes.email,
        Attributes.dateOfBirth
      ),
    ];
  }
}

class UserHandler {
  constructor(userService) {
    this.userService = userService;
  }
  async getAll(req, res) {
    try {
      const [respCode, response] = await this.userService.getAll();
      if (respCode === 200) {
        res.json(response);
      } else {
        res.status(respCode).json({ error: response });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Could not retrieve users" });
    }
  }
  async get(req, res) {
    try {
      const [respCode, response] = await this.userService.get(
        req.params.userId
      );
      if (respCode === 200) {
        res.json(response);
      } else {
        res.status(respCode).json({ error: response });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Could not retrieve user" });
    }
  }
  async post(req, res) {
    try {
      const { userId, name, email, dateOfBirth } = req.body;
      const user = new User(userId, name, email, dateOfBirth);
      const [respCode, response] = await this.userService.post(user);
      if (respCode === 200) {
        res.json(response);
      } else {
        res.status(respCode).json({ error: response });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Could not create user" });
    }
  }
  async put(req, res) {
    try {
      const { name, email, dateOfBirth } = req.body;
      const { userId } = req.params;
      const user = new User(userId, name, email, dateOfBirth);
      const [respCode, response] = await this.userService.put(user);
      if (respCode === 200) {
        res.json(response);
      } else {
        res.status(respCode).json({ error: response });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Could not update user" });
    }
  }
  async patch(req, res) {
    try {
      const { name, email, dateOfBirth } = req.body;
      const { userId } = req.params;
      const user = new User(userId, name, email, dateOfBirth);
      const [respCode, response] = await this.userService.patch(user);
      if (respCode === 200) {
        res.json(response);
      } else {
        res.status(respCode).json({ error: response });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Could not update user" });
    }
  }
  async delete(req, res) {
    try {
      const [respCode, response] = await this.userService.delete(
        req.params.userId
      );
      if (respCode === 200) {
        res.json(response);
      } else {
        res.status(respCode).json({ error: response });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Could not delete user" });
    }
  }

  setupRoutes(app) {
    app.get("/users", this.getAll.bind(this));
    app.post("/users", this.post.bind(this));
    app.put("/users/:userId", this.put.bind(this));
    app.patch("/users/:userId", this.patch.bind(this));
    app.get("/users/:userId", this.get.bind(this));
    app.delete("/users/:userId", this.delete.bind(this));
  }
}

module.exports = { User, UserService, UserHandler };
