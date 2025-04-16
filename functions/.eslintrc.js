module.exports = {
	env: {
		es6: true,
		node: true,
	},
	parserOptions: {
		ecmaVersion: 2024,
	},
	extends: [
		"eslint:recommended",
		"google",
	],
	rules: {
		"no-restricted-globals": ["error", "name", "length"],
		"prefer-arrow-callback": "warn",
		"quotes": ["warn", "double", { allowTemplateLiterals: true }],

		// Tabs > spaces
		"indent": ["error", "tab"],
		"no-tabs": "off",
		"object-curly-spacing": ["warn", "always"],

		// I don't care
		"max-len": "off",
		"comma-dangle": "off"
	},
	overrides: [
		{
			files: ["**/*.spec.*"],
			env: {
				mocha: true,
			},
			rules: {},
		},
	],
	globals: {},
};
