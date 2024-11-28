import jsonServer from 'json-server';

const router = jsonServer.router('db.json');
const db = router.db;


// FIXME Event changeMessage
// data: modified, deleted
export const generateDeleteController = io => {
	return async (req, res) => {
		const dbMessages = db.get('messages');
		// Process request data
		const user = req.user;
		console.log(`🚀 ~ return ~ user:`);
		console.table(user);

		let [, , messageID] = req.url.split('/');
		messageID = +messageID;

		// Extract Message
		const foundMessage = await dbMessages.find({ id: messageID });
		console.log(`🚀 ~ return ~ foundMessage:`, foundMessage);
		console.table(foundMessage);
		console.table(foundMessage.user);

		// Verify user is allowed to make the deletion
		const userCanDelete = foundMessage.user.id === user.id;

		if (userCanDelete) {
			// Add delete flag to the message
			foundMessage.deleted = true;

			// Update the message in the DB
			await dbMessages
				.find({ id: messageID })
				.update({ ...foundMessage })
				.write();

			// FIXME Emit changed message
			io.emit('changeMessage', foundMessage);

			return res.status(200).json({ message: 'Message successfully deleted.' });
		} else {
			return res
				.status(403)
				.json({ message: 'User is not allowed to delete this message.' });
		}
	};
};

export const generateEditController = io => {
	return async (req, res) => {
		const dbMessages = db.get('messages');
		// Process request data
		const user = req.user;
		console.log(`🚀 ~ return ~ user:`);
		console.table(user);

		console.log('REQ BODY:', req.body);
		const editedMessage = req.body.message;
		console.log(`🚀 ~ return ~ editedMessage:`, editedMessage);
		let [, , messageID] = req.url.split('/');
		messageID = +messageID;
		console.log(`🚀 ~ return ~ messageID:`, messageID);

		// Extract Message
		const foundMessage = await dbMessages.find({ id: messageID }).value();
		console.log(`🚀 ~ return ~ foundMessage:`);
		console.table(foundMessage);

		console.log(`🚀 ~ return ~ foundMessage.user:`);
		console.table(foundMessage.user);

		// Verify user is allowed to make the deletion
		const userCanEdit = foundMessage.user.id === user.id;

		if (userCanEdit) {
			// Edit Message
			foundMessage.message = editedMessage;

			// Add modified flag to the message
			foundMessage.modified = true;

			// Update the message in the DB
			await dbMessages
				.find({ id: messageID })
				.update({ ...foundMessage })
				.write();

			// FIXME Emit changed message
			io.emit('changeMessage', foundMessage);

			return res.status(200).json({ message: 'Message successfully edited.' });
		} else {
			return res
				.status(403)
				.json({ message: 'User is not allowed to edit this message.' });
		}
	};
};
