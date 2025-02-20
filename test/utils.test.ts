import { expect, ether, time, constants } from '../src/prelude';
import { timeIncreaseTo, fixSignature, signMessage, trackReceivedTokenAndTx, countInstructions, deployContract } from '../src/utils';
import hre from 'hardhat';
const { ethers } = hre;
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { arrayify, hexlify, toUtf8Bytes, randomBytes } from 'ethers/lib/utils';

describe('timeIncreaseTo', function () {
    const precision = 2;

    async function shouldIncrease(secs: number) {
        const timeBefore = await time.latest();
        await timeIncreaseTo(timeBefore + secs);
        const timeAfter = await time.latest();

        expect(timeAfter).to.be.gt(timeBefore);
        expect(timeAfter - timeBefore).to.be.lte(secs + precision);
        expect(timeAfter - timeBefore).to.be.gte(secs);
    }

    it('should be increased on 1000 sec', async function () {
        await shouldIncrease(1000);
    });

    it('should be increased on 2000 sec', async function () {
        await shouldIncrease(2000);
    });

    it('should be increased on 1000000 sec', async function () {
        await shouldIncrease(1000000);
    });

    it('should be thrown with increase time to a moment in the past', async function () {
        await expect(shouldIncrease(-1000)).to.be.rejectedWith(
            /Timestamp \d+ is lower than the previous block's timestamp \d+/,
        );
    });
});

describe('fixSignature', function () {
    it('should not be fixed geth sign', async function () {
        const signature =
            '0xb453386b73ba5608314e9b4c7890a4bd12cc24c2c7bdf5f87778960ff85c56a8520dabdbea357fc561120dd2625bd8a904f35bdb4b153cf706b6ff25bb0d898d1c';
        expect(signature).equal(fixSignature(signature));
    });

    it('should be fixed ganache sign', async function () {
        const signature =
            '0x511fafdf71306ff89a063a76b52656c18e9a7d80d19e564c90f0126f732696bb673cde46003aad0ccb6dab2ca91ae38b82170824b0725883875194b273f709b901';
        const v = parseInt(signature.slice(130, 132), 16) + 27;
        const vHex = v.toString(16);
        expect(signature.slice(0, 130) + vHex).equal(fixSignature(signature));
    });
});

describe('utils', function () {
    let signer1: SignerWithAddress;
    let signer2: SignerWithAddress;

    before(async function () {
        [signer1, signer2] = await ethers.getSigners();
    });

    describe('signMessage', function () {
        it('should be signed test1', async function () {
            expect(await signer1.signMessage('0x')).equal(await signMessage(signer1));
        });

        it('should be signed test2', async function () {
            const message = randomBytes(32);
            expect(await signer1.signMessage(message)).equal(await signMessage(signer1, message));
        });

        it('should be signed test3', async function () {
            const message = hexlify(toUtf8Bytes('Test message'));
            expect(await signer1.signMessage(arrayify(message))).equal(await signMessage(signer1, arrayify(message)));
        });

        it('should be signed test4', async function () {
            const message = hexlify(toUtf8Bytes('Test message'));
            expect(await signer1.signMessage(message)).equal(await signMessage(signer1, message));
        });
    });

    async function deployUSDT() {
        const TokenMock = await ethers.getContractFactory('TokenMock');
        const usdt = await TokenMock.deploy('USDT', 'USDT');
        await usdt.mint(signer1.address, ether('1000'));
        return { usdt };
    }

    describe('trackReceivedTokenAndTx', function () {
        it('should be tracked ERC20 Transfer', async function () {
            const { usdt } = await loadFixture(deployUSDT);

            const [received, tx] = await trackReceivedTokenAndTx(ethers.provider, usdt, signer2.address, () =>
                usdt.transfer(signer2.address, ether('1')),
            );
            expect(received).to.be.equal(ether('1'));
            expect(tx.from).equal(signer1.address);
            expect(tx.to).equal(usdt.address);
            expect(tx.events.length).equal(1);
            expect(tx.events[0].event).equal('Transfer');
            expect(tx.events[0].data.length).equal(66);
        });

        it('should be tracked ERC20 Approve', async function () {
            const { usdt } = await loadFixture(deployUSDT);

            const [received, tx] = await trackReceivedTokenAndTx(ethers.provider, usdt, signer2.address, () =>
                usdt.approve(signer2.address, ether('1')),
            );
            expect(received).to.be.equal('0');
            expect(tx.from).equal(signer1.address);
            expect(tx.to).equal(usdt.address);
            expect(tx.events.length).equal(1);
            expect(tx.events[0].event).equal('Approval');
            expect(tx.events[0].data.length).equal(66);
        });
    });

    describe('trackReceivedToken', function () {
        it('should be tracked ERC20 Transfer', async function () {
            const { usdt } = await loadFixture(deployUSDT);

            const [received] = await trackReceivedTokenAndTx(ethers.provider, usdt, signer2.address, () =>
                usdt.transfer(signer2.address, ether('1')),
            );
            expect(received).to.be.equal(ether('1'));
        });

        it('should be tracked ERC20 Approve', async function () {
            const { usdt } = await loadFixture(deployUSDT);

            const [received] = await trackReceivedTokenAndTx(ethers.provider, usdt, signer2.address, () =>
                usdt.approve(signer2.address, ether('1')),
            );
            expect(received).to.be.equal('0');
        });
    });

    describe('countInstructions', function () {
        it('should be counted ERC20 Transfer', async function () {
            const { usdt } = await loadFixture(deployUSDT);

            const [, tx] = await trackReceivedTokenAndTx(ethers.provider, usdt, signer2.address, () =>
                usdt.transfer(signer2.address, ether('1')),
            );
            if (hre.__SOLIDITY_COVERAGE_RUNNING === undefined) {
                expect(await countInstructions(ethers.provider, tx.events[0].transactionHash, ['STATICCALL', 'CALL', 'SSTORE', 'SLOAD'])).to.be.deep.equal([
                    0, 0, 2, 2,
                ]);
            }
        });

        it('should be counted ERC20 Approve', async function () {
            const { usdt } = await loadFixture(deployUSDT);

            const [, tx] = await trackReceivedTokenAndTx(ethers.provider, usdt, signer2.address, () =>
                usdt.approve(signer2.address, ether('1')),
            );
            if (hre.__SOLIDITY_COVERAGE_RUNNING === undefined) {
                expect(await countInstructions(ethers.provider, tx.events[0].transactionHash, ['STATICCALL', 'CALL', 'SSTORE', 'SLOAD'])).to.be.deep.equal([
                    0, 0, 1, 0,
                ]);
            }
        });
    });

    describe('deployContract', function () {
        it('should be deploy new contract instance', async function () {
            const token = await deployContract('TokenMock', ['SomeToken', 'STM']);
            expect(token.address).to.be.not.eq(constants.ZERO_ADDRESS);
            expect(await token.name()).to.be.eq('SomeToken');
        });


        it('should be using without arguments', async function () {
            const weth = await deployContract('WETH');
            expect(weth.address).to.be.not.eq(constants.ZERO_ADDRESS);
            expect(await weth.name()).to.be.eq('Wrapped Ether');
        });
    });
});
