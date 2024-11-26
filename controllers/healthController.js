import jsonServer from 'json-server';

const router = jsonServer.router('db.json');

export const getHealth = (req, res) => {
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

		return res.status(httpStatus).json({
			status,
			message: hasData
				? 'Database contains data.'
				: 'Database is empty. Please add data to db.json.',
		});
	} catch (error) {
		// Handle unexpected errors
		console.error('Health check error:', error);
		return res.status(500).json({
			status: 'error',
			message: `Health check failed because ${error}`,
		});
	}
};
