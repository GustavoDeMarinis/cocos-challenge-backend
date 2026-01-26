import { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { portfolioPaths } from "./portfolio/portfolio.swagger";
import { instrumentPaths } from "./instrument/instrument.swagger";

export const swaggerDocument = {
  openapi: "3.0.1",
  info: {
    version: "1.0.0",
    title: "Cocos Challenge API",
    description: "Backend API for Cocos Challenge",
    termsOfService: "",
  },
  servers: [
    {
      url: "http://localhost:5000/",
      description: "Local server",
    },
  ],
  paths: {
    ...portfolioPaths,
    ...instrumentPaths,
  },
};

export const apiDocsMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const allowedEnvs = ["local"];
  if (allowedEnvs.includes(config.ENV)) {
    next();
  } else {
    res.status(404).send("Not Found");
  }
};
