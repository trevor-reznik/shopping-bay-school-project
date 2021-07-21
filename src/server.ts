/**
 * Server for ostaa app backend.
 * @author Christian P. Byrne
 */
import { model, Schema, connect, Model } from "mongoose";
import { json, urlencoded } from "body-parser";
import { __prod__ } from "./constants";
import express, { Request, Response } from "express";
import cors from "cors";

type Credentials = {
  username: string;
  password: string;
};

type Item = {
  _id?: string;
  title: string;
  description: string;
  image?: string;
  price: number;
  stat?: string;
};

type User = {
  username: string;
  password: string;
  listings: string[];
  purchases: string[];
};

interface EbayMutations {
  create: {
    user: (credentials: Credentials) => Promise<void>;
    item: (item: Item, username: string) => Promise<void>;
  };
  modify: {
    user: (credentials: Credentials) => Promise<void>;
    item: (item: Item) => Promise<void>;
  };
}

interface EbayQueries {
  findOne: {
    user: (user: string) => Promise<User | null>;
  };
  findAll: {
    user: () => Promise<User[]>;
    item: () => Promise<Item[]>;
  };
}

interface EbayDatabase {
  itemSchema: Schema<Item, Model<any, any, any>, undefined, any>;
  itemModel: Model<Item, {}, {}>;

  userSchema: Schema<User, Model<any, any, any>, undefined, any>;
  userModel: Model<User, {}, {}>;

  mutations: EbayMutations;
  queries: EbayQueries;

  verbose: (outputPrinter: any) => any | false;
}

interface MongoDatabase {
  name: string;
  port: number;
  modelNames?: string[];
  models?: Schema[];
}

interface ExpressServer {
  server: express.Express;
  bindMiddleware: (middleware: any[]) => void;
}

// ────────────────────────────────────────────────────────────────────────────────

class EbayDatabase {
  constructor(verboseMsg: (msgPrinter : any) => void) {
    // This should be generalized with parameters.
    this.itemSchema = new Schema<Item>({
      title: String,
      description: String,
      image: String,
      price: Number,
      stat: String,
    });
    this.userSchema = new Schema<User>({
      username: { type: String, required: true },
      password: { type: String, required: true },
      listings: [String],
      purchases: [String],
    });
    this.itemModel = model<Item>("item", this.itemSchema);
    this.userModel = model<User>("user", this.userSchema);

    this.verbose = verboseMsg;

    // Resolvers.
    this.mutations = {
      create: {
        user: async (credentials: Credentials) => {
          if (this.verbose) {
            this.verbose("Credentials passed to createUser Resolver:");
            console.log(
              "Username:",
              credentials.username,
              "Password:",
              credentials.password
            );
          }
          const mutation = new this.userModel({
            username: credentials.username,
            password: credentials.password,
            listing: ["none"],
            purchases: ["none"],
          });
          await mutation.save();
        },
        item: async (item: Item, username: string) => {
          const mutation = new this.itemModel({
            title: item.title,
            description: item.description,
            price: item.price,
          });
          if (item.image) {
            mutation.image = item.image;
          }
          if (item.stat) {
            mutation.stat = item.stat;
          }
          await mutation.save();
          const user = await this.userModel
            .findOne({ username: username })
            .exec();
          //   .then((userDoc) => userDoc.listings.push(item.id));
          if (user) {
            user.listings.push(mutation._id);
            await user.save();
          }
        },
      },
      modify: {
        user: async (credentials: Credentials) => {
          await this.userModel
            .updateOne({
              username: credentials.username,
              password: credentials.password,
            })
            .exec();
        },
        item: async (item: Item) => {
          await this.itemModel.updateOne(item).exec();
        },
      },
    };
    this.queries = {
      findOne: {
        user: async (user: string): Promise<User | null> => {
          return await this.userModel.findOne({ username: user }).exec();
        },
      },
      findAll: {
        user: async () => {
          return await this.userModel.find({}).exec();
        },
        item: async () => {
          return await this.itemModel.find({}).exec();
        },
      },
    };
  }
}

class ExpressServer {
  constructor(staticFolder = "public_html") {
    this.server = express();
    this.server.use(express.static(staticFolder));
    this.server.use(express.json());
    this.server.get("/", (req: Request) => {
      if (!__prod__) {
        console.dir(req);
      }
    });
  }
  bindMiddleware = (middlewareArray: any[]) => {
    for (const handler of middlewareArray) {
      this.server.use(handler);
    }
  };
}

