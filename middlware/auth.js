import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

const unprotectedEndpoints = [
	'/login',
	'/signin',
	'/logout',
	'/health',
	'/cookie',
];

export const authMiddleware = (req, res, next) => {
	// These endpoints don't require valid tokens
	if (unprotectedEndpoints.includes(req.url)) return next();

	const rawCookies = req.headers.cookie;

	if (!rawCookies) {
		return res.status(403).json({ message: 'No token provided' });
	}

	// Parse cookies
	const cookies = rawCookies.split('; ').reduce((acc, cookie) => {
		const [name, value] = cookie.split('=');
		acc[name] = value;
		return acc;
	}, {});

	const token = cookies['session-token'];

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
