from algosdk.v2client.algod import AlgodClient
from algosdk.v2client.indexer import IndexerClient

master_Wallet_mnemonic = "toss transfer sure frozen real jungle mouse inch smoke derive floor alter ten eagle narrow perfect soap weapon payment chaos amateur height estate absent cabbage"

algod_address = "https://testnet-api.algonode.cloud"
algod_token = "a" * 64
indexer_add = "https://testnet-idx.algonode.cloud"

Algod_Client = AlgodClient(algod_token, algod_address)
Indexer_Client = IndexerClient("", indexer_add)