const ostaa = () => {
  // Constants.
  const PORT = __prod__ ? 80 : 5000;
  const IP = __prod__ ? "143.198.57.139" : "127.0.0.1";
  const GAP = "\n\n\n\n";
  const SPACER = (title = "section break") =>
    console.log(`${GAP}___ ${title} ___ ${GAP}`);

  // 1. Construct database client with configuration options.
  const dbConfig: MongoDatabase = {
    name: "ostaa",
    port: 27017,
    modelNames: ["user", "item"],
  };
  connect(`mongodb://localhost:${dbConfig.port}/${dbConfig.name}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then((value: typeof import("mongoose")) => {
    if (!__prod__) {
      SPACER("Mongoose Client Constructed");
      console.dir(value);
    }
  });

  // 2. Construct Resolvers and Models instance.
  const db = new EbayDatabase(SPACER);

  // 3. Initialize server and bind middleware.
  const http = new ExpressServer();
  const middleware = [cors(), json(), urlencoded({ extended: true })];
  http.bindMiddleware(middleware);

  // 4. Bind routers.
  // TODO: routers setter method efficient?
  http.server.post("/add/user", (req: Request, res: Response) => {
    if (!__prod__) {
      SPACER(`Username: ${req.body.username} Password: ${req.body.password}`);
    }
    db.mutations.create
      .user({
        username: req.body.username,
        password: req.body.password,
      })
      .then(() => {
        console.log("user created.");
      })
      .catch((reason: any) => {
        SPACER("User create resolver error.");
        console.log(reason);
      });
    res.end();
  });
  http.server.get("/register", (req: Request, res: Response) => {
    db.mutations.create
      .user({
        username: req.body.username,
        password: req.body.password,
      })
      .then(() => {
        console.log("user created.");
      })
      .catch((reason: any) => {
        SPACER("User create resolver error.");
        console.log(reason);
      });
    res.end();
  });

  http.server.get("/get/users", (req, res: Response) => {
    db.queries.findAll.user().then((value: User[]) => {
      res.json(value);
    });
  });

  http.server.get("/get/items", (req, res: Response) => {
    db.queries.findAll.item().then((value: Item[]) => {
      res.json(value);
    });
  });
  http.server.get(
    "/get/:collection/:username",
    (req: Request, res: Response) => {
      db.queries.findOne.user(req.params.username).then((value: User | null) => {
        if (value) {
          if (req.params.collection == "listings") {
            res.send(value.listings);
          }
          if (req.params.collection == "purchases") {
            res.send(value.purchases);
          }
        } else {
          SPACER("Cannot find user.");
          res.send("Cannot find user.");
        }
      });
    }
  );

  http.server.post("/add/item/:username", (req: Request, res: Response) => {
    db.mutations.create.item(req.body, req.params.username).then((value) => {
      console.log("item created.");
      if (!__prod__) {
        SPACER("New Item Created:");
        console.dir(req.body);
      }
      res.end();
    });
  });

  http.server.get(
    "/search/:collection/:keyword",
    (req: Request, res: Response) => {
      if (req.params.collection == "users") {
        db.queries.findAll.user().then((users: User[]) => {
          res.json(
            users.filter(
              (usr: User) =>
                usr.username && usr.username.includes(req.params.keyword)
            )
          );
        });
      }
      if (req.params.collection == "items") {
        db.queries.findAll.item().then((items: Item[]) => {
          res.json(
            items.filter(
              (item: Item) =>
                item.description &&
                item.description.includes(req.params.keyword)
            )
          );
        });
      }
    }
  );

  http.server.get("/login", (req: Request, res: Response) => {
    db.queries.findAll.user().then((users: User[]) => {
      if (!__prod__) {
        SPACER(`Query: ${req.query}`);
      }
      let matches: User[] | null = users.filter(
        (usr) =>
          usr.username == req.query.username &&
          usr.password == req.query.password
      );
      if (matches.length > 0) {
        res.send(true);
      } else {
        res.send(false);
      }
    });
  });

  // 5. Construct HTTP server client.
  http.server.listen(PORT, () => {
    if (!__prod__) {
      SPACER(`Listening at ${IP} on port ${PORT}.`);
    }
  });
};


ostaa();