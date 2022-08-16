import { main as deleteImage } from './deleteImage'
import { main as requestLabels } from './requestLabels'
import { main as uploadImage } from './uploadImage'
const execution = async () => {
	const key = await uploadImage()
	await requestLabels(key)
	await deleteImage(key)
}

execution().then(console.log).catch(console.log)
