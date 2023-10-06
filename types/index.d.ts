declare interface Window {
  $dialog: import("naive-ui/es/dialog/src/DialogProvider").DialogApiInjection;
  $message: import('naive-ui/es/message/src/MessageProvider').MessageApiInjection;
  $notification: import('naive-ui/es/notification/src/NotificationProvider').NotificationApiInjection;
}
declare type MyObj = {
  [key: string]: any;
};

declare interface ProxyItem extends MyObj {
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
declare type Proxy = ProxyItem[];

declare interface ProxyDataItem extends MyObj {
  Name?: string;
  port?: number;
  enable?: boolean;
  proxy: Proxy;
  uuidKey?: string;
}
declare type ProxyData = ProxyDataItem[];

declare type StateItem = { port?: number; code?: number; msg?: string; path?: string[], uuidKey?: string, Name?: string }

declare type State = StateItem[];