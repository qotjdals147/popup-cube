import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type StoreJoinRequest, type StoreJoinResponse } from '@popup-cube/shared';

/**
 * Thin wrapper around socket.io-client so both web and future mobile app
 * talk to the channeling server the same way. Phaser scenes (Phase 2) will
 * consume this instead of calling socket.io-client directly.
 */
export function createGameSocket(serverUrl: string): Socket {
  return io(serverUrl, { transports: ['websocket'] });
}

export function joinStore(
  socket: Socket,
  request: StoreJoinRequest
): Promise<StoreJoinResponse> {
  return new Promise((resolve) => {
    socket.emit(SOCKET_EVENTS.STORE_JOIN, request, (response: StoreJoinResponse) => {
      resolve(response);
    });
  });
}
