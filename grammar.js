/**
 * @file ArangoDB Query Language (AQL) Grammar
 * @author Hunter Casten <huntercasten@icloud.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'aql',

  extras: $ => [
    $.comment,
    /\s+/
  ],

  rules: {
    source_file: ($) => choice(
      $.query,
      $.return_operation,
    ),

    query: ($) =>
      seq(
        $.for_operation,
        optional($.filter_operation), // FILTER is optional
        $.return_operation,
      ),

    // --- Operations ---
    for_operation: ($) => seq(
      $.kw_for, // Use the named rule again
      field('variable', $.identifier),
      $.kw_in,  // Use the named rule again
      field('collection', $.collection_selector)
    ),

    filter_operation: $ => seq(
      $.kw_filter, // Use the named rule again
      $.comparison_expression
    ),

    return_operation: $ => seq(
      $.kw_return, // Use the named rule again
      field('value', $.expression)
    ),
    // --- Expressions ---
    expression: $ => choice(
      $.member_expression,
      // $.literal,
      // $.object,
      // $.collection_bind_var
      // TODO: Add function calls, operators (arithmetic, logical), arrays, etc.
    ),


    // Handles base identifiers, literals, and parenthesized expressions
    _expression_atom: $ => choice(
      $.identifier,
      $.literal,             // Keep literal here
      $.object,              // Keep object here
      $.collection_bind_var  // Keep bind var here
      // Add $.array, $.function_call, seq('(', $.expression, ')') etc. here later
    ),

    // Handles property access like a.b, a['b'], a[0]
    member_expression: $ => choice(
      $._expression_atom,
      seq(
        field('object', $.member_expression),
        '.',
        field('property', $.identifier)
      ),
      seq(
        field('object', $.member_expression),
        '[',
        field('property', $.expression), // Property can be string, number (index), or other expression
        ']'
      )
    ),

    comparison_expression: $ => seq(
      $.expression,
      $.comparison_operator,
      $.expression
    ),

    comparison_operator: $ => choice(
      '==',
      '!=',
      '<',
      '<=',
      '>',
      '>=',
      // TODO: case-insensitive 'IN', 'NOT IN', 'LIKE', 'REGEX TEST' etc.
      // alias(make_keyword('like'), $.op_like),
    ),

    // --- Collections ---
    collection_selector: $ => choice(
      $.collection_name,
      $.collection_bind_var
    ),

    collection_name: $ => $.identifier, // Collection names are identifiers
    collection_bind_var: $ => /@@[a-zA-Z_][a-zA-Z0-9_]*/, // Collection bind parameter

    // --- Literals and Values ---
    literal: $ => choice(
      $.string,
      $.number,
      $.boolean,
      $.null
      // TODO: $.array
    ),

    value: $ => $.literal, // Simple alias, might be replaced by expression later

    object: $ => seq( // Removed prec('object', ...) wrapper
      '{',
      commaSep(optional(choice(
        $.object_pair,
        // Shorthand property { identifier } expands to { identifier: identifier }
        alias($.identifier, $.shorthand_property_identifier)
      ))),
      '}'
    ),
    object_pair: $ => seq(
      field('key', choice(
        alias($.identifier, $.property_identifier),
        $.string // Object keys can be strings
      )),
      ':',
      field('value', $.expression)
    ),
    number: _ => token(/-?\d+(\.\d+)?([eE][+-]?\d+)?/),
    string: $ => choice(
      seq(
        '"',
        repeat(choice(
          alias($.unescaped_double_string_fragment, $.string_fragment),
          $.escape_sequence,
        )),
        '"',
      ),
      seq(
        '\'',
        repeat(choice(
          alias($.unescaped_single_string_fragment, $.string_fragment),
          $.escape_sequence,
        )),
        '\'',
      ),
    ),

    unescaped_double_string_fragment: _ => token.immediate(prec(1, /[^"\\\r\n]+/)),
    unescaped_single_string_fragment: _ => token.immediate(prec(1, /[^'\\\r\n]+/)),
    escape_sequence: _ => token.immediate(seq(
      '\\',
      choice(
        /[^xu0-7]/, // Any character except x, u, or octal digit
        /[0-7]{1,3}/, // Octal sequence
        /x[0-9a-fA-F]{2}/, // Hex sequence
        /u[0-9a-fA-F]{4}/, // Unicode sequence
        /u\{[0-9a-fA-F]+\}/, // Extended Unicode sequence
        /[\r?][\n\u2028\u2029]/ // Line continuation
      ),
    )),

    // --- Identifiers ---
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/, // Standard identifier pattern

    // --- Keywords (Case-Insensitive) ---
    kw_filter: $ => alias(token(make_keyword("filter")), $.keyword_operation),
    kw_return: $ => alias(token(make_keyword("return")), $.keyword_operation),
    kw_in: $ => alias(token(make_keyword("in")), $.keyword_operator), // Different alias category maybe
    kw_for: $ => alias(token(make_keyword("for")), $.keyword_operation),
    kw_let: $ => alias(token(make_keyword("let")), $.keyword_operation),
    kw_collect: $ => alias(token(make_keyword("collect")), $.keyword_operation),
    // kw_any_in: $ => alias(token(make_keyword("any in")), $.keyword_operation),
    kw_into: $ => alias(token(make_keyword("into")), $.keyword_operation),
    kw_insert: $ => alias(token(make_keyword("insert")), $.keyword_operation),
    kw_update: $ => alias(token(make_keyword("update")), $.keyword_operation),
    kw_upsert: $ => alias(token(make_keyword("upsert")), $.keyword_operation),
    kw_replace: $ => alias(token(make_keyword("replace")), $.keyword_operation),

    boolean: $ => alias(choice($._kw_true, $._kw_false), $.boolean_literal),
    null: $ => alias($._kw_null, $.null_literal),

    _kw_true: _ => token(make_keyword("true")),
    _kw_false: _ => token(make_keyword("false")),
    _kw_null: _ => token(make_keyword("null")),

    // --- Comments ---
    comment: $ => token(choice(
      seq('//', /.*/), // Single-line comment
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/') // Multi-line comment
    )),
  }
});

/**
 * Creates a case-insensitive regex for a keyword.
 * @param {string} word The keyword
 * @returns {RegExp}
 */
function make_keyword(word) {
  return new RegExp(word.split('').map(char => `[${char.toLowerCase()}${char.toUpperCase()}]`).join(''));
}

/**
 * Creates a rule for a comma-separated list of at least one item.
 * @param {RuleOrLiteral} rule The rule for the items
 * @returns {SeqRule}
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

/**
 * Creates a rule for an optional comma-separated list.
 * @param {RuleOrLiteral} rule The rule for the items
 * @returns {ChoiceRule}
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}
