// Clean the string to add the ":" symbol back into requested name

export const replaceSubstringWithColon = (txt: string): string =>
	txt.replace('%3A', ':')
