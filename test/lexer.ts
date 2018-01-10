import 'mocha';

import { expect } from 'chai';

import { tokenize } from '../src/lexer';

import { TokenType } from '../src/tokens';

{
	describe('Lexer', () => {
		describe('lines', () => {
			it('should work in a line', () => {
				expect(tokenize('<tag>a</tag>').errors.length)
					.to.equal(0);
			});
			it('should work with a new line', () => {
				expect(tokenize('<tag\n>\n</tag>').tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.TAG_CLOSE, ['tag']],
						[TokenType.EOF, []]
						]);
			});
			it('should work with CR and LF', () => {
				expect(tokenize('<tag\n>multiline\r\ntext\r</tag>').tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.TEXT, ['multiline\r\ntext']],
						[TokenType.TAG_CLOSE, ['tag']],
						[TokenType.EOF, []]
					]);
			});
		});
		describe('tags', () => {
			it('should parse open tag', () => {
				expect(tokenize(`<tag>`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.EOF, []]
					]);
			});
			it('should report an unexpected character in a tag name on error', () => {
				expect((tokenize(`<9ag>`).errors[0]))
					.to.nested.include({
						'token.type' : TokenType.TAG_OPEN_BEGINE,
						'message': 'Unexpected character "9"',
						'location.line': 0,
						'location.column': 1
					});
			})
			it('should parse void tag', () => {
				expect(tokenize(`<tag/>`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_OPEN_END_VOID, []],
						[TokenType.EOF, []]
					]);
			});
			it('should parse close tag', () => {
				expect(tokenize(`</tag>`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_CLOSE, ['tag']],
						[TokenType.EOF, []]
					]);
			});
		});
		describe('text in tag', () => {
			it('should parse text in tag', () => {
				expect(tokenize(`<tag>text</tag>`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.TEXT, ['text']],
						[TokenType.TAG_CLOSE, ['tag']],
							[TokenType.EOF, []]
					]);
			});
			it('should parse text with whitespace', () => {
				expect(tokenize(`<tag>text string</tag>`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.TEXT, ['text string']],
						[TokenType.TAG_CLOSE, ['tag']],
						[TokenType.EOF, []]
					]);
			});
		});
		describe('tag property', () => {
			it('should parse property without value', () => {
				expect(tokenize(`<tag property>`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_PROPERTY_NAME, ['property']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.EOF, []]
					]);
			});
			it('should parse property with value in double quotes', () => {
				expect(tokenize(`<tag property="value">`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_PROPERTY_NAME, ['property']],
						[TokenType.TAG_PROPERTY_VALUE, ['value']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.EOF, []]
					]);
			});
			it('should parse property with value in single quotes', () => {
				expect(tokenize(`<tag property='value'>`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_PROPERTY_NAME, ['property']],
						[TokenType.TAG_PROPERTY_VALUE, ['value']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.EOF, []]
					]);
			});
			it('should parse property value without quotes', () => {
				expect(tokenize(`<tag property=value>`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_PROPERTY_NAME, ['property']],
						[TokenType.TAG_PROPERTY_VALUE, ['value']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.EOF, []]
					]);
			})
			it('should parse property value with whitespace in quotes', () => {
				expect(tokenize(`<tag property='value '>`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_PROPERTY_NAME, ['property']],
						[TokenType.TAG_PROPERTY_VALUE, ['value ']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.EOF, []]
					]);
				expect(tokenize(`<tag property="value ">`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_PROPERTY_NAME, ['property']],
						[TokenType.TAG_PROPERTY_VALUE, ['value ']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.EOF, []]
					]);
			})
			it('should allow whitespace', () => {
				expect(tokenize(`<tag property = value>`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_PROPERTY_NAME, ['property']],
						[TokenType.TAG_PROPERTY_VALUE, ['value']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.EOF, []]
					]);
				expect(tokenize(`<tag property = "value">`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_PROPERTY_NAME, ['property']],
						[TokenType.TAG_PROPERTY_VALUE, ['value']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.EOF, []]
					]);
				expect(tokenize(`<tag property = 'value'>`).tokens.map(token => [token.type, token.content]))
					.to.have.deep.members([
						[TokenType.TAG_OPEN_BEGINE, ['tag']],
						[TokenType.TAG_PROPERTY_NAME, ['property']],
						[TokenType.TAG_PROPERTY_VALUE, ['value']],
						[TokenType.TAG_OPEN_END, []],
						[TokenType.EOF, []]
					]);
			})
		});
	})
}
