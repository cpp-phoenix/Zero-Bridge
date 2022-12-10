import { ConnectButton } from '@rainbow-me/rainbowkit';
import { NavLink as Link } from 'react-router-dom';

function Navbar () {
    return (
        <div className="bg-black-600 flex items-center justify-between w-full h-20 px-12 border-b border-black-600">
            <Link className="font-semibold text-4xl text-white" to='/'>
                Zero-Bridge
            </Link>
            <div className="space-x-40 text-white">
                <Link className="font-semibold text-lg" to='/'>Bridge</Link>
                <Link className="font-semibold text-lg" to='/pools'>Liquidity</Link>
                {/* <Link className="font-semibold text-lg" to='/stats'>Analytics</Link> */}
            </div>
            <div className="">
                <ConnectButton chainStatus="icon" showBalance={false}/>
            </div>
        </div>
    )
}

export default Navbar;