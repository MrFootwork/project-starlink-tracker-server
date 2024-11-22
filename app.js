import jsonServer from 'json-server';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { authMiddleware } from './middlwares/authMiddleware.js';
import axios from 'axios';

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

// Add custom routes before JSON Server router
server.use((req, res, next) => {
	// Middleware to disable CORS
	res.header('Access-Control-Allow-Origin', '*');
	next();
});

// custom route works
server.get('/posts', (req, res) => {
	res.json({ message: 'This is a custom route!' });
});

// Fetch Starlink Data and save it to database
server.post('/db-refresh', async (req, res) => {
	res.json({ message: 'This is a custom route!' });
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
	} catch (error) {
		console.error("Writing to database didn't work: ", error);
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
server.listen(PORT, () => {
	console.log(`JSON Server is running at port ${PORT}`);
});
