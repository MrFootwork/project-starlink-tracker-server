import jsonServer from 'json-server';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { getHash, getSalt, verifyPassword } from '../helpers/security.js';

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

const router = jsonServer.router('db.json');
const db = router.db;
const dbUsers = db.get('users');

export const createUser = (req, res) => {
	const newUser = req.body;

	try {
		if (newUser.password !== newUser.password2)
			throw new Error("Passwords don't match");

		if (!newUser.username || !newUser.password || !newUser.password2)
			throw new Error('Empty entries not allowed');

		// sanitize user for database entry
		const userToAdd = newUser;
		userToAdd.id = uuid();
		delete userToAdd.password2;

		// Hash Password
		const salt = getSalt();
		const hash = getHash(userToAdd.password, salt);
		userToAdd.salt = salt;
		userToAdd.hash = hash;
		delete userToAdd.password;

		const addedUser = dbUsers.insert(userToAdd).write();

		return res.status(201).json({
			message: 'User data received successfully and added to the database!',
			data: {
				id: addedUser.id,
				username: addedUser.username,
				image: addedUser.image,
				createdAt: addedUser.createdAt,
			},
		});
	} catch (error) {
		console.log(`🚀 ~ server.post ~ error:`, error);
		// Handle empty entries
		if (error.message === 'Empty entries not allowed') {
			return res
				.status(400)
				.json({ message: 'Username and password are required' });
		}

		// Handle not matching passwords
		if (error.message === "Passwords don't match") {
			return res.status(409).json({
				status: 'Passwords provided are not equal.',
				message: `Bot passwords have to match. The user must provide two equal passwords.`,
			});
		}

		// Handle duplicate id
		if (error.message === 'Insert failed, duplicate id') {
			return res.status(409).json({
				status: 'Username already taken.',
				message: `The username ${newUser.username} is already taken. Please try again with another username!`,
			});
		}

		// Handle other errors
		return res.status(500).json({
			status: 'Failed to add new user to database.',
			message: `The new user ${newUser.username} couldn't be written to the databse due to Error: ${error}`,
		});
	}
};

export const getToken = (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res
			.status(400)
			.json({ message: 'Username and password are required' });
	}

	try {
		const user = dbUsers.find({ username }).value();
		let isMatch = false;

		(async () => {
			isMatch = (await verifyPassword(password, user)) || false;

			if (isMatch) {
				const resUser = {
					username: user.username,
					image: user.image,
					createdAt: user.createdAt,
					id: user.id,
				};

				// Create Token
				const token = jwt.sign(
					{ id: user.id, username: user.username, image: user.image },
					SECRET_KEY,
					{ expiresIn: '24h' }
				);

				// send Cookie
				res.cookie('session-token', token, {
					httpOnly: true,
					sameSite: 'none',
					secure: true,
					partition: true,
				});

				return res.status(200).json({
					message: 'Login successful',
					resUser,
				});
			} else {
				return res
					.status(401)
					.json({ message: 'Invalid username or password' });
			}
		})();
	} catch (error) {
		return res.status(500).json({
			status: 'Something went wrong with authenticating this user.',
			message: `The user ${username} couldn't be authenticated due to ${error}`,
		});
	}
};

export const deleteToken = (req, res) => {
	console.log('Logging out...');

	// Clear the session-token cookie by setting it to expire immediately
	res.cookie('session-token', '', {
		httpOnly: true,
		sameSite: 'none',
		secure: true,
		partition: true,
	});

	// Send a response confirming logout
	res.status(200).json({ message: 'Logged out successfully' });
};

export const getUser = (req, res) => {
	try {
		return res.status(200).json({
			message: 'Userinfo retrieval successful.',
			data: req.user,
		});
	} catch (error) {
		return res.status(500).json({
			status: `Something went wrong with retrieving user info for ${username}.`,
			message: `The userinfo for ${username} couldn't be retrieved from the database due to ${error}`,
		});
	}
};
