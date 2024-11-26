import crypto from 'crypto';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

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

export const verifyToken = (req, res, next) => {
	const token =
		req.headers['authorization'] && req.headers['authorization'].split(' ')[1]; // Get token from "Bearer <token>"
	if (!token) {
		return res.status(403).json({ message: 'No token provided' });
	}

	// Verify token
	jwt.verify(token, SECRET_KEY, (err, decoded) => {
		if (err) {
			return res.status(401).json({ message: 'Invalid or expired token' });
		}

		// Attach user data to request object
		req.user = decoded;
		next();
	});
};
