import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to game server');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from game server');
      setConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return { socket: socketRef.current, connected };
};
