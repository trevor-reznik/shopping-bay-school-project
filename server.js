import { model, Schema, connect } from "mongoose";
import { json, urlencoded } from "body-parser";
import { __prod__ } from "./constants";
import express from "express";
import cors from "cors";
class EbayDatabase {
    constructor(verboseMsg) {
        this.itemSchema = new Schema({
            title: String,
            description: String,
            image: String,
            price: Number,
            stat: String,
        });
        this.userSchema = new Schema({
            username: { type: String, required: true },
            password: { type: String, required: true },
            listings: [String],
            purchases: [String],
        });
        this.itemModel = model("item", this.itemSchema);
        this.userModel = model("user", this.userSchema);
        this.verbose = verboseMsg;
        this.mutations = {
            create: {
                user: async (credentials) => {
                    if (this.verbose) {
                        this.verbose("Credentials passed to createUser Resolver:");
                        console.log("Username:", credentials.username, "Password:", credentials.password);
                    }
                    const mutation = new this.userModel({
                        username: credentials.username,
                        password: credentials.password,
                        listing: ["none"],
                        purchases: ["none"],
                    });
                    await mutation.save();
                },
                item: async (item, username) => {
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
                    if (user) {
                        user.listings.push(mutation._id);
                        await user.save();
                    }
                },
            },
            modify: {
                user: async (credentials) => {
                    await this.userModel
                        .updateOne({
                        username: credentials.username,
                        password: credentials.password,
                    })
                        .exec();
                },
                item: async (item) => {
                    await this.itemModel.updateOne(item).exec();
                },
            },
        };
        this.queries = {
            findOne: {
                user: async (user) => {
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
        this.bindMiddleware = (middlewareArray) => {
            for (const handler of middlewareArray) {
                this.server.use(handler);
            }
        };
        this.server = express();
        this.server.use(express.static(staticFolder));
        this.server.use(express.json());
        this.server.get("/", (req) => {
            if (!__prod__) {
                console.dir(req);
            }
        });
    }
}
const ostaa = () => {
    const PORT = __prod__ ? 80 : 5000;
    const IP = __prod__ ? "143.198.57.139" : "127.0.0.1";
    const GAP = "\n\n\n\n";
    const SPACER = (title = "section break") => console.log(`${GAP}___ ${title} ___ ${GAP}`);
    const dbConfig = {
        name: "ostaa",
        port: 27017,
        modelNames: ["user", "item"],
    };
    connect(`mongodb://localhost:${dbConfig.port}/${dbConfig.name}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then((value) => {
        if (!__prod__) {
            SPACER("Mongoose Client Constructed");
            console.dir(value);
        }
    });
    const db = new EbayDatabase(SPACER);
    const http = new ExpressServer();
    const middleware = [cors(), json(), urlencoded({ extended: true })];
    http.bindMiddleware(middleware);
    http.server.post("/add/user", (req, res) => {
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
            .catch((reason) => {
            SPACER("User create resolver error.");
            console.log(reason);
        });
        res.end();
    });
    http.server.get("/register", (req, res) => {
        db.mutations.create
            .user({
            username: req.body.username,
            password: req.body.password,
        })
            .then(() => {
            console.log("user created.");
        })
            .catch((reason) => {
            SPACER("User create resolver error.");
            console.log(reason);
        });
        res.end();
    });
    http.server.get("/get/users", (req, res) => {
        db.queries.findAll.user().then((value) => {
            res.json(value);
        });
    });
    http.server.get("/get/items", (req, res) => {
        db.queries.findAll.item().then((value) => {
            res.json(value);
        });
    });
    http.server.get("/get/:collection/:username", (req, res) => {
        db.queries.findOne.user(req.params.username).then((value) => {
            if (value) {
                if (req.params.collection == "listings") {
                    res.send(value.listings);
                }
                if (req.params.collection == "purchases") {
                    res.send(value.purchases);
                }
            }
            else {
                SPACER("Cannot find user.");
                res.send("Cannot find user.");
            }
        });
    });
    http.server.post("/add/item/:username", (req, res) => {
        db.mutations.create.item(req.body, req.params.username).then((value) => {
            console.log("item created.");
            if (!__prod__) {
                SPACER("New Item Created:");
                console.dir(req.body);
            }
            res.end();
        });
    });
    http.server.get("/search/:collection/:keyword", (req, res) => {
        if (req.params.collection == "users") {
            db.queries.findAll.user().then((users) => {
                res.json(users.filter((usr) => usr.username && usr.username.includes(req.params.keyword)));
            });
        }
        if (req.params.collection == "items") {
            db.queries.findAll.item().then((items) => {
                res.json(items.filter((item) => item.description &&
                    item.description.includes(req.params.keyword)));
            });
        }
    });
    http.server.get("/login", (req, res) => {
        db.queries.findAll.user().then((users) => {
            if (!__prod__) {
                SPACER(`Query: ${req.query}`);
            }
            let matches = users.filter((usr) => usr.username == req.query.username &&
                usr.password == req.query.password);
            if (matches.length > 0) {
                res.send(true);
            }
            else {
                res.send(false);
            }
        });
    });
    http.server.listen(PORT, () => {
        if (!__prod__) {
            SPACER(`Listening at ${IP} on port ${PORT}.`);
        }
    });
};
ostaa();
//# sourceMappingURL=server.js.map