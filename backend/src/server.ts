import http from "http";
import events from "events";
import express from "express";
import cors from "cors";
import { DidResolver, MemoryCache } from "@atproto/did-resolver";
import { IdResolver } from "@atproto/identity";
import { createDb, Database } from "./db";
import { BskyAgent } from "@atproto/api";
import { validateAuth, validateAuthDecode } from "./auth";

export const getDateTime = (date?: number | Date) => {
  if (!date) return new Date().toISOString().slice(0, 19).replace("T", " ");
  return new Date(date).toISOString().slice(0, 19).replace("T", " ");
};

export type AppContext = {
  db: Database;
  didResolver: DidResolver;
  cfg: Config;
  api: BskyAgent;
  log: (text: string) => void;
};

declare global {
  namespace Express {
    export interface Request {
      requesterDid: string;
    }
  }
}

export type Config = {
  port: number;
  listenhost: string;
  hostname: string;
  bskyIdentifier: string;
  bskyPassword: string;
  mysqlDatabase: string;
  mysqlHost: string;
  mysqlPort: number;
  mysqlUser: string;
  mysqlPassword: string;
};

export class Server {
  public app: express.Application;
  public server?: http.Server;
  public db: Database;
  public cfg: Config;
  public api: BskyAgent;

  constructor(
    app: express.Application,
    db: Database,
    cfg: Config,
    api: BskyAgent
  ) {
    this.app = app;
    this.db = db;
    this.cfg = cfg;
    this.api = api;
  }

  static async create(cfg: Config) {
    const app = express();
    const idResolver = new IdResolver();
    const db = createDb(
      cfg.mysqlDatabase,
      cfg.mysqlHost,
      cfg.mysqlPort,
      cfg.mysqlUser,
      cfg.mysqlPassword
    );
    const api = new BskyAgent({ service: "https://bsky.social" });
    await api.login({
      identifier: cfg.bskyIdentifier,
      password: cfg.bskyPassword,
    });

    const didCache = new MemoryCache();
    const didResolver = new DidResolver(
      { plcUrl: "https://plc.directory" },
      didCache
    );

    app.use(cors(), function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      next();
    });
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    app.use("/", async (req, res, next) => {
      const requesterDid = await validateAuthDecode(req);
      if (!requesterDid) return res.status(401).end();
      req.requesterDid = requesterDid;
      next();
    });

    app.get("/", async (req, res) => {
      try {
        const query = await db
          .selectFrom("messages")
          .selectAll()
          .where("userDid", "=", req.requesterDid)
          .orderBy("indexedAt", "desc")
          .execute();

        return res.json(query);
      } catch {
        return res.send({ success: false, error: "An error ocurred" });
      }
    });

    app.post("/", async (req, res) => {
      const message = req.body.message as string;
      const userHandle = req.body.user as string;
      const userDid = await idResolver.handle.resolve(userHandle);

      if (!userDid)
        return res.send({ success: false, error: "User not found" });
      if (!message || message.length === 0) {
        return res.send({ success: false, error: "Message is empty" });
      }

      try {
        const now = Date.now();
        const id = `${now}::${userDid}`;

        await db
          .insertInto("messages")
          .values({
            id: id,
            userDid: userDid,
            userHandle: userHandle,
            message: message,
            indexedAt: getDateTime(now),
          })
          .execute();
        return res.send({ success: true });
      } catch {
        return res.send({ success: false, error: "An error ocurred" });
      }
    });

    app.delete("/", async (req, res) => {
      const { id: id } = req.query;

      try {
        await db
          .deleteFrom("messages")
          .where("id", "=", id as string)
          .execute();

        res.send({ success: true });
      } catch {
        res.send({ success: false, error: "An error ocurred" });
      }
    });

    app.use((req, res, next) => {
      res.status(404).send("Error 404");
    });

    return new Server(app, db, cfg, api);
  }

  async start(): Promise<http.Server> {
    this.server = this.app.listen(this.cfg.port, this.cfg.listenhost);
    await events.once(this.server, "listening");
    return this.server;
  }
}

export default Server;
