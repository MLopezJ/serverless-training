import { replaceSubstringWithColon } from './replaceSubstringWithColon'

describe('replaceSubstringWithColon', () => {
	describe("Should replace '%3A' with ':' in string", () =>
		it.each([
			['city%3ATrondheim', 'city:Trondheim'],
			['%3AHello', ':Hello'],
			['bye%3A', 'bye:'],
			['ran%3Adom', 'ran:dom'],
		])('"%s" -> "%s"', (received, expected) =>
			expect(replaceSubstringWithColon(received)).toBe(expected),
		))

	describe("Should not replace any if '%3A' is not in string", () =>
		it.each([
			['%Tro3ndhAeim', '%Tro3ndhAeim'],
			['Hell%3oA', 'Hell%3oA'],
			['bye%3B', 'bye%3B'],
		])('"%s" -> "%s"', (received, expected) =>
			expect(replaceSubstringWithColon(received)).toBe(expected),
		))
})
