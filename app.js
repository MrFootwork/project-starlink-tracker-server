import jsonServer from 'json-server';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { authMiddleware } from './middlwares/authMiddleware.js';
import axios from 'axios';

import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const PORT = process.env.PORT || 3000;
const STARLINK_API = process.env.STARLINK_API;

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);
server.use(authMiddleware);
server.use(morgan('dev'));

// Chat
const httpServer = createServer(server);
const io = new Server(httpServer, {
	// https://socket.io/how-to/use-with-react
	// enable CORS during development
	cors: {
		origin: '*',
	},
});

// Middleware to log connection details
io.use((socket, next) => {
	console.log('Socket connected:', socket.id);
	next();
});

// Handle WebSocket connections
io.on('connection', socket => {
	console.log('A user connected:', socket.id);

	// Listen for incoming chat messages
	socket.on('chatMessage', message => {
		console.log(`Message received: ${message}`);
		// Broadcast the message to all connected clients
		io.emit('chatMessage', message);
	});

	// Handle disconnections
	socket.on('disconnect', () => {
		console.log('A user disconnected:', socket.id);
	});
});

// Health
server.get('/health', (req, res) => {
	try {
		// Access the router's database
		const db = router.db; // lowdb instance
		const dbState = db.getState();

		// Check if the database contains any data
		const hasData = Object.values(dbState).some(
			collection => Array.isArray(collection) && collection.length > 0
		);

		// Respond with health status
		const status = hasData ? 'healthy' : 'unhealthy';
		const httpStatus = hasData ? 200 : 503;

		res.status(httpStatus).json({
			status,
			message: hasData
				? 'Database contains data.'
				: 'Database is empty. Please add data to db.json.',
		});
	} catch (error) {
		// Handle unexpected errors
		console.error('Health check error:', error);
		res.status(500).json({
			status: 'error',
			message: `Health check failed because ${error}`,
		});
	}
});

// Fetch Starlink Data and save it to database
server.post('/db-refresh', async (req, res) => {
	try {
		const { data } = await axios.get(STARLINK_API);

		const starlinkCollection = 'starlinks';
		const db = router.db;

		const sanitizedStarlinks = data.map(starlink => {
			return {
				spaceTrack: {
					INCLINATION: starlink.spaceTrack.INCLINATION,
					PERIOD: starlink.spaceTrack.PERIOD,
					OBJECT_NAME: starlink.spaceTrack.OBJECT_NAME,
					DECAYED: starlink.spaceTrack.DECAYED,
					TLE_LINE0: starlink.spaceTrack.TLE_LINE0,
					TLE_LINE1: starlink.spaceTrack.TLE_LINE1,
					TLE_LINE2: starlink.spaceTrack.TLE_LINE2,
				},
				id: starlink.id,
				latitude: starlink.latitude,
				longitude: starlink.longitude,
				height_km: starlink.height_km,
				velocity_kms: starlink.velocity_kms,
			};
		});

		await db.set(starlinkCollection, sanitizedStarlinks).write();

		res.status(200).json({
			status: 'Database refresh successful.',
			message: 'Fetched from Starlink API and refreshed database.',
		});

		res.json({ message: 'This is a custom route!' });
	} catch (error) {
		res.status(500).json({
			status: 'Database refresh failed.',
			message: `Database couldn't be refreshed. Check if any data was lost! ${error}`,
		});
	}
});

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
	if (req.method === 'POST') {
		req.body.createdAt = Date.now();
	}
	// Continue to JSON Server router
	next();
});

// Use default router
server.use(router);
httpServer.listen(PORT, () => {
	console.log(`JSON Server is running at port ${PORT}`);
});
