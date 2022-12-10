import { useNetwork, useAccount, erc20ABI, useProvider, useSigner } from 'wagmi';
import { useEffect, useState } from 'react';
import { useAlert, positions } from 'react-alert';
import qs from 'qs';
import { ethers, utils } from "ethers";
import zerocoreabi from "../abis/zerocoreabi.json";

function Swap() {

    const alert = useAlert()

    const { chain, chains } = useNetwork();
    const { isConnected, address } = useAccount();
    const [toChain, setToChain] = useState("Select");
    const [toChainId, setToChainId] = useState(0);
    const [toChainSelect, toggleToChainSelect] = useState(false);
    const [swapTo, setSwapTo] = useState(0);
    const [swapFrom, setSwapFrom] = useState(0);
    const [toPayLoading, toggleToPayLoading] = useState(false);
    const [tokenFrom, setTokenFrom] = useState({
        token: "Select"
    });
    const [tokenTo, setTokenTo] = useState({
        token: "-"
    });
    const [showFromTokenList, setShowFromTokenList] = useState(false);
    const [showToTokenList, setShowToTokenList] = useState(false);
    const [protocolFee, setProtocolFee] = useState(0);
    const [gasFee, setGasFee] = useState(0);
    const [priceImpact, setPriceImpact] = useState(0);
    const { data: signer } = useSigner()

    const chainObj = {
        5: {
            chainId: 5,
            chianName: "Goerli",
            explorer: "https://goerli.etherscan.io/tx/",
            rpc: "https://goerli.infura.io/v3/",
            zeroX: "https://goerli.api.0x.org/",
            receiverContract: "0x4D4aA79d221a14D97445220299c20CFcaB678Fad",
            hashiPoolContract: "0xD92Cc54C5A7125BDd6806c3f09f9E16EbEb8A1d1",
            domain: 10121,
            tokens: [
                {
                    token: "USDT",
                    address: "0x69c9e542c9234a535b25df10e5a0f8542670d44a",
                    decimals: 18
                },
                {
                    token: "USDC",
                    address: "0x89a543c56f8fc6249186a608bf91d23310557382",
                    decimals: 18
                },
                {
                    token: "DAI",
                    address: "0x0e3b53f09f0e9b3830f7f4a3abd4be7a70713a31",
                    decimals: 18
                }
            ]
        },
        80_001: {
            chainId: 80_001,
            chianName: "Mumbai",
            explorer: "https://mumbai.polygonscan.com/tx/",
            rpc: "https://matic-mumbai.chainstacklabs.com",
            zeroX: "https://mumbai.api.0x.org/",
            receiverContract: "0xC34a2520978aC4eDC446d1C6535E6E98c06876CF",
            hashiPoolContract: "0x10786deba67ded019782e6ef8b0816f92ce9635b",
            domain: 10109,
            tokens: [
                {
                    token: "USDT",
                    address: "0x07cD0B7fC7979CFd1a76b124F551E981944eFF41",
                    decimals: 18
                },
                {
                    token: "USDC",
                    address: "0x4d344098b124fead012fc54b91f3099e1fec06f6",
                    decimals: 18
                },
                {
                    token: "DAI",
                    address: "0x8ebf563bc9a267b71b4e6055279d3cf4d3b368ee",
                    decimals: 18
                }
            ]
        },
        1_287: {
            chainId: 1_287,
            chianName: "Moonbase Alpha",
            explorer: "https://moonbase-blockscout.testnet.moonbeam.network/tx/",
            rpc: "https://rpc.testnet.moonbeam.network",
            zeroX: "https://mumbai.api.0x.org/",
            receiverContract: "0x07cD0B7fC7979CFd1a76b124F551E981944eFF41",
            hashiPoolContract: "0x4d9764c887360b732c05ad7fd3f20c1be74da5bb",
            domain: 10126,
            tokens: [
                {
                    token: "USDT",
                    address: "0x14c5f75466f4719d5d405e3ff0b7d181ce8ee1cc",
                    decimals: 18
                },
                {
                    token: "USDC",
                    address: "0x2dEcD02F465E5e60B34598A2E0F2B0a2759377FD",
                    decimals: 18
                },
                {
                    token: "DAI",
                    address: "0x9ad872caba5320ef0ed49a52f69a3d159525f485",
                    decimals: 18
                }
            ]
        }
    }

    useEffect(() => {
        
    },[chain?.id])  

    const sendTransaction = async () => {
        if(swapFrom > 0 && swapTo > 0 && toChainId > 0) {
            console.log(toChainId);
            const tokenTodd = {}
            chainObj[toChainId].tokens.filter(token => token.token === tokenTo.token).map(tokenObj => Object.assign(tokenTodd,tokenObj));
            console.log(tokenTodd);
            setTokenTo(tokenTodd);
            
            const contract = new ethers.Contract(tokenFrom.address, erc20ABI, signer);
            const allowed = await contract.allowance(address, chainObj[chain.id].receiverContract);
            let  amount = String(swapFrom * 10 ** tokenFrom.decimals);
            let txn;
            if(parseInt(allowed.toString(),18) < parseInt(amount,18)) {
                try {
                    txn = await contract.approve(chainObj[chain.id].receiverContract, amount);
                    alert.success(
                        <div>
                            <div>Transaction Sent</div>
                            <button className='text-xs' onClick={()=> window.open(chainObj[chain.id].explorer + txn.hash, "_blank")}>View on explorer</button>
                        </div>, {
                        timeout: 0,
                        position: positions.BOTTOM_RIGHT
                    });
                } catch(ex) {
                    console.log(ex);
                    alert.error(<div>Operation failed</div>, {
                        timeout: 3000,
                        position: positions.TOP_RIGHT
                    });
                }
            } else {
                const hashiPoolContract = new ethers.Contract(chainObj[chain.id].receiverContract, zerocoreabi, signer);
                try{
                    txn = await hashiPoolContract.initiateBridge(chainObj[toChainId].domain, chainObj[toChainId].receiverContract, tokenTodd.address, tokenFrom.address, amount, { value: ethers.utils.parseUnits("700000", "gwei") });
                    console.log(txn);
                    alert.success(
                        <div>
                            <div>Transaction Sent</div>
                            <button className='text-xs' onClick={()=> window.open(chainObj[chain.id].explorer + txn.hash, "_blank")}>View on explorer</button>
                        </div>, {
                        timeout: 0,
                        position: positions.BOTTOM_RIGHT
                    });
                } catch(ex) {
                    console.log(ex);
                    alert.error(<div>Operation failed</div>, {
                        timeout: 3000,
                        position: positions.TOP_RIGHT
                    });
                }
            }
        } else {
            alert.error(<div>Invalid input</div>, {
                timeout: 3000,
                position: positions.TOP_RIGHT
            });
        }
    }

    const getPrice = async (targetValue) => {
        if(targetValue > 0) {
            toggleToPayLoading(true);
            console.log(targetValue);
            setSwapFrom(targetValue);
            setSwapTo(targetValue);

            // let  amount = Number(targetValue * 10 ** tokenFrom.decimals);

            // const params = {
            //     sellToken: tokenFrom.address === "" ? tokenFrom.token : tokenFrom.address,
            //     buyToken: tokenTo.address === "" ? tokenTo.token : tokenTo.address,
            //     sellAmount: amount,
            // }

            // // Fetch the swap price.
            // const response = await fetch(
            //     `${chainObj[chain.id].zeroX}swap/v1/price?${qs.stringify(params)}`
            // );

            // const swapPriceJSON = await response.json();
            // const outputBalance = utils.formatUnits(swapPriceJSON.buyAmount, tokenTo.decimals);
            // setSwapTo(outputBalance);

            // setProtocolFee(swapPriceJSON.protocolFee)
            // const gasCost = swapPriceJSON.gas * swapPriceJSON.gasPrice;
            // console.log("Gs Cost: ", gasCost);
            // setGasFee(utils.formatEther(gasCost.toString()))
            // setPriceImpact(swapPriceJSON.estimatedPriceImpact)

            toggleToPayLoading(false);
        }   
    }


    return (
        <div className="flex flex-1 items-center justify-center h-5/6">
        {
            isConnected && 
            <div className="flex flex-col justify-between rounded-lg font-semibold w-4/12 h-4/6 bg-white">
                <div className="text-2xl mx-4 mt-4">Bridge</div>
                <div className="rounded-lg border-2 border-rounded h-[130px] mx-6 p-2">
                    <div>
                        <div>From</div>
                        <div className="flex flex-row items-center h-[75px]">
                            <div className="flex items-center justify-center px-2 py-2 mx-2 border-2 rounded-lg">
                                <div>
                                    {chain?.name}
                                </div>
                            </div>
                            <div className="flex-1 flex items-center px-2 py-1 mx-2 border-2 rounded-lg">
                                <input onChange={(e) => {getPrice(e.target.value)}} className="placeholder:text-slate-400 block bg-white w-full py-2 pl-2 pr-3 shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 sm:text-sm" placeholder="" type="number" name="toAmount"/>       
                            </div>
                            <div className="flex items-center px-2 py-2 mx-2 border-2 rounded-lg">
                                {showFromTokenList && 
                                    <div className="absolute rounded-lg border bg-white mt-40 p-2 px-4">
                                        {
                                            (chainObj[chain.id].tokens.filter(token => token.address !== tokenTo.address).map(token => <div onClick={() => {setShowFromTokenList(!showFromTokenList); setTokenFrom(token); setTokenTo(token)}} className="hover:cursor-pointer" >{token.token}</div>))
                                        }
                                    </div>
                                }
                                <div onClick={() => setShowFromTokenList(!showFromTokenList)} className="hover:cursor-pointer">
                                    {tokenFrom.token} v
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border-2 border-rounded h-[130px] mx-6 p-2">
                    <div>
                        <div>To</div>
                        { toChainSelect && 
                            <div className="absolute rounded-lg bg-white border-2 mt-16 mx-2 w-content">
                                { 
                                    chains.filter((chainss) => chainss.id !== chain.id).map((chain) => <div onClick={() => {setToChain(chain.name); setToChainId(chain?.id); toggleToChainSelect(!toChainSelect)}} className="flex justify-center py-2 px-2 hover:bg-gray-100 hover:cursor-pointer">{chain.name}</div>)
                                }
                            </div>
                        }
                        
                        <div className="flex flex-row items-center justify-center h-[75px] hover:cursor-pointer">
                            <div onClick={() => toggleToChainSelect(!toChainSelect)} className="flex items-center justify-center px-2 py-2 mx-2 border-2 rounded-lg">
                                <div>
                                    {toChain} v
                                </div>
                            </div>
                            <div className="flex-1 flex items-center px-2 py-2 mx-2 border-2 rounded-lg">
                                {swapTo}
                            </div>
                            <div className="flex items-center px-2 py-2 mx-2 border-2 rounded-lg">
                                {/* {showToTokenList && 
                                    <div className="absolute rounded-lg border bg-white mt-40 p-2 px-4">
                                        {
                                            (chainObj[toChainId].tokens.filter(token => token.address !== tokenFrom.address).map(token => <div onClick={() => {setShowToTokenList(!showToTokenList); setTokenTo(token)}} className="hover:cursor-pointer" >{token.token}</div>))
                                        }
                                    </div>
                                } */}
                                <div>
                                    {tokenTo.token}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* <div className="rounded-lg border border-rounded h-[120px] mx-6 p-2">
                    <div>
                        <div>You Pay</div>
                        <div className="animate-pulse p-1 flex flex-row items-center justify-center h-[75px]">
                            { toPayLoading && <div class="rounded-lg w-full h-full bg-slate-300"></div> }
                        </div>
                    </div>
                </div> */}
                <button onClick={() => sendTransaction()} className="w-full text-xl rounded-b-lg text-white py-4 bg-black">Initiate</button>
            </div>
        }
        </div>
    )
}
export default Swap;