import { useNetwork, useAccount } from 'wagmi';

function Stats() {
    const { chain, chains } = useNetwork();
    const { isConnected } = useAccount();
    return (
        <div className="flex flex-1 items-center justify-center h-5/6">
        {
            isConnected && 
            <div className="w-4/12 h-4/6 bg-white">

            </div>
        }
        </div>
    )
}
export default Stats;