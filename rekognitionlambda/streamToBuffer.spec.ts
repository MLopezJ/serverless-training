import { Readable } from 'stream'
import { streamToBuffer } from './streamToBuffer'

describe('streamToBuffer', () => {
	it('Should transform a stream into buffer', async () => {
		const redable = new Readable()
		redable.push('hello')
		redable.push(null)

		const buffer = await streamToBuffer(redable)
		expect(buffer.toString()).toBe('hello')
	})
})
