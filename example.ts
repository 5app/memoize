/* eslint-disable no-console */
import memoize from './src/index.js';

// Define a function which returns an object
type ProfileId = number;
interface Profile {
	id: ProfileId;
	name: string;
	age: number;
}

async function getMyProfile(id: ProfileId): Promise<Profile> {
	return {
		id,
		name: 'Andrew',
		age: 100,
	};
}

const memoProfile = memoize(getMyProfile, {
	useCached(param) {
		return param.timestamp ? param.timestamp > Date.now() : false;
	},
	getKey(param) {
		return param[0];
	},
});

const resp = await memoProfile(123);

console.log(resp?.id);
