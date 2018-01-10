import { Char, isWhiteSpace, isLetter } from './chars';
import { TokenType } from './tokens';

export function tokenize(content: string): TokenizeResult {
	return new _Tokenizer(content).tokenize();
}

export class Token {
	constructor(public type: TokenType, public content: string[]) {}
}

export class TokenError {
	constructor(public type: TokenType) {}
}

export interface LocationMark {
	index: number;
	line: number;
	column: number;
	charCode: Char;
}

export class TokenizeResult {
	constructor(public content: Content,
				public tokens: Token[],
				public errors: LexerError[]) {}
}

class Content {
	private _text: string;
	private _length: number;

	private _index: number;
	private _line: number;
	private _column: number;

	private _peek: number;

	private _lengthOfLines: number[] = [];
	private _advances: number = 0;

	constructor (content: string) {
		this._text = content;
		this._length = content.length;
		this.setStartPosition();
	}

	public peek(): number { return this._peek }
	// get peek(): number { return this._peek as number }

	public advance() {
		if (this._text.charCodeAt(this._index) === Char.LF) {
			this._line++;
			this._lengthOfLines.push(this._column + 1);
			this._column = 0;
		}
		this._index++;
		if (this._index === this._length) {
			this._peek = Char.EOF;
		} else if (this._index > this._length) {
			throw new Error(_unexpectedCharErrMsg(this._peek))
		} else {
			this._peek = this._text.charCodeAt(this._index);
		}
		if (this._advances < this._index) {
			this._advances = this._index;
		}
	}

	public recede() {
		if (this._index <= 0) {
			this._index = 0;
			return;
		}
		this._index--;
		if (this._text.charCodeAt(this._index) === Char.LF) {
			this._line--;
			this._column = this._lengthOfLines[this._line];
		}
	}

	public setStartPosition() {
		this._index = 0;
		this._line = 0;
		this._column = 0;
		this._peek = this._text.charCodeAt(0);
	}

	public setPosition(position: number) {
		if (position > this._length) position = this._length - 1;
		this._index = position;
		let location = this._calculatePosition(position);
		this._line = location[0];
		this._column = location[1];
	}

	public getPosition() { return this._index }

	public getSubstring(start: number, end?: number) {
		return this._text.substring(start, end || this._index);
	}

	public getMark(): LocationMark {
		return {
			index: this._index,
			column: this._column,
			line: this._line,
			charCode: this._peek
		}
	}

	private _calculatePosition(position: number): [number, number] {
		if (position >= this._length) position = this._length - 1;
		let line: number = 0, column: number = 0, marker = 0;

		while (line < this._lengthOfLines.length) {
			marker += this._lengthOfLines[line];
			if (position < marker) {
				column = position - marker - this._lengthOfLines[line];
				break;
			}
			line++;
		}
		if (marker <= position && position <= this._advances) {
			column = position - marker;
		} else {
			column = this._advances - marker;
			marker = this._advances;
			while (marker <= position && marker < this._length) {
				if (this._text.charCodeAt(marker) === Char.LF) {
					this._lengthOfLines.push(column + 1);
					line++;
					column = 0;
				} else {
					column++;
				}
				this._advances = marker;
			}
		}
		return [line, column];
	}
}

class _Tokenizer {
	private _content: Content;

	private _tokens: Token[] = [];
	private _errors: LexerError[] = [];

	private _currentToken: TokenType = null !;

	constructor(content: string) {
		this._content = new Content(content);
	}

	public tokenize(): TokenizeResult {
		this._content.setStartPosition();
		try {
			while (this._content.peek() !== Char.EOF) {
				if (this._attemptCharCode(Char.LTHAN)) {
					if (this._attemptString('!--')) {
						this._consumeComment();
					}
					this._consumeTag();
				} else if(!isWhiteSpace(this._content.peek())) {
					this._consumeText();
				} else { this._content.advance() };
			}
			this._begineToken(TokenType.EOF);
			this._endToken([]);
		} catch(e) {
			if (e instanceof LexerError) {
				this._errors.push(e);
			} else {
				throw e;
			}
		}
		return new TokenizeResult(this._content, this._tokens, this._errors)
	}

	private _begineToken(type: TokenType) {
		if (this._currentToken) {
			// TODO: create an error if the current token already exists
		}
		this._currentToken = type;
	}

	private _endToken(content: string[]) {
		let token = new Token(this._currentToken, content);
		this._tokens.push(token);
		this._currentToken = null !;
	}

	private _attemptCharCode(code: number) {
		if (this._content.peek() === code) {
			this._content.advance();
			return true
		}
		return false;
	}

	private _attemptString(str: string) {
		let savedPosition = this._content.getPosition();
		for (let i = 0; i < str.length; i++) {
			if (this._content.peek() !== str.charCodeAt(i)) {
				this._content.setPosition(savedPosition);
				return false;
			} else {
				this._content.advance();
			}
		}
		return true;
	}

	private _requireCharCode(code: number) {
		if (this._content.peek() !== code) {
			throw this._createError(_unexpectedCharErrMsg(this._content.peek()))
		}
		this._content.advance();
	}

