; Standard captures: https://github.com/nvim-treesitter/nvim-treesitter/blob/master/CONTRIBUTING.md#highlights

; Keywords
(keyword_operation) @keyword       ; FOR, FILTER, RETURN
(keyword_operator) @keyword.operator ; IN (and future operators like AND, OR)

; Literals
(string) @string
(escape_sequence) @string.escape
(number) @number
(boolean_literal) @boolean  ; Targets the alias node created for true/false
(null_literal) @constant.builtin ; Targets the alias node created for null

; Identifiers and Variables
(identifier) @variable ; Default for identifiers

; Collection names (more specific type)
(collection_selector
  (collection_name
    (identifier) @type)) ; Highlight collection names as types

; Collection bind variables
(collection_bind_var) @constant ; Or @variable.parameter

; Object properties
(object_pair
  key: (property_identifier) @property)
(object_pair
  key: (string) @property) ; String keys
(shorthand_property_identifier) @property

; Member access
(member_expression
  property: (identifier) @property)

; Operators
(comparison_operator) @operator

; Punctuation
"." @punctuation.delimiter
"[" @punctuation.bracket
"]" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket
":" @punctuation.delimiter
"," @punctuation.delimiter

; Comments
(comment) @comment

