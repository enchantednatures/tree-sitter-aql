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
        optional($.filter_expression),
        $.keyword_return,
      ),

    collection_selector: $ => choice($.collection_name, $.collection_bind_var),

    filter_expression: $ => seq(
      $.keyword_filter,
      $.item,
      $.comparison_operator,
      $.item // this can also be a bind var
    ),

    item: $ => choice(
      $.identifier,
      seq('"', /[a-z_]+/, '"'),
      seq("'", /[a-z_]+/, "'"),
      seq($.identifier, '.', $.identifier),
      seq($.identifier, '.', '[', $.identifier, ']'),
    ),

    comparison_operator: $ => choice(
      '==',
      '!=',
      '<',
      '<=',
      '>',
      '>=',
      // 'like', // todo
    ),

    iter_collection_expression: ($) => seq(
      $.keyword_for,
      $.identifier,
      $.keyword_in,
      $.collection_selector
    ),

    collection_bind_var: $ => /@@[a-z_]+/,
    collection_name: $ => /[a-z_]+/,

    keyword_filter: _ => make_keyword("filter"),
    keyword_return: _ => make_keyword("return"),
    keyword_any: _ => make_keyword("any"),
    keyword_outbound: _ => make_keyword("outbound"),
    keyword_inbound: _ => make_keyword("inbound"),
    keyword_graph: _ => make_keyword("graph"),
    keyword_in: _ => make_keyword("in"),
    keyword_for: _ => make_keyword("for"),

    // aql is similar to javascript in object shapes, we'll 'borrow' from the js grammar here

    _property_name: $ => choice(
      alias(
        $.identifier,
        $.property_identifier,
      ),
      $.string,
    ),

    pair: $ => seq(
      field('key', $._property_name),
      ':',
      field('value', $.expression),
    ),


    expression: $ => choice(
      $.identifier,
      $.value
    ),

    object: $ => prec('object', seq(
      '{',
      commaSep(optional(choice(
        $.pair,
        alias(
          $.identifier,
          $.shorthand_property_identifier,
        ),
      ))),
      '}',
    )),

    return_statement: ($) =>
      seq(
        $.keyword_return,
        $.identifier, //todo choice
      ),

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

    value: $ => choice(
      $.string,

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
        /[\r?][\n\u2028\u2029]/,
      ),
    )),
  },


});

function make_keyword(word) {
  let str = "";
  for (var i = 0; i < word.length; i++) {
    str = str + "[" + word.charAt(i).toLowerCase() + word.charAt(i).toUpperCase() + "]";
  }
  return new RegExp(str);
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}
