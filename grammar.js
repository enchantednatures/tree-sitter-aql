/**
 * @file ArangoDB Query Language
 * @author Hunter Casten <huntercasten@icloud.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "aql",

  rules: {
    source_file: ($) => $._definition,
    identifier: $ => /[a-z_]+/,

    _definition: ($) => $.statement,

    statement: ($) =>
      seq(
        $.iter_collection_expression,
        $.return_statement,
      ),

    collection_selector: $ => choice($.collection_name, $.collection_bind_var),

    iter_collection_expression: ($) => seq(
      'for',
      $.identifier,
      'in',
      $.collection_selector
    ),

    collection_bind_var: $ => /@@[a-z_]+/,
    collection_name: $ => /[a-z_]+/,

    return_statement: ($) =>
      seq(
        "return",
        $.identifier, //todo choice
      ),
  },
});
