/**
 * @file ArangoDB Query Language (AQL) Grammar
 * @author Hunter Casten <huntercasten@icloud.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
module.exports = grammar({
  name: 'aql',

  conflicts: $ => [
    [$._expression_atom, $.expression],
    [$.traversal_options, $.expression]
  ],

  extras: $ => [
    $.comment,
    /\s+/
  ],

  rules: {
    source_file: ($) => repeat1(
      choice(
        $.query,
        $.let_statement,
        $.return_operation,
      )
    ),

    query: ($) =>
      seq(
        choice(
          $.for_operation,
          seq($.for_traversal_operation, optional($.prune_operation))
        ),
        optional(repeat(choice(
          $.filter_operation,
        ))),
        $.return_operation,
      ),

    // --- Operations ---
    for_operation: ($) => seq(
      $.kw_for,
      field('variable', $.identifier),
      $.kw_in,
      field('collection', $.collection_selector)
    ),

    for_traversal_operation: ($) => seq(
      $.kw_for,
      commaSep1(field('variables', $.identifier)),
      $.kw_in,
      field('depth_range', $.depth_range),
      field('direction', $.traversal_direction),
      field('start_vertex', $.expression),
      optional(seq(
        $.kw_graph,
        field('graph_name', $.string)
      )),
      optional($.traversal_options)
    ),

    // Depth range for traversals (e.g., 1..5)
    depth_range: $ => seq(
      field('min_depth', optional($.number)),
      '..',
      field('max_depth', optional($.number))
    ),

    // Traversal direction
    traversal_direction: $ => choice(
      $.kw_outbound,
      $.kw_inbound,
      $.kw_any
    ),

    traversal_options: $ => seq(
      $.kw_options,
      $.object
    ),

    filter_operation: $ => seq(
      $.kw_filter,
      $.comparison_expression
    ),

    prune_operation: $ => seq(
      $.kw_prune,
      $.expression
    ),

    return_operation: $ => seq(
      $.kw_return,
      field('value', $.expression)
    ),

    // Add let statement
    let_statement: $ => seq(
      $.kw_let,
      field('variable', $.identifier),
      '=',
      field('value', $.expression)
    ),

    // --- Expressions ---
    expression: $ => prec(1, choice(
      $.member_expression,
      $.function_call
    )),

    function_call: $ => seq(
      field('function_name', $.identifier),
      '(',
      optional(commaSep1(field('arguments', $.expression))),
      ')'
    ),

    // Handles base identifiers, literals, and parenthesized expressions
    _expression_atom: $ => choice(
      $.identifier,
      $.literal,
      $.object,
      $.bind_parameter,
      $.collection_bind_parameter
      // Add $.array, seq('(', $.expression, ')') etc. here later
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
        field('property', $.expression),
        ']'
      ),
      // Array wildcard access p.edges[*]
      seq(
        field('object', $.member_expression),
        '[',
        '*',
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
      '>='
    ),

    // --- Collections ---
    collection_selector: $ => choice(
      $.collection_name,
      $.collection_bind_parameter
    ),

    collection_name: $ => $.identifier,

    // --- Bind Parameters ---
    // Collection bind parameter (@@name)
    collection_bind_parameter: $ => token(/@@[a-zA-Z_][a-zA-Z0-9_]*/),

    // Regular bind parameter (@name)
    bind_parameter: $ => token(/@[a-zA-Z_][a-zA-Z0-9_]*/),

    // --- Literals and Values ---
    literal: $ => choice(
      $.string,
      $.number,
      $.boolean,
      $.null
    ),

    value: $ => $.literal,

    object: $ => prec(2, seq(
      '{',
      commaSep(
        choice(
          $.object_pair,
          // Shorthand property { identifier } expands to { identifier: identifier }
          alias($.identifier, $.shorthand_property_identifier)
        )
      ),
      '}'
    )),

    object_pair: $ => seq(
      field('key', choice(
        alias($.identifier, $.property_identifier),
        $.string
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
        /[^xu0-7]/,
        /[0-7]{1,3}/,
        /x[0-9a-fA-F]{2}/,
        /u[0-9a-fA-F]{4}/,
        /u\{[0-9a-fA-F]+\}/,
        /[\r?][\n\u2028\u2029]/
      ),
    )),

    // --- Identifiers ---
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // --- Keywords (Case-Insensitive) ---
    kw_filter: $ => alias(token(make_keyword("filter")), $.keyword_operation),
    kw_return: $ => alias(token(make_keyword("return")), $.keyword_operation),
    kw_in: $ => alias(token(make_keyword("in")), $.keyword_operator),
    kw_for: $ => alias(token(make_keyword("for")), $.keyword_operation),
    kw_let: $ => alias(token(make_keyword("let")), $.keyword_operation),
    kw_collect: $ => alias(token(make_keyword("collect")), $.keyword_operation),
    kw_into: $ => alias(token(make_keyword("into")), $.keyword_operation),
    kw_insert: $ => alias(token(make_keyword("insert")), $.keyword_operation),
    kw_update: $ => alias(token(make_keyword("update")), $.keyword_operation),
    kw_upsert: $ => alias(token(make_keyword("upsert")), $.keyword_operation),
    kw_replace: $ => alias(token(make_keyword("replace")), $.keyword_operation),

    // Traversal keywords
    kw_outbound: $ => alias(token(make_keyword("outbound")), $.keyword_traversal),
    kw_inbound: $ => alias(token(make_keyword("inbound")), $.keyword_traversal),
    kw_any: $ => alias(token(make_keyword("any")), $.keyword_traversal),
    kw_graph: $ => alias(token(make_keyword("graph")), $.keyword_traversal),
    kw_prune: $ => alias(token(make_keyword("prune")), $.keyword_operation),
    kw_options: $ => alias(token(make_keyword("options")), $.keyword_traversal),

    boolean: $ => alias(choice($._kw_true, $._kw_false), $.boolean_literal),
    null: $ => alias($._kw_null, $.null_literal),

    _kw_true: _ => token(make_keyword("true")),
    _kw_false: _ => token(make_keyword("false")),
    _kw_null: _ => token(make_keyword("null")),

    // --- Comments ---
    comment: $ => token(choice(
      seq('//', /.*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
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
}// @ts-check
