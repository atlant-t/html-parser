export const enum Char {
	EOF         = 0,

	LF          = 10,
	CR          = 13,

	TAB         = 9,
	SPACE       = 32,
	SQUOTE      = 39,
	DQUOTE      = 34,
	GACCENT     = 96,
	NBSPACE     = 160,

	HASH        = 35,
	DOLLAR      = 36,
	PERCENT     = 37,
	AMPERSAND   = 38,
	AT          = 64,

	LPAREN      = 40,
	RPAREN      = 41,
	LBRECKET    = 91,
	RBRECKET    = 93,
	LBRACE      = 123,
	RBRACE      = 125,

	LTHAN       = 60,
	GTHAN       = 62,

	STAR        = 42,
	PLUS        = 43,
	MINUS       = 45,
	SLASH       = 47,
	EQUALS      = 61,

	BACKSLASH   = 92,
	CARET       = 94,

	BANG        = 33,
	QUESTION    = 63,
	COMMA       = 44,
	PERIOD      = 46,
	COLON       = 58,
	SEMICOLON   = 59,

	LOWLINE     = 95,
	VERLINE     = 124,
	PIPE        = 124,
	TILDA       = 126,

	$A          = 65,
	$Z          = 90,
	$a          = 97,
	$z          = 122,
	$0          = 48,
	$9          = 57
}

export function isWhiteSpace(char: number): boolean {
	return (Char.TAB <= char && char <= Char.SPACE) || char == Char.NBSPACE;
}

export function isLetter(char: number) {
	return (Char.$A <= char && char <= Char.$Z) || (Char.$a <= char && char <= Char.$z);
}

export function isNumber(char: number) {
	return Char.$0 <= char && char <= Char.$9;
}
