/**
 * Server for ostaa app backend.
 * @author Christian P. Byrne
 */
import { model, Schema, connect, Model } from "mongoose";
import { json, urlencoded } from "body-parser";
import { __prod__ } from "./constants";
import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";

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
    item: (
      item: Item,
      imgPath: string | null,
      username: string
    ) => Promise<void>;
  };
  modify: {
    user: (credentials: Credentials) => Promise<void>;
    item: any;
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
  constructor(verboseMsg: (msgPrinter: any) => void) {
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
        item: async (item: Item, imgPath: string | null, username: string) => {
          const mutation = new this.itemModel({
            title: item.title,
            description: item.description,
            price: item.price,
            stat: "sale",
          });
          if (imgPath) {
            mutation.image = imgPath;
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
        item: async (id: string, user: string) => {
          return await this.itemModel.findOne({ _id: id }).then((item) => {
            if (item) {
              item.stat = "sold";
              item.save().then(() => {
                this.userModel.findOne({ username: user }).then((userDoc) => {
                  if (userDoc) {
                    userDoc.purchases.push(id);
                    userDoc.save();
                  }
                });
              });
            }
          });
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

  // If security? (1) Move file on request, or (2)
  // req.user.mayViewFilesFrom(uid, function(yes){
  //   if (yes) {
  //     res.sendFile('/uploads/' + uid + '/' + file);
  //   } else {
  //     res.send(403, 'Sorry! you cant see that.');
  //   }
  const IMGFOLDER = `${__dirname}/../public_html/img`;

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
  // Image uploads.
  const upload: multer.Multer = multer({
    // dest: `${__dirname}/${IMGFOLDER}`,
    dest: `${IMGFOLDER}`,
  });
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
      db.queries.findOne
        .user(req.params.username)
        .then((value: User | null) => {
          if (value) {
            let reference: any;
            if (req.params.collection == "listings") {
              reference = value.listings;
            } else if (req.params.collection == "purchases") {
              reference = value.purchases;
            }
            db.queries.findAll.item().then((items: Item[]) => {
              res.json(items.filter((i: Item) => reference.includes(i._id)));
            });
          } else {
            SPACER("Cannot find user.");
            res.send("Cannot find user.");
          }
        });
    }
  );

  http.server.post(
    "/add/item/:username",
    upload.single("image"),
    (req: Request, res: Response) => {
      let path = "";
      if (req.file) {
        path = req.file.filename ? req.file.filename : "";
      }
      db.mutations.create
        .item(req.body, path, req.params.username)
        .then((value) => {
          console.log("item created.");
          if (!__prod__) {
            SPACER("New Item Created:");
            console.dir(req.body);
          }
          res.end();
        });
    }
  );

  http.server.get("/buy/:id/:user", (req, res) => {
    db.mutations.modify
      .item(req.params.id, req.params.user)
      .then(console.log("item udpated"));
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

  /**
   * Response = (Boolean) true if successull user creation, else false
   * or null if error occurred or user already exists.
   */
  http.server.post("/register", (req: Request, res: Response) => {
    // Check if username/password combo already exists in database.
    db.queries.findAll.user().then((users: User[]) => {
      let alreadyExist = users.filter(
        (usr: User) =>
          usr.username === req.body.username &&
          usr.password === req.body.password
      );
      if (alreadyExist.length > 0) {
        res.send(false);
      } else {
      }
      // If user doesn't already exist, create new user.
      db.mutations.create
        .user({
          username: req.body.username,
          password: req.body.password,
        })
        .then(() => {
          if (!__prod__) {
            SPACER(
              `User Created - Username: ${req.body.username}  Password: ${req.body.password}`
            );
          }
          res.send(true);
        })
        .catch((reason: any) => {
          SPACER("Create-User resolver error.");
          console.log(reason);
          res.end();
        });
    });
  });

  /**
   * Response: (Boolean) true if successul login, false if user doesn't exist.
   *
   */
  http.server.post("/login", (req: Request, res: Response) => {
    db.queries.findAll.user().then((users: User[]) => {
      if (!__prod__) {
        SPACER(
          `Credentials attempted - Username : ${req.body.username} Password ${req.body.password}`
        );
      }
      let matches: User[] | null = users.filter(
        (usr) =>
          usr.username == req.body.username && usr.password == req.body.password
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
