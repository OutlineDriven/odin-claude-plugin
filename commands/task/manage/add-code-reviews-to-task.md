Critically evaluate code reviews and convert only valid feedback into actionable tasks.

Usage:

- `/add-code-reviews-to-task [code reviews content]` - Process provided reviews

Arguments: $ARGUMENTS

## Instructions

1. **Parse the provided reviews** from arguments:
   - Extract individual review items from the input text
   - Handle multiple reviewers' feedback
   - Identify review boundaries and structure
   - Separate distinct feedback points

2. **Filter and validate only proper reviews**:
   - MUST analyze codebase context if each review item is valid and feasible
   - MUST ensure reviews are right by checking against the codebase
   - Reject reviews that are:
     - Logically flawed
     - Wrongly directed (e.g., referencing non-existent files)
     - Outdated or based on deprecated practices
     - Seems to be hallucinated or misinterpreted
     - Too generic or vague
     - Not actionable or specific
     - Based on incorrect assumptions or outdated practices
     - Conflicting with project conventions or requirements
   - Structurally analyze reviews with codebases

3. **Parse and validate each review item**:
   - Extract specific actionable feedback items
   - Categorize by type:
     - **Security**: Vulnerabilities, auth issues, data exposure
     - **Performance**: Bottlenecks, inefficient algorithms, resource usage
     - **Quality**: Code smells, maintainability issues, documentation gaps
     - **Bugs**: Logic errors, edge cases, potential failures
     - **Architecture**: Design flaws, coupling issues, pattern violations
   - Analyze and check if each review item is valid and sane.
   - Generate more better approach in reviews, also generate your own suggestions in parallel to reviewers

4. **Critical evaluation criteria**:
   - **Valid reviews must**:
     - Be specific and actionable (not vague suggestions)
     - Reference actual code locations or patterns
     - Have clear rationale and impact explanation
     - Be technically accurate and feasible
   - **Reject reviews that**:
     - Are overly generic ("improve error handling")
     - Conflict with project conventions or requirements
     - Suggest premature optimization
     - Are based on outdated practices
     - Lack concrete justification

5. **Convert only valid reviews to tasks**:
   - For each accepted review item:
     - Create task title: "[Review] {Category}: {Brief description}"
     - Set priority based on severity:
       - **High**: Security issues, critical bugs, data loss risks
       - **Medium**: Performance issues, code quality problems
       - **Low**: Minor improvements, style issues
     - Include in task description:
       - Original review feedback
       - File/location references
       - Suggested fix approach
       - Acceptance criteria

6. **Add to task management**:
   - Add tasks using TodoWrite tool
   - Tag with "code-review" and category
   - Group related reviews together
   - Maintain traceability to original review

7. **Generate review summary**:
   ```
   ✓ Processed code reviews

   Reviews analyzed: X
   Valid reviews accepted: Y
   Reviews rejected: Z

   Added tasks by category:
   - Security: X high, Y medium
   - Performance: X medium, Y low
   - Quality: X medium, Y low
   - Bugs: X high, Y medium

   Rejected reasons:
   - Too generic: X items
   - Conflicts with requirements: Y items
   - Not actionable: Z items

   Next steps:
   - View new tasks: /task-list --tag=code-review
   - Prioritize critical items: /task-list --priority=high --tag=code-review
   ```

## Examples

Process mixed quality reviews:
```
/add-code-reviews-to-task
Review 1: In auth.js line 45, SQL injection vulnerability - user input directly concatenated
Review 2: Code needs better comments everywhere
Review 3: The login() function in auth.js doesn't validate email format before querying DB
Review 4: Consider using more functional programming paradigms
Review 5: Memory leak in websocket.js:78 - event listeners not removed on disconnect
```

Expected outcome: Reviews 1, 3, and 5 accepted (specific); Reviews 2 and 4 rejected (too generic)

## Review Validation Examples

**Valid Review** (would be accepted):
```
File: src/auth/login.controller.ts:45
Issue: SQL injection vulnerability in user login
Details: User input is directly concatenated into SQL query without parameterization
Fix: Use parameterized queries or ORM with prepared statements
Impact: High - allows database access and potential data breach
```

**Invalid Review** (would be rejected):
```
Issue: Consider improving error handling
Details: Some functions could have better error handling
Fix: Add more try-catch blocks
```

## Review Sources and Quality Issues

This command handles reviews from various sources that may contain:
- **Hallucinated issues**: Problems that don't actually exist in the code
- **Misdirected feedback**: Reviews referencing wrong files or non-existent code
- **Generic advice**: Vague suggestions without specific implementation details
- **Conflicting opinions**: Different reviewers suggesting opposite approaches
- **Outdated practices**: Recommendations based on deprecated patterns

The command's critical evaluation process filters out:
- Reviews without verifiable code references
- Contradictory suggestions between reviewers
- Feedback that would break existing functionality
- Suggestions lacking concrete evidence or examples

## Critical Thinking Process

When evaluating reviews, apply these filters:

1. **Specificity Test**: Does it reference exact code locations?
2. **Impact Test**: Is the impact clearly explained and significant?
3. **Feasibility Test**: Can it be implemented without major refactoring?
4. **Context Test**: Does it align with project goals and constraints?
5. **Evidence Test**: Is there concrete evidence or examples?

Only reviews passing all tests are converted to tasks.
