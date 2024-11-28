import jsonServer from 'json-server';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { authMiddleware } from './middlware/auth.js';

import {
	createUser,
	deleteToken,
	getToken,
	getUser,
} from './controllers/usersController.js';
import { createStarlinks } from './controllers/starlinksController.js';
import { getHealth } from './controllers/healthController.js';
import {
	generateDeleteController,
	generateEditController,
} from './controllers/messagesController.js';

dotenv.config();

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const db = router.db;
const dbMessages = db.get('messages');

const middlewares = jsonServer.defaults();
const PORT = process.env.PORT || 3000;

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);
server.use(authMiddleware);
server.use(morgan('dev'));

// Allow Origins
const allowedOrigins = [
	'http://localhost:5173', // Development frontend
	'https://project-starlink-tracker.onrender.com', // Production frontend
];

const corsOptions = {
	origin: (origin, callback) => {
		if (allowedOrigins.includes(origin) || !origin) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	},
	credentials: true,
};

server.use(cors(corsOptions));

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

// Health
server.get('/health', getHealth);

// Fetch Starlink Data and save it to database
server.post('/db-refresh', createStarlinks);

/***********************
 * User Authentication
 **********************/
server.post('/signin', createUser);
server.post('/login', getToken);
server.post('/logout', deleteToken);
server.get('/user', getUser);
server.get('/cookie', (req, res) => {
	res.cookie('test-cookie', 'this is cookie value', {
		httpOnly: true,
		sameSite: 'none',
		secure: true,
		partition: true,
	});
	return res.status(200).json({
		message: 'cookie sent',
	});
});

/***********************
 * CHAT
 **********************/
const httpServer = createServer(server);
// FIXME Extract that into a module
const io = new Server(httpServer, {
	// https://socket.io/how-to/use-with-react
	// enable CORS during development
	cors: {
		origin: '*',
		credentials: true,
	},
});

// const io = new SocketIO(httpServer).server;

// Middleware to log connection details
io.use((socket, next) => {
	console.log('Socket connected:', socket.id);
	next();
});

// Handle WebSocket connections
io.on('connection', socket => {
	console.log('A user connected:', socket.id);

	// Listen for incoming chat messages
	socket.on('sendMessage', message => {
		console.log(`Message received: ${{ message }}`);
		console.table({ message });
		// Store new messages
		dbMessages.insert(message).write();

		// Broadcast the message to all connected clients
		io.emit('chatMessage', message);
	});

	// Handle disconnections
	socket.on('disconnect', () => {
		console.log('A user disconnected:', socket.id);
	});
});

server.delete('/message/:id', generateDeleteController(io));
server.put('/message/:id', generateEditController(io));

// Use default router
server.use(router);
httpServer.listen(PORT, () => {
	console.log(`JSON Server is running at port ${PORT}`);
});
