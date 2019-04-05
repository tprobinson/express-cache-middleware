module.exports = {
    extends: ["standard", "plugin:jest/recommended"],
    rules: {
      "keyword-spacing": ["error", {
        "before": true, "after": true, "overrides": {
          "if": { "after": false },
          "for": { "after": false },
          "while": { "after": false },
          "switch": { "after": false },
        }
      }],
      "space-in-parens": ["off"],
      "space-before-function-paren": ["off"],
      "comma-dangle": ["error", {
        "arrays": "only-multiline",
        "objects": "only-multiline",
        "imports": "only-multiline",
        "exports": "only-multiline",
        "functions": "ignore"
      }],
    }
};
