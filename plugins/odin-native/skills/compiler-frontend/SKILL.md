---
name: compiler-frontend
description: 'Use when building a lexer, Pratt or recursive-descent parser, AST, symbol table, type checker, or LLVM IR emitter for a language or DSL. Not for optimizing IR: use llvm-passes.'
---

# Compiler frontend

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user implements a language or DSL, adds expression parsing to an interpreter or config format, designs AST nodes in C or Rust, needs scoped symbols, basic type checking, error recovery, or wants a typed AST lowered to LLVM IR. |
| Authority | Reversible local: writes only the frontend source files the user names inside the project; rollback is version control. No remote mutation. |
| Side effect | Frontend source files are created or edited; a test input is lexed, parsed, checked, and, when requested, emitted as IR and verified. |
| Done | Each requested stage compiles, runs on the supplied test inputs, and the verification named for that stage passes: token stream matches, precedence tests pass, undefined and mismatched types are reported, generated IR passes the LLVM verifier. |

## Inputs

1. Language description (required): the token set, the grammar or a set of example programs, and the operators with their precedence and associativity.
2. Implementation language (required): C or Rust. C samples below use the LLVM C API in `llvm-c/`; in Rust use the `inkwell` or `llvm-sys` crates.
3. Requested stages (required): any subset of lexer, parser, symbol table, type checker, IR emitter.
4. Test inputs (required): at least one valid program per stage and one program with an error the stage must report.

## Procedure

1. Fix the pipeline: source to lexer (tokens) to parser (AST) to type checker to IR generator to LLVM IR. Write down which stages this task delivers. Done when: the delivered stages and their input and output types are listed.
2. Write the lexer as a hand-written state machine. Tokens carry a kind, a pointer into the source, a length, and any literal value. Skip whitespace, then dispatch on the first character: digits build an integer, letters build an identifier, single characters map to punctuation.

   ```c
   typedef enum { TOK_EOF, TOK_INT, TOK_IDENT, TOK_PLUS, TOK_MINUS,
                  TOK_LPAREN, TOK_RPAREN, TOK_SEMI, TOK_EQ, TOK_RETURN } TokenKind;

   typedef struct { TokenKind kind; const char *start; int length; int64_t int_val; } Token;
   typedef struct { const char *src; int pos; int line; } Lexer;

   Token lexer_next(Lexer *l) {
       while (l->src[l->pos] == ' ' || l->src[l->pos] == '\n') l->pos++;
       const char *start = &l->src[l->pos];
       if (isdigit((unsigned char)l->src[l->pos])) {
           int64_t val = 0;
           while (isdigit((unsigned char)l->src[l->pos]))
               val = val * 10 + (l->src[l->pos++] - '0');
           return (Token){ TOK_INT, start, (int)(&l->src[l->pos] - start), val };
       }
       if (isalpha((unsigned char)l->src[l->pos])) {
           while (isalnum((unsigned char)l->src[l->pos])) l->pos++;
           return (Token){ TOK_IDENT, start, (int)(&l->src[l->pos] - start), 0 };
       }
       switch (l->src[l->pos++]) {
           case '+': return (Token){ TOK_PLUS, start, 1, 0 };
           case '(': return (Token){ TOK_LPAREN, start, 1, 0 };
           case ')': return (Token){ TOK_RPAREN, start, 1, 0 };
           case ';': return (Token){ TOK_SEMI, start, 1, 0 };
           default:  return (Token){ TOK_EOF, start, 0, 0 };
       }
   }
   ```

   A generated lexer is the alternative when the token set is large: `flex lexer.l && gcc -o lexer lex.yy.c -lfl`. With flex, order rules so the longest match wins and keywords precede the identifier rule. Done when: every test input produces the expected token stream, including the EOF token.
3. Parse expressions with a Pratt parser. Each infix operator has a left and a right binding power; a higher power binds tighter, and right associativity is a right power one below the left. The loop consumes operators while their left power is at least the minimum.

   ```c
   typedef enum { AST_INT, AST_BINOP, AST_VAR } AstKind;
   typedef struct AstNode {
       AstKind kind;
       union {
           int64_t int_val;
           struct { int op; struct AstNode *lhs, *rhs; } binop;
           char *name;
       };
   } AstNode;

   enum { BP_NONE = 0, BP_SUM = 10, BP_PRODUCT = 20 };

   AstNode *parse_expression(Parser *p, int min_bp) {
       AstNode *left = parse_prefix(p);
       for (;;) {
           int lbp, rbp;
           if (!infix_binding_power(p->cur.kind, &lbp, &rbp) || lbp < min_bp) break;
           int op = p->cur.kind;
           advance(p);
           AstNode *right = parse_expression(p, rbp);
           left = make_binop(op, left, right);
       }
       return left;
   }
   ```

   Capture the operator before `advance`; reading `p->cur.kind` after the recursive call returns the wrong token. Done when: a table of expressions with expected trees passes, including mixed precedence and associativity cases.
4. Parse statements with recursive descent, one function per nonterminal. Every branch must consume at least one token or return; a branch that neither advances nor returns is the cause of an infinite loop.

   ```c
   AstNode *parse_statement(Parser *p) {
       if (p->cur.kind == TOK_IDENT && peek(p) == TOK_EQ) {
           char *name = take_ident(p);
           advance(p);
           AstNode *expr = parse_expression(p, BP_NONE);
           expect(p, TOK_SEMI);
           return make_assign(name, expr);
       }
       if (match(p, TOK_RETURN)) {
           AstNode *expr = parse_expression(p, BP_NONE);
           expect(p, TOK_SEMI);
           return make_return(expr);
       }
       return parse_expression_statement(p);
   }
   ```

   Done when: every statement form in the test inputs parses and every branch is audited for token progress.
