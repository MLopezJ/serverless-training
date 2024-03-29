import * as backoff from 'backoff'

export const retry = async <R>(
	fn: () => Promise<R>,
	action: string,
): Promise<R> => {
	return new Promise<R>((resolve, reject) => {
		const fibonacciBackoff = backoff.exponential({
			randomisationFactor: 0,
			initialDelay: 1000,
			maxDelay: 60 * 1000,
		})

		fibonacciBackoff.on('backoff', (number, delay) => {
			console.log(
				`-- Action: '${action}'. Try # ${number}. Time: ${delay} ms --`,
			)
		})

		fibonacciBackoff.failAfter(6)

		fibonacciBackoff.on('ready', async () => {
			try {
				const res = await fn()
				resolve(res)
				console.log(`-- Action: '${action}' completed successfully --`)
			} catch (err) {
				console.error(err)
				fibonacciBackoff.backoff()
			}
		})

		fibonacciBackoff.on('fail', () => {
			reject(new Error(`Backoff timed out!`))
		})

		fibonacciBackoff.backoff()
	})
}
