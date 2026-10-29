/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import { describe, it, expect, vi } from 'vitest';
import { client, connectToMongoDB, disconnectFromMongoDB } from '../src/common/mongodb.js';

describe('MongoDB Connection Module', () => {
  it('exports client and connection functions', () => {
    expect(client).toBeDefined();
    expect(typeof connectToMongoDB).toBe('function');
    expect(typeof disconnectFromMongoDB).toBe('function');
  });

  it('connects and disconnects successfully using MongoClient', async () => {
    const connectSpy = vi.spyOn(client, 'connect').mockResolvedValue(client as any);
    const closeSpy = vi.spyOn(client, 'close').mockResolvedValue(undefined as any);

    const connectedClient = await connectToMongoDB();
    expect(connectSpy).toHaveBeenCalled();
    expect(connectedClient).toBe(client);

    await disconnectFromMongoDB();
    expect(closeSpy).toHaveBeenCalled();

    connectSpy.mockRestore();
    closeSpy.mockRestore();
  });
});