	private _consumeTag() {
		if (this._attemptCharCode(Char.SLASH)) {
			this._consumeTagClose();
			return;
		}

		this._consumeTagOpen();
		while (this._content.peek() !== Char.GTHAN && this._content.peek() !== Char.SLASH) {
			if(isWhiteSpace(this._content.peek())) {
				this._content.advance();
			} else {
				this._consumeTagProperty();
			}
		}
		this._consumeTagOpenEnd();
	}

	private _consumeTagOpen() {
		let savedPosition = this._content.getPosition();
		let tagName: string;

		this._begineToken(TokenType.TAG_OPEN_BEGINE);
		if (!isLetter(this._content.peek())) {
			throw this._createError(_unexpectedCharErrMsg(this._content.peek()));
		}
		while (!isWhiteSpace(this._content.peek())
			&& this._content.peek() !== Char.GTHAN
			&& this._content.peek() !== Char.SLASH) {
			this._content.advance();
		}
		tagName = this._content.getSubstring(savedPosition);

		this._endToken([tagName]);
	}

	private _consumeTagProperty() {
		this._consumeTagPropertyName();

		while (isWhiteSpace(this._content.peek())) {
			this._content.advance();
		}

		if (this._attemptCharCode(Char.EQUALS)) {
			while (isWhiteSpace(this._content.peek())) {
				this._content.advance();
			}
			this._consumeTagPropertyValue();
		}
	}

	private _consumeTagPropertyName() {
		let savedPosition = this._content.getPosition();
		let propertyName: string;

		this._begineToken(TokenType.TAG_PROPERTY_NAME);
		while (this._content.peek() !== Char.EQUALS
			&& this._content.peek() !== Char.GTHAN
			&& !isWhiteSpace(this._content.peek())) {
			this._content.advance();
		}
		propertyName = this._content.getSubstring(savedPosition);
		this._endToken([propertyName]);
	}

	private _consumeTagPropertyValue() {
		let propertyValue: string,
			propertyValueStart: number,
			propertyValueEnd: number;
		let isEndCharFn: (char: number) => boolean;

		if (this._content.peek() === Char.DQUOTE || this._content.peek() === Char.SQUOTE) {
			let quote = this._content.peek();
			isEndCharFn = char => {
				if (char === quote) {
					propertyValueEnd = this._content.getPosition()
					this._content.advance();
					return true;
				}
				return false;
			};
			this._content.advance();
		} else {
			isEndCharFn = char => (isWhiteSpace(char) || char === Char.GTHAN || char === Char.SLASH)
		}
		propertyValueStart = this._content.getPosition();

		this._begineToken(TokenType.TAG_PROPERTY_VALUE);
		while(!isEndCharFn(this._content.peek())) {
			this._content.advance();
		}
		propertyValue = this._content.getSubstring(propertyValueStart, propertyValueEnd!);
		this._endToken([propertyValue]);
	}

	private _consumeTagOpenEnd() {
		let tokenType = this._attemptCharCode(Char.SLASH)
			? TokenType.TAG_OPEN_END_VOID : TokenType.TAG_OPEN_END;
		this._begineToken(tokenType);
		this._requireCharCode(Char.GTHAN);
		this._endToken([]);
	}

	private _consumeTagClose() {
		let tagName: string;
		let savedPosition = this._content.getPosition();

		this._begineToken(TokenType.TAG_CLOSE)
		while(this._content.peek() !== Char.GTHAN && !isWhiteSpace(this._content.peek())) {
			this._content.advance();
		}
		tagName = this._content.getSubstring(savedPosition);
		while(isWhiteSpace(this._content.peek())) {
			this._content.advance();
		}

		if (!this._attemptCharCode(Char.GTHAN)) {
			throw this._createError(_unexpectedCharErrMsg(Char.GTHAN))
		}
		this._endToken([tagName]);
	}

	private _consumeText() {
		let savedPosition = this._content.getPosition();
		let iLastSymbol = savedPosition;
		let text: string;

		this._begineToken(TokenType.TEXT);
		while(!this._isEndText()) {
			iLastSymbol = this._content.getPosition();
			this._content.advance();
		}
		text = this._content.getSubstring(savedPosition, iLastSymbol + 1);
		this._endToken([text]);
	}
	private _isEndText(): boolean {
		if (!isWhiteSpace(this._content.peek())) {
			if (this._content.peek() === Char.LTHAN || this._content.peek() === Char.EOF)
				return true;
			else return false;
		}
		while(isWhiteSpace(this._content.peek())) {
			this._content.advance();
			if (this._content.peek() === Char.LTHAN || this._content.peek() === Char.EOF) {
				return true;
			}
		}
		this._content.recede();
		return false;
	}

	private _consumeComment() {

	}


	private _createError(message: string) {
		let token = new TokenError(this._currentToken);
		this._currentToken = null !;
		// return new LexerError(error);
		console.log(token);
		return new LexerError(message, token, this._content.getMark());
		}
}

class LexerError {
	constructor(public message: string, public token: TokenError, public location: LocationMark) {}
	// constructor(public message: TokenError) {}
}

function _unexpectedCharErrMsg(charCode: number) {
	let char = String.fromCharCode(charCode);
	return `Unexpected character "${char}"`;
}
