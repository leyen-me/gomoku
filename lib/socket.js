// Socket.io 客户端配置
'use client';

import { io } from 'socket.io-client';

let socket = null;

export function getSocket(serverUrl = '') {
  if (!socket) {
    // 如果没有提供服务器URL，使用当前主机
    const url = serverUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

