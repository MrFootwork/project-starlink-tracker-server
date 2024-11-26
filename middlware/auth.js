export const authMiddleware = (req, res, next) => {
	console.log(`🚀 ~ authMiddleware ~ req.headers:`, req.headers);
	// const token = req.headers.authorization;
	// if (!token) {
	// 	return res.status(403).json({ message: 'Unauthorized' });
	// }
	next();
};
