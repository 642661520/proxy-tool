import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as http from 'http';
import * as Server from 'http-proxy';
import * as net from 'net';
import * as path from 'path';
import * as httpProxy from 'http-proxy';
const isDevelopment = !app.isPackaged;
if (isDevelopment) {
    require('electron-reload')(path.join(__dirname, "../dist"));
}
const Store = require('electron-store');
type MyObj = {
  [key: string]: any;
};
interface ProxyItem extends MyObj {
  Name?: string;
  path?: string;
  target?: string;
  changeOrigin?: boolean;
  rewrite?: {
    enable?: boolean;
    value?: [string | undefined, string | undefined];
  };
  enable?: boolean;
  uuidKey?: string;
}
type Proxy = ProxyItem[];

interface ProxyDataItem extends MyObj {
  Name?: string;
  port?: number;
  enable?: boolean;
  proxy: Proxy;
  uuidKey?: string;
}
type ProxyData = ProxyDataItem[];

type StateItem = { port?: number; code?: number; msg?: string; path?: string[], uuidKey?: string, Name?: string }

type State = StateItem[];
const store = new Store()
const requireLog = () => {
  const log = require("electron-log");
  // 日志文件等级，默认值：false
  log.transports.file.level = "debug";
  // 日志控制台等级，默认值：false
  log.transports.console.level = "debug";
  // 日志文件名，默认：main.log
  log.transports.file.fileName = "main.log";
  // 日志格式，默认：[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}
  log.transports.file.format =
    "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}";
  // 日志大小，默认：1048576（1M），达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
  log.transports.file.maxSize = 1048576;
  // 日志文件位置：C:\Users\%USERPROFILE%\AppData\Roaming\Electron\logs
  // 完整的日志路径：log.transports.file.file，优先级高于 appName、fileName
  return log;
};
const log = requireLog();
const NODE_ENV = process.env.NODE_ENV;
const servers: {
  proxy: Server,
  proxyServer: http.Server,
  close: Function
}[] = [];


const closeAllProxy = (win: Electron.CrossProcessExports.BrowserWindow) => {
  servers.forEach((item) => {
    item.close();
  });
  servers.length = 0;
  win.webContents.send("update-state", []);
};
function portIsOccupied(port: number): Promise<{ isUse: boolean, msg: string }> {
  return new Promise((res, rej) => {
    const server = net.createServer();
    server.on("listening", function () {
      // 执行这块代码说明端口未被占用
      server.close(); // 关闭服务
      console.log('====================================');
      console.log('The port【' + port + '】 is available.');
      console.log('====================================');
      res({ isUse: false, msg: "The port【" + port + "】 is available." });
    });
    server.on("error", function (err) {
      console.log('====================================');
      console.log('The port【' + port + '】 is occupied, please change other port.');
      console.log('====================================');
      res({
        isUse: true,
        msg: `${err.name} Code:${(err as any).code} message:${err.message}`,
      });
    });
    server.listen(port);
  });
}
const state: State = [];
const initHttp = async (
  data: ProxyData,
  win: Electron.CrossProcessExports.BrowserWindow
) => {
  closeAllProxy(win);
  store.set("proxyData", data);

  data.forEach((item) => {
    item.proxy = item.proxy.sort((a, b) => {
      return (
        (b.path || '').split("/").filter((v) => v != "").length -
        (a.path || '').split("/").filter((v) => v != "").length
      );
    });
  });
  state.length = 0;
  for (let i = 0; i < data.length; i++) {
    const element = data[i];
    const stateItem: StateItem = {
      path: [],
      port: element.port,
      code: 1, // 0:正常 1: 异常 -1 :未启用
      uuidKey: element.uuidKey,
      Name: element.Name,
      msg: ''
    };
    if (!element.enable) {
      stateItem.code = -1;
      stateItem.msg = "未启用端口";
      state.push(stateItem);
      continue;
    }
    if (!element.port) {
      stateItem.msg = "未设置端口";
      state.push(stateItem);
      continue;
    }
    if (!element.proxy) {
      stateItem.msg = "未设置代理地址";
      state.push(stateItem);
      continue;
    }
    const status = {
      enable: 0,
      path: 0,
      target: 0,
    };
    const proxyData = element.proxy.filter((v) => {
      if (!v.enable) {
        status.enable++;
        return false;
      }
      if (!v.path) {
        status.path++;
        return false;
      }
      if (!v.target) {
        status.target++;
        return false;
      }
      (stateItem.path as string[]).push(v.path);
      return true;
    });
    if (!proxyData.length) {
      if (status.enable === element.proxy.length) {
        stateItem.msg = "未启用路径";
      } else {
        stateItem.msg = "启用路径中均存在错误！";
      }
      state.push(stateItem);
      continue;
    }
    const { isUse, msg } = await portIsOccupied(element.port);
    stateItem.code = isUse ? 1 : 0;
    stateItem.msg = msg;
    if (isUse) {
      state.push(stateItem);
      continue;
    }
    const proxy: Server = new (httpProxy as any).createProxyServer({});
    const proxyServer: http.Server = http.createServer(function (req, res) {
      let isProxy = false;
      for (let index = 0; index < proxyData.length; index++) {
        const item = proxyData[index];
        const { target, changeOrigin, rewrite, path } = item;
        if (!path) {
          continue;
        }
        if (!target) {
          continue;
        }
        if (req.url && req.url.includes(path)) {
          isProxy = true;
          if (rewrite?.enable && rewrite?.value && rewrite?.value[0] && rewrite?.value[1]) {
            req.url = req.url.replace(
              new RegExp(rewrite.value[0]),
              rewrite.value[1]
            );
          }
          proxy.web(req, res, { target, changeOrigin }, function (err) {
            res.end(`<h1>${(err as any).code}</h1>
            <div>url:${req.url}</div>
            <div>${err.name} ${err.message}</div>
            `);
          });
          return;
        }
      }
      if (!isProxy) {
        res.end(`<h1>404 Not Found</h1><div>url:${req.url}</div>`);
      }
    });
    proxyServer.on("error", (err) => {
      console.log(err);
    });
    // proxyServer.on("upgrade", function (req, socket, head) {
    //   proxy.ws(req, socket, head);
    // });
    state.push(stateItem);
    proxyServer.listen(element.port);
    servers.push({
      proxy,
      proxyServer,
      close: () => {
        proxy.close();
        proxyServer.close();
      },
    });
  }
  win.webContents.send("update-state", state);
};

const main = () => {
  const createWindow = () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        // preload: path.join(__dirname, "preload.js"),
        webSecurity: false,
      },
      // frame:false,
      icon: path.join(__dirname, "../src/assets/logo.png"),
    });
    ipcMain.on("set-proxy", (event, data) => {
      initHttp(data, win);
    });

    ipcMain.on("close-proxy", () => {
      closeAllProxy(win);
    });
    win.loadURL(
      // `file://${path.join(__dirname, "../dist/index.html")}`
      NODE_ENV === "development"
        ? "http://localhost:5173"
        : `file://${path.join(__dirname, "../dist/index.html")}`
    );
    // 打开开发工具
    if (NODE_ENV === "development") {
      win.webContents.openDevTools();
    }
    const data = store.get('proxyData');
    if (data) {
      initHttp(data as ProxyData, win);
    }
  };
  app.whenReady().then(() => {
    ipcMain.on("sand-log", (event, level, msg) => {
      log[level](msg);
    });
    ipcMain.handle("get-proxy", () => {
      return store.get("proxyData") || [];
    });
    ipcMain.handle("get-state", () => {
      return state
    });
    Menu.setApplicationMenu(null);
    createWindow();

  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
};
main();
