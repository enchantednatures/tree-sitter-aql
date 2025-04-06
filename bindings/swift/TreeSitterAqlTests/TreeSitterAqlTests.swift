import XCTest
import SwiftTreeSitter
import TreeSitterAql

final class TreeSitterAqlTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_aql())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Aql grammar")
    }
}