5. Build the symbol table as a chain of scopes. Lookup walks from the innermost scope to the root; definition writes only into the current scope, so shadowing an outer name is allowed and redefining a name in the same scope is an error.

   ```c
   typedef struct Symbol { char *name; Type *type; LLVMValueRef llvm_val; struct Symbol *next; } Symbol;
   typedef struct Scope { Symbol *symbols; struct Scope *parent; } Scope;

   Symbol *scope_lookup(Scope *s, const char *name) {
       for (Scope *cur = s; cur; cur = cur->parent)
           for (Symbol *sym = cur->symbols; sym; sym = sym->next)
               if (strcmp(sym->name, name) == 0) return sym;
       return NULL;
   }

   void scope_define(Scope *s, const char *name, Type *type) {
       Symbol *sym = malloc(sizeof *sym);
       if (!sym) abort();
       sym->name = strdup(name); sym->type = type; sym->llvm_val = NULL;
       sym->next = s->symbols; s->symbols = sym;
   }
   ```

   Replace the linked list with a hash map when scopes hold more than a few dozen names. Done when: shadowing resolves to the inner name and a same-scope duplicate is rejected.
6. Type-check by walking the AST and returning a type per node. Integers have the integer type; a variable takes its symbol's type or reports "undefined"; a binary operation requires equal operand types.

   ```c
   Type *check_expr(Scope *s, AstNode *node) {
       switch (node->kind) {
       case AST_INT: return type_int();
       case AST_VAR: {
           Symbol *sym = scope_lookup(s, node->name);
           if (!sym) error("undefined variable %s", node->name);
           return sym->type;
       }
       case AST_BINOP: {
           Type *lt = check_expr(s, node->binop.lhs);
           Type *rt = check_expr(s, node->binop.rhs);
           if (!type_equal(lt, rt)) error("type mismatch in binary op");
           return lt;
       }
       }
       return type_void();
   }
   ```

   For an ML-style language with inference, assign a type variable to each unknown and unify on constraints (Hindley-Milner); this is a separate stage, not a change to the checker above. Done when: each error test input produces the expected diagnostic and valid inputs pass.
7. Recover from syntax errors with panic mode: on error, advance until a synchronizing token, then resume. Pick the synchronizing set per nonterminal (statement end `;`, block end `}`, statement-start keywords).

   ```c
   void synchronize(Parser *p) {
       advance(p);
       while (p->cur.kind != TOK_EOF) {
           if (p->prev.kind == TOK_SEMI) return;
           if (p->cur.kind == TOK_RETURN || p->cur.kind == TOK_IDENT) return;
           advance(p);
       }
   }
   ```

   Error productions for common mistakes and single-token insertion or deletion are the next steps when the frontend serves an editor. Done when: an input with two independent errors reports both, not a cascade from the first.
8. Emit LLVM IR from the typed AST through the C API. Create types from a context, build instructions through a builder, and use the typed load: the untyped `LLVMBuildLoad` is gone from the current C API (LLVM 23.1.0) and `LLVMInt32Type()` without a context is deprecated.

   ```c
   #include <llvm-c/Core.h>
   #include <llvm-c/Analysis.h>

   LLVMContextRef ctx; LLVMModuleRef module; LLVMBuilderRef builder;

   LLVMValueRef codegen_expr(Scope *s, AstNode *node) {
       switch (node->kind) {
       case AST_INT:
           return LLVMConstInt(LLVMInt32TypeInContext(ctx), (unsigned long long)node->int_val, 1);
       case AST_BINOP: {
           LLVMValueRef l = codegen_expr(s, node->binop.lhs);
           LLVMValueRef r = codegen_expr(s, node->binop.rhs);
           if (node->binop.op == TOK_PLUS) return LLVMBuildAdd(builder, l, r, "add");
           break;
       }
       case AST_VAR: {
           Symbol *sym = scope_lookup(s, node->name);
           return LLVMBuildLoad2(builder, LLVMInt32TypeInContext(ctx), sym->llvm_val, node->name);
       }
       }
       return NULL;
   }
   ```

   After emitting, dump and verify: `LLVMDumpModule(module);` and `LLVMVerifyModule(module, LLVMReturnStatusAction, &err);` where `LLVMVerifyModule` is declared in `llvm-c/Analysis.h`. Done when: the verifier returns success on every valid test input.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Parser loops forever | A branch consumed no token. Audit every branch of the failing nonterminal for `advance` or `return`; add the missing progress. |
| Wrong precedence | Binding powers are wrong. Fix the table and re-run the expression table test. |
| Duplicate symbol accepted or shadowing rejected | Lookup and define use the wrong scope. Lookup walks parents; define writes the current scope only. |
| LLVM verifier fails | An IR type mismatch, usually signedness, pointer level, or a load with the wrong type argument. Read the verifier message; fix the emitter for that node kind. |
| flex token clash | Overlapping patterns. Rely on longest match and order keyword rules before the identifier rule. |
| Error cascade | No synchronization. Implement panic-mode recovery per step 7. |

No partial result is claimed complete. If a stage cannot finish, the report states which stages passed their verification and which are blocked.

## Output

A frontend delivery containing:
1. Files written: each source file created or edited, per stage.
2. Verification: per stage, the test inputs run and the observed token stream, tree, diagnostic, or verifier result.
3. Open decisions: any grammar ambiguity or type rule the language description left undefined, with the choice made.
