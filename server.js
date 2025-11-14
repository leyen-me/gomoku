// 自定义服务器，集成 Next.js 和 Socket.io
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import os from 'os';
import initializeSocketServer from './server/socket-server.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // 监听所有网络接口，支持局域网访问
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // 初始化 Socket.io 服务器
  initializeSocketServer(httpServer);

  httpServer.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> 服务器运行在 http://${hostname}:${port}`);
    console.log(`> 局域网访问: http://${getLocalIP()}:${port}`);
  });
});

// 获取本机IP地址
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

