import { TokenTransferTransaction } from '../../src/types';
import {
  Network,
  PlatformName,
  ChainName,
} from '@wormhole-foundation/sdk-base';
import {
  ChainContext,
  Platform,
  TxHash,
  RpcConnection,
  TokenId,
  AutomaticTokenBridge,
  TokenBridge,
  UniversalAddress,
  WormholeMessageId,
  CircleBridge,
  AutomaticCircleBridge,
} from '@wormhole-foundation/sdk-definitions';
import { MockTokenBridge } from './mockTokenBridge';
import { MockChain } from './mockChain';

export class MockRpc implements RpcConnection {
  constructor(chain: ChainName) {}
  getBalance(address: string): Promise<bigint> {
    throw new Error('Method not implemented.');
  }
  broadcastTransaction(stxns: any): any {
    throw new Error('Not implemented');
  }
}

export class MockPlatform implements Platform {
  getAutomaticCircleBridge(
    rpc: RpcConnection,
  ): Promise<AutomaticCircleBridge<PlatformName>> {
    throw new Error('Method not implemented.');
  }
  // TODO: same hack as evm
  static _platform: PlatformName = 'Evm';
  readonly platform = MockPlatform._platform;

  readonly network?: Network = 'Devnet';
  getForeignAsset(
    chain: ChainName,
    rpc: RpcConnection,
    tokenId: TokenId,
  ): Promise<UniversalAddress | null> {
    throw new Error('Method not implemented.');
  }
  getTokenDecimals(
    rpc: RpcConnection,
    tokenAddr: UniversalAddress,
  ): Promise<bigint> {
    throw new Error('Method not implemented.');
  }
  getNativeBalance(rpc: RpcConnection, walletAddr: string): Promise<bigint> {
    throw new Error('Method not implemented.');
  }
  getTokenBalance(
    chain: ChainName,
    rpc: RpcConnection,
    walletAddr: string,
    tokenId: TokenId,
  ): Promise<bigint | null> {
    throw new Error('Method not implemented.');
  }
  getChain(chain: ChainName): ChainContext {
    return new MockChain(this, chain);
  }
  getRpc(chain: ChainName): RpcConnection {
    return new MockRpc(chain);
  }
  async parseTransaction(
    chain: ChainName,
    rpc: RpcConnection,
    txid: TxHash,
  ): Promise<WormholeMessageId[]> {
    throw new Error('Method not implemented');
  }
  async sendWait(rpc: RpcConnection, stxns: any[]): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  async getTokenBridge(rpc: RpcConnection): Promise<TokenBridge<PlatformName>> {
    return new MockTokenBridge();
  }
  async getAutomaticTokenBridge(
    rpc: RpcConnection,
  ): Promise<AutomaticTokenBridge<PlatformName>> {
    throw new Error('Method not implemented.');
  }
  async getCircleBridge(
    rpc: RpcConnection,
  ): Promise<CircleBridge<PlatformName>> {
    throw new Error('Method not implemented.');
  }
  async getCircleRelayer(
    rpc: RpcConnection,
  ): Promise<AutomaticCircleBridge<PlatformName>> {
    throw new Error('Method Not implemented.');
  }
  parseAddress(address: string): UniversalAddress {
    throw new Error('Method not implemented.');
  }
}