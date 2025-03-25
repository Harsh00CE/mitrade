import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';


const WalletConfigPage = () => {

    const { userId } = useParams();
    const [userWallet, setUserWallet] = useState({});

    const getchUserWallet = async () => {
        const response = await fetch(`http://157.173.219.118:3000/api/user-wallet?userId=${userId}`);

        const data = await response.json();
        setUserWallet(data.data);
        console.log("data ==> " , data);
    }

    useEffect(() => {
        getchUserWallet();
    }, [])


    return (
        <div>
            <div>
                WalletConfigPage : {userId}
            </div>
            {userWallet && <div> 
                    <div>Balance: {userWallet.balance}</div>
                    <div>Equity: {userWallet.equity}</div>
                    <div>Available: {userWallet.available}</div>
                    <div>Margin: {userWallet.margin}</div>
                    <div>Margin Level: {userWallet.marginLevel}</div>
                    <div>pl: {userWallet.pl}</div>
                </div>}
        </div>
    )
}

export default WalletConfigPage