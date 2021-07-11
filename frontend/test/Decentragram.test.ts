import { ethers } from "hardhat";
import chai, { assert } from "chai";
import chaiAsPromised from "chai-as-promised";
import { Decentragram } from "../src/hardhat/typechain/Decentragram";
import { Decentragram__factory } from "../src/hardhat/typechain/factories/Decentragram__factory";
import { BigNumber, Overrides, Signer } from "ethers";
import { solidity } from "ethereum-waffle";

chai.use(chaiAsPromised);
chai.use(solidity);
const { expect } = chai;
let decentragram: Decentragram;
let signers: Signer[];
let authorAddress: string;
let tipperAddress: string;
let imageCount: BigNumber;
let author: Signer;
let tipper: Signer;

describe("Decentragram", () => {

  beforeEach(async () => {
    signers = await ethers.getSigners();
    author = signers[0];
    authorAddress = await author.getAddress();
    tipper = signers[1];
    tipperAddress = await tipper.getAddress();

    const decentragramFactory = (await ethers.getContractFactory(
      "Decentragram",
      author
    )) as Decentragram__factory;

    decentragram = await decentragramFactory.deploy();
    await decentragram.deployed();
    expect(decentragram.address).to.properAddress;
  });

  it('has a name', async () => {
    const name = await decentragram.name();
    expect(name).to.eq('Decentragram');
  });

  it('creates images', async () => {
    const hash = 'abc123';
    const trx = await decentragram.uploadImage(hash, 'Image description', { from: authorAddress } as Overrides);
    await trx.wait();
    const eventFilter = decentragram.filters.ImageCreated(null);
    const event = await decentragram.queryFilter(eventFilter);

    imageCount = await decentragram.imageCount();
    assert.equal(imageCount.toNumber(), 1);
    //console.log(event[0].args);
  });

  it('fails a bad hash', async () => {
    expect(decentragram.uploadImage('', 'Image description', { from: authorAddress } as Overrides)).to.eventually.be.rejected;
  });

  it('fails a bad description', async () => {
    expect(decentragram.uploadImage('hash', '', { from: authorAddress } as Overrides)).to.eventually.be.rejected;
  });

  it('allows users to tip images', async () => {
    const hash = 'abc123';
    await decentragram.uploadImage(hash, 'Image description', { from: authorAddress } as Overrides);
    const oldAuthorBalance = await ethers.provider.getBalance(authorAddress);

    decentragram = decentragram.connect(tipper);
    await decentragram.tipImageOwner(1, { value: ethers.utils.parseUnits("100.0", "ether") } as Overrides);

    const eventFilter = decentragram.filters.ImageTipped(null);
    const event = await decentragram.queryFilter(eventFilter);
    console.log(event[0].args);

    console.log(ethers.utils.formatUnits(oldAuthorBalance, "ether"));

    const newAuthorBalance = await ethers.provider.getBalance(authorAddress);

    console.log(ethers.utils.formatUnits(newAuthorBalance, "ether"));
  });

});
