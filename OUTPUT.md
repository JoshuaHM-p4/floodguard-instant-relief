curl "<https://friendbot.stellar.org?addr=GAYL4JZA2YD66JQUQFDFPYHW5WNVOIH7H57NG2FC4JYQX2TZUW2YG76D>"

```bash
stellar keys fund admin --network testnet
>>>Account admin funded on "Test SDF Network ; September 2015"

stellar keys fund resident --network testnet
>>Account resident funded on "Test SDF Network ; September 2015"

stellar contract id asset --asset native --network testnet
>>> CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

```bash
root@morphvm:~/connector/project/contract# 
root@morphvm:~/connector/project/contract# stellar contract invoke \
>   --id CCFXSYP6I2WHNXZ472KGRAO7W4UGPLM5XQUUEYSWD2YCA4IYRURBZ3UO \
>   --source-account admin \
>   --network testnet \
>   -- \
>   init \
>   --admin admin \
>   --usdc_token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
ℹ️  Simulating transaction…
ℹ️  Signing transaction: 6a4d1c19b434fe6c215466228bbdbdec65a321e49490841ead660d94ddb4c283
🌎 Sending transaction…
✅ Transaction submitted successfully!
🔗 https://stellar.expert/explorer/testnet/tx/
```

cargo test

stellar keys generate --global my-key --network testnet
stellar keys address my-key

stellar keys fund my-key --network testnet

Build contract:
cargo build --target wasm32-unknown-unknown --release

Confirm WASM file exists
ls target/wasm32-unknown-unknown/release/*.wasm

Optimize WASM
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/floodguard_relief.wasm

Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/floodguard_relief.optimized.wasm \
  --source admin \
  --network testnet

```bash
stellar contract invoke \
  --id CCZUEHXZLHRFDMWRPX3KIEJWF4ZHIGDVBQ3PEM7IXOEXT2D6XXAQPK7Y \
  --source-account admin \
  --network testnet \
  -- \
  init \
  --admin admin \
  --usdc_token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```
