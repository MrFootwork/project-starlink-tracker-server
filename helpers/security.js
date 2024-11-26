import crypto from 'crypto';

export const getSalt = () => {
	return crypto.randomBytes(16).toString('hex');
};

export const getHash = (password, salt) => {
	return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

export const verifyPassword = (inputPassword, userRecord) => {
	return new Promise((resolve, reject) => {
		crypto.pbkdf2(
			inputPassword,
			userRecord?.salt || '',
			10000,
			64,
			'sha512',
			(err, derivedKey) => {
				if (err) return reject(err);

				// Compare the derived hash with the stored hash
				const inputHash = derivedKey.toString('hex');
				if (inputHash === (userRecord?.hash || '')) {
					resolve(true); // Password matches
				} else {
					resolve(false); // Password does not match
				}
			}
		);
	});
};
