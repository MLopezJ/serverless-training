import { main as deleteImage } from './deleteImage'
import { main as requestLabels } from './requestLabels'
import { main as uploadImage } from './uploadImage'

uploadImage()
	.then(async (key) => {
		await requestLabels(key)
		await deleteImage(key)
	})
	.catch(console.error)
