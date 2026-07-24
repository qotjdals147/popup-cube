import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type StoreJoinRequest, type StoreJoinResponse } from '@popup-cube/shared';

/**
 * Thin wrapper around socket.io-client so both web and future mobile app
 * talk to the channeling server the same way. Phaser scenes (Phase 2) will
 * consume this instead of calling socket.io-client directly.
 */
const JOIN_TIMEOUT_MS = 10_000;

export function createGameSocket(serverUrl: string): Socket {
  return io(serverUrl, {
    transports: ['websocket', 'polling'],
    timeout: JOIN_TIMEOUT_MS,
    reconnection: false,
  });
}

export function joinStore(
  socket: Socket,
  request: StoreJoinRequest
): Promise<StoreJoinResponse> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.off('connect_error', onConnectError);
      fn();
    };

    const timer = setTimeout(() => {
      socket.disconnect();
      finish(() => reject(new Error('실시간 서버에 연결하지 못했어요.')));
    }, JOIN_TIMEOUT_MS);

    const onConnectError = () => {
      finish(() => reject(new Error('실시간 서버에 연결하지 못했어요.')));
    };

    socket.on('connect_error', onConnectError);

    socket.emit(SOCKET_EVENTS.STORE_JOIN, request, (response: StoreJoinResponse) => {
      finish(() => resolve(response));
    });
  });
}
