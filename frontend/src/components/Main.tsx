import React, { useContext, useEffect, useRef, useState } from "react";
import { DecentragramContext } from "../hardhat/SymfoniContext";
import { BigNumber, utils } from "ethers";
import { Jazzicon } from '@ukstv/jazzicon-react';

//Declare IPFS
const ipfsClient = require('ipfs-http-client');
const IPFS_API_HOST = process.env.REACT_APP_IPFS_API_HOST;
const IPFS_HOST = process.env.REACT_APP_IPFS_HOST;
const IPFS_PORT = process.env.REACT_APP_IPFS_PORT;
const INFURA_PROJECT_ID = process.env.REACT_APP_INFURA_PROJECT_ID;
const INFURA_PROJECT_SECRET = process.env.REACT_APP_INFURA_PROJECT_SECRET;

// Infura Auth Header
const auth = 'Basic ' + Buffer.from(INFURA_PROJECT_ID + ':' + INFURA_PROJECT_SECRET).toString('base64');

interface IImage {
  id: BigNumber;
  hash: string;
  description: string;
  tipAmount: BigNumber;
  author: string;
  0: BigNumber;
  1: string;
  2: string;
  3: BigNumber;
  4: string;
};

function Main() {
  const decentragramCtx = useContext(DecentragramContext);
  const [description, setDescription] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const ethTxt = useRef<HTMLDivElement[]>([]);
  const [imageCount, setImageCount] = useState(0);
  const [images, setImages] = useState<IImage[]>([]);
  const [buffer, setBuffer] = useState<string | ArrayBuffer | null>();


  useEffect(() => {
    const initalizeCount = async () => {
      if (decentragramCtx.instance) {
        const _imageCount = await (await decentragramCtx.instance.imageCount()).toNumber();
        setImageCount(_imageCount);
      }
    };
    initalizeCount();

  }, [decentragramCtx.instance]);

  useEffect(() => {
    const initializeImages = async () => {
      if (decentragramCtx.instance) {
        const _images: IImage[] = [];
        for (var i = imageCount; i >= 1; i--) {
          const image = await decentragramCtx.instance.images(i);
          _images.push(image);
        }
        setImages(_images);
      }
    };
    initializeImages();
  }, [decentragramCtx.instance, imageCount]);

  const captureFile = (event: React.FormEvent) => {
    event.preventDefault();
    const file = (event.target as HTMLInputElement).files![0];
    const reader = new window.FileReader();
    reader.onloadend = () => {
      setBuffer(Buffer.from(reader.result!));
    };
    reader.readAsArrayBuffer(file);
  };

  const uploadImage = async (description: string) => {
    console.log("Submitting file to ipfs...");
    const ipfs = await ipfsClient.create({
      host: IPFS_API_HOST, port: IPFS_PORT, protocol: 'http'
    });
    // adding file to the IPFS
    console.log(buffer);
    let ipfsId = "";
    ipfs.add(buffer).then((response: any) => {
      ipfsId = response.path;
      updateContract(ipfsId);
    });

    const updateContract = async (hash: string) => {
      if (decentragramCtx.instance) {
        console.log("Submitting to the contract", ipfsId, description);
        const uploadTx = await decentragramCtx.instance.uploadImage(hash, description);
        await uploadTx.wait();
        setImageCount(imageCount + 1);
      }

      setDescription("");
      if (fileInput.current) { fileInput.current.value = ""; }
    };
  };

  const tipImageOwner = async (id: BigNumber, tipAmount: string) => {
    if (decentragramCtx.instance) {
      await decentragramCtx.instance.tipImageOwner(id, { value: utils.parseEther(tipAmount) });

    }
  };

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main
          role="main"
          className="col-lg-12 ml-auto mr-auto"
          style={{ maxWidth: "500px" }}
        >
          <div className="content mr-auto ml-auto">
            <p>&nbsp;</p>
            <h2>Share Image</h2>
            <form className="imageForm"
              onSubmit={(event) => {
                event.preventDefault();
                uploadImage(description);
              }}
            >
              <input type="file" accept="image/*" onChange={captureFile} ref={fileInput} />
              <div className="form-group mr-sm-2">
                <br></br>
                <input
                  id="imageDescription"
                  type="text"
                  className="form-control"
                  placeholder="Image description..."
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg">Upload!</button>
            </form>
            <p>&nbsp;</p>

            <p>&nbsp;</p>
            {images.map((image, key) => {
              return (
                <div className="card mb-4" key={key} >
                  <div className="card-header">
                    <div className="d-inline-block align-top"
                      style={{ width: '30px', height: '30px' }}>
                      <Jazzicon address={image.author} className='mr-2' />
                    </div>
                    <small className="text-muted">{image.author}</small>
                  </div>
                  <ul id="imageList" className="list-group list-group-flush">
                    <li className="list-group-item">
                      <p className="text-center"><img src={`http://${IPFS_HOST}:${IPFS_PORT}/ipfs/${image.hash}`} style={{ maxWidth: '420px' }} /></p>
                      <p>{image.description}</p>
                    </li>
                    <li key={key} className="list-group-item py-2">
                      <small className="float-left mt-1 text-muted">
                        TIPS: <div ref={el => (ethTxt.current = [...ethTxt.current, el!])} >{utils.formatEther(image.tipAmount.toString())}</div> ETH
                      </small>
                      <button
                        className="btn btn-link btn-sm float-right pt-0"
                        onClick={() => {
                          let tipAmount = '0.1';
                          tipImageOwner(image.id, tipAmount);
                          console.log(ethTxt.current[key]);
                          const totalTip = utils.parseEther(ethTxt.current[key].innerText).add(utils.parseEther(tipAmount));
                          ethTxt.current[key].innerText = utils.formatEther(totalTip.toString());
                        }}
                      >
                        TIP 0.1 ETH
                      </button>
                    </li>

                  </ul>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
export default Main;
