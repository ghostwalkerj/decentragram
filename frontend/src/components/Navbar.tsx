import React, { useContext } from 'react';
import photo from '../photo.png';
import { CurrentAddressContext } from "../hardhat/SymfoniContext";
import { Jazzicon } from '@ukstv/jazzicon-react';

function Navbar() {
  const [address, setAddress] = useContext(CurrentAddressContext);

  window.ethereum.on('accountsChanged', (accounts: any) => {
    console.log(accounts);
    setAddress(accounts[0]);
  });



  return (
    <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
      <div
        className="navbar-brand col-sm-3 col-md-2 mr-0"

      >
        <img src={photo} width="30" height="30" className="d-inline-block align-top" alt="" />
        Decentragram
      </div>
      <ul className="navbar-nav px-3">
        <li className="nav-item text-nowrap d-none d-sm-none d-sm-block ">
          <span className="navbar-text">
            <small>
              {address}
            </small>
            <div className="d-inline-block align-top"  >
              {address

                ? <div
                  style={{ width: '30px', height: '30px' }}>
                  <Jazzicon address={address} className='ml-2' />

                </div>
                : <span></span>
              }

            </div>
          </span>

        </li>
      </ul>
    </nav>
  );
}

export default Navbar;