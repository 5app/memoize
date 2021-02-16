const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Extend Chai
chai.use(chaiAsPromised);

const {expect} = chai;

const memoize = require('../../index.js');

describe('memoize', () => {
	beforeEach(() => {
		delete process.env.MEMOIZE_DISABLED;
	});

	it('should decorate a function and return a function', () => {
		const mem = memoize(() => {});
		expect(mem).to.be.a('function');
	});
	it('should prevent multiple calls to a function', async () => {
		let counter = 0;
		const mem = memoize(async () => {
			counter++;
		});

		await mem(1);
		await mem(1);

		expect(counter).to.equal(1);
	});

	it('should ignore cache when option.useCached = false', async () => {
		let counter = 0;
		const mem = memoize(
			async () => {
				counter++;
			},
			{
				useCached: false,
			}
		);

		// When synchronous, both are executed..
		await mem(1);
		await mem(1);
		expect(counter).to.equal(2);

		// But when their asynchronous requests should only bump by 1
		counter = 0;
		await Promise.all([mem(1), mem(1)]);
		expect(counter).to.equal(1);
	});

	it('should trigger a rerun when request is stale', async () => {
		let counter = 0;
		const mem = memoize(
			async () => {
				counter++;
				return counter;
			},
			{
				staleInMs: 0,
			}
		);

		// When synchronous, both are executed..
		const valueA = await mem(1);
		const valueB = await mem(1);

		// The response are served from the first request
		expect(valueA).to.equal(1);
		expect(valueB).to.equal(1);

		// But the second is run pending a response
		expect(counter).to.equal(2);
	});

	it('should trigger a rerun when request is stale', async () => {
		let counter = 0;
		const mem = memoize(
			async () => {
				counter++;
				return counter;
			},
			{
				staleInMs: 0,
			}
		);

		// Each request is marked as stale
		// Returns 1 as it's the first request
		const valueA = await mem(1);
		expect(valueA).to.equal(1);

		// Also returns 1, rather than wait for it's own response
		const valueB = await mem(1);
		expect(valueB).to.equal(1);

		// Returns 2, because the second run has now finished.
		const valueC = await mem(1);
		expect(valueC).to.equal(2);
	});

	it('should skip rejected requests', async () => {
		let counter = 0;
		const mem = memoize(
			async () => {
				counter++;
				if (counter % 2) {
					throw new Error('this is odd');
				}
				return counter;
			},
			{
				staleInMs: 0,
			}
		);

		// 1. Fails
		await expect(mem(1)).to.be.eventually.rejectedWith('this is odd');

		// 2. Succeeds returns 2
		const valueB = await mem(1);
		expect(valueB).to.equal(2);

		// 3. Rejects but returns 2
		const valueC = await mem(1);
		expect(valueC).to.equal(2);
	});

	it('should skip rejected responses when useCache:true', async () => {
		let counter = 0;
		const mem = memoize(
			async () => {
				counter++;
				if (counter % 2) {
					throw new Error('this is odd');
				}
				return counter;
			},
			{
				useCache: true,
				staleInMs: 0,
			}
		);

		// 1. Fails
		await expect(mem(1)).to.be.eventually.rejectedWith('this is odd');

		// 2. Succeeds returns 2
		const valueB = await mem(1);
		expect(valueB).to.equal(2);

		// 3. Rejects but returns 2
		const valueC = await mem(1);
		expect(valueC).to.equal(2);
	});

	it('should allow control over whether to use the Cache', async () => {
		let counter = 0;
		const mem = memoize(
			async () => {
				counter++;
				throw new Error(`this is odd ${counter}`);
			},
			{
				useCached() {
					// Use cache of rejected as well
					return true;
				},
				staleInMs: 10000, // sometime in the distance
			}
		);

		// 1. Fails
		await expect(mem(1)).to.be.eventually.rejectedWith('this is odd 1');

		// 2. Fails, but doesn't try again
		await expect(mem(1)).to.be.eventually.rejectedWith('this is odd 1');
	});

	it('should not contain more than 1000 enties in the cache by default', async () => {
		const cache = new Map();
		const mem = memoize(async (number) => number / 2, {
			cache,
		});

		await Promise.all(
			Array(2000)
				.fill(null)
				.map((_, index) => mem(index))
		);

		expect(cache.size).to.equal(1000);
	});

	it('should no longer cache when process.env.MEMOIZE_DISABLED=true', async () => {
		let i = 0;

		process.env.MEMOIZE_DISABLED = true;

		const mem = memoize(async () => i++);

		const a = await mem(1);
		const b = await mem(1);

		expect(a).to.equal(0);
		expect(b).to.equal(1);
	});
});
