import jsonServer from 'json-server';

const router = jsonServer.router('db.json');
const db = router.db;
const dbMessages = db.get('messages');

// FIXME Event changeMessage
// data: modified, deleted
export const generateDeleteController = io => {
	return async (req, res) => {
		// Process request data
		const user = req.user;
		let [, , messageID] = req.url.split('/');
		messageID = +messageID;

		// Extract Message
		const foundMessage = dbMessages.find({ id: messageID }).value();

		// Verify user is allowed to make the deletion
		const userCanDelete = foundMessage.user.userId === user.userId;

		if (userCanDelete) {
			// Add delete flag to the message
			foundMessage.deleted = true;

			// Update the message in the DB
			dbMessages
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
		// Process request data
		const user = req.user;
		console.table(`🚀 ~ return ~ user:`, user);
		console.log('REQ BODY:', req.body);
		const editedMessage = req.body.message;
		console.log(`🚀 ~ return ~ editedMessage:`, editedMessage);
		let [, , messageID] = req.url.split('/');
		messageID = +messageID;
		console.log(`🚀 ~ return ~ messageID:`, messageID);

		// Extract Message
		const foundMessage = dbMessages.find({ id: messageID }).value();
		console.table(`🚀 ~ return ~ foundMessage:`, foundMessage);
		console.table(`🚀 ~ return ~ foundMessage.user:`, foundMessage.user);

		// Verify user is allowed to make the deletion
		const userCanEdit = foundMessage.user.userId === user.userId;

		if (userCanEdit) {
			// Edit Message
			foundMessage.message = editedMessage;

			// Add modified flag to the message
			foundMessage.modified = true;

			// Update the message in the DB
			dbMessages
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
