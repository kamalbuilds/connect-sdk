import { expect, test } from '@jest/globals';
import '../mocks/ethers';

import {
  ChainName,
  chainToPlatform,
  chains,
  chainConfigs,
  testing,
  supportsTokenBridge,
  supportsAutomaticTokenBridge,
  DEFAULT_NETWORK,
} from '@wormhole-foundation/connect-sdk';
import { EvmPlatform } from '../../src/platform';

import { getDefaultProvider } from 'ethers';

const EVM_CHAINS = chains.filter((c) => chainToPlatform(c) === 'Evm');

const network = DEFAULT_NETWORK;
const configs = chainConfigs(network);

describe('EVM Platform Tests', () => {
  describe('Parse Address', () => {
    const p = EvmPlatform.setConfig(network, {});
    test.each(EVM_CHAINS)('Parses Address for %s', (chain: ChainName) => {
      const address = testing.utils.makeNativeAddressHexString(chain);
      const parsed = p.parseAddress(chain, address);
      expect(parsed).toBeTruthy();
      expect(parsed.toNative().toString().toLowerCase()).toEqual(
        '0x' + address,
      );
    });
  });

  describe('Get Token Bridge', () => {
    test('No RPC', async () => {
      const p = EvmPlatform;
      const rpc = getDefaultProvider('');
      expect(() => p.getTokenBridge(rpc)).rejects.toThrow();
    });
    test('With RPC', async () => {
      const p = EvmPlatform.setConfig(network, {
        [EVM_CHAINS[0]]: configs[EVM_CHAINS[0]],
      });

      const rpc = getDefaultProvider('');

      if (!supportsTokenBridge(p)) throw new Error('Fail');

      const tb = await p.getTokenBridge(rpc);
      expect(tb).toBeTruthy();
    });
  });

  describe('Get Automatic Token Bridge', () => {
    test('No RPC', async () => {
      const p = EvmPlatform.setConfig(network, {});
      const rpc = getDefaultProvider('');
      if (!supportsAutomaticTokenBridge(p)) throw new Error('Fail');
      expect(() => p.getAutomaticTokenBridge(rpc)).rejects.toThrow();
    });
    test('With RPC', async () => {
      const p = EvmPlatform.setConfig(network, {
        [EVM_CHAINS[0]]: configs[EVM_CHAINS[0]],
      });

      const rpc = getDefaultProvider('');
      if (!supportsAutomaticTokenBridge(p)) throw new Error('Fail');
      const tb = await p.getAutomaticTokenBridge(rpc);
      expect(tb).toBeTruthy();
    });
  });

  describe('Get Chain', () => {
    test('No conf', () => {
      // no issues just grabbing the chain
      const p = EvmPlatform.setConfig(network, {});
      expect(p.conf).toEqual({});
      const c = p.getChain(EVM_CHAINS[0]);
      expect(c).toBeTruthy();
    });

    test('With conf', () => {
      const p = EvmPlatform.setConfig(network, {
        [EVM_CHAINS[0]]: configs[EVM_CHAINS[0]],
      });
      expect(() => p.getChain(EVM_CHAINS[0])).not.toThrow();
    });
  });

  describe('Get RPC Connection', () => {
    test('No conf', () => {
      const p = EvmPlatform.setConfig(network, {});
      expect(p.conf).toEqual({});

      // expect getRpc to throw an error since we havent provided
      // the conf to figure out how to connect
      expect(() => p.getRpc(EVM_CHAINS[0])).toThrow();
      expect(() => p.getChain(EVM_CHAINS[0]).getRpc()).toThrow();
    });

    test('With conf', () => {
      const p = EvmPlatform.setConfig(network, {
        [EVM_CHAINS[0]]: {
          rpc: 'http://localhost:8545',
        },
      });
      expect(() => p.getRpc(EVM_CHAINS[0])).not.toThrow();
      expect(() => p.getChain(EVM_CHAINS[0]).getRpc()).not.toThrow();
    });
  });
});
