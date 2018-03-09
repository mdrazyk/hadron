import * as fs from "fs";
import { relative } from "path";
import { to_json } from "xmljson";
import locate from "./file-locator";

const types = {
    JS: "js",
    JSON: "json",
    XML: "xml",
};

const validExtension = (path: string, extension: string) => {
    if (path.split(".")[path.split(".").length - 1] !== extension) {
        return false;
    }

    return true;
};

export const jsonLoader = (path: string) => {
    return new Promise((resolve, reject) => {
        if (path.split(".")[path.split(".").length - 1] !== types.JSON) {
            reject(new Error(`${path} don't have a ${types.JSON} extension`));
        }

        fs.readFile(path, "utf8", (err, data) => {
            err ? reject(err) : resolve(JSON.parse(data));
        });
    });
};

export const jsLoader = (path: string) => {
    return new Promise((resolve, reject) => {
        if (!validExtension(path, types.JS)) {
            reject(new Error(`${path} don't have ${types.JS} extension`));
        }

        const data = require(`./${relative(__dirname, path)}`);
        data !== null ? resolve(data()) : reject(new Error("File not found"));
    });
};

export const xmlLoader = (path: string) => {
    return new Promise((resolve, reject) => {
        if (!validExtension(path, types.XML)) {
            reject(new Error(`${path} don't have ${types.XML} extension`));
        }

        fs.readFile(path, "utf8", (err, data) => {
            if (err) {
                reject(err);
            }
            to_json(data, (jsErr: Error, jsData: string) => {
                if (err) {
                    reject(jsErr);
                }
                resolve(jsData);
            });
        });
    });
};

const mapper: any = {
    js: jsLoader,
    json: jsonLoader,
    xml: xmlLoader,
};

const extensionMapper = (paths: string[]): Array<Promise<any>> => {
    const promises: Array<Promise<any>> = [];
    paths.map((path) => {
        const ext = path.split(".")[path.split(".").length - 1];
        promises.push(mapper[ext](path));
    });

    return promises;
};

const jsonProvider = (paths: string[], configName: string, type: string, extensions: string[] = []) => {
    return locate(paths, configName, type, extensions)
    .then((locatedPaths) => Promise.all(extensionMapper(locatedPaths)))
    .then((data) => Object.assign({}, ...data));
};

export default jsonProvider;
