module.exports = {
	testEnvironment: 'node',
	testMatch: ['**/*.spec.ts'],
	transform: {
		'^.+\\.(t|j)sx?$': ['@swc/jest'],
	},
}
