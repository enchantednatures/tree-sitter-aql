package tree_sitter_aql_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_aql "github.com/enchantednatures/tree-sitter-aql/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_aql.Language())
	if language == nil {
		t.Errorf("Error loading Aql grammar")
	}
}
