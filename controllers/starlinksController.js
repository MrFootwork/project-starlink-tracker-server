import axios from 'axios';
import jsonServer from 'json-server';
import dotenv from 'dotenv';

dotenv.config();

const STARLINK_API = process.env.STARLINK_API;
const router = jsonServer.router('db.json');

export const createStarlinks = async (req, res) => {
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

		// Last time I checked, it didn't work without the await
		await db.set(starlinkCollection, sanitizedStarlinks).write();

		return res.status(200).json({
			status: 'Database refresh successful.',
			message: 'Fetched from Starlink API and refreshed database.',
		});
	} catch (error) {
		return res.status(500).json({
			status: 'Database refresh failed.',
			message: `Database couldn't be refreshed. Check if any data was lost! ${error}`,
		});
	}
};
