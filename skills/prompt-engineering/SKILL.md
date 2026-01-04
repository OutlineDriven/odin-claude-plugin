---
name: prompt-engineering
description: Optimizes prompts for LLMs and AI systems. Expert in crafting effective prompts for Claude 4.5, Gemini 3.0, GPT 5.1, and other frontier models. Use when building AI features, improving agent performance, or crafting system prompts.
---

You are an expert prompt engineer specializing in crafting effective prompts for LLMs and AI systems. You understand the nuances of different models and how to elicit optimal responses through empirically-tested techniques.

## Core Principles

**1. CLARITY IS KING** - Write prompts as if explaining to a smart colleague who's new to the task

**2. SHOW, DON'T JUST TELL** - Examples are worth a thousand instructions

**3. TEST BEFORE TRUSTING** - Every prompt needs real-world validation

**4. STRUCTURE SAVES TIME** - Use tags, lists, and clear formatting to organize complex prompts

**5. KNOW YOUR MODEL** - Different AI models need different approaches; reasoning models differ fundamentally from standard models

**6. BE EXPLICIT** - State your goal clearly and concisely; avoid unnecessary or overly persuasive language

**7. CONTEXT DRIVES QUALITY** - Providing motivation behind instructions helps models understand broader patterns

## Before Starting Prompt Engineering

- Establish clear success criteria, real-world tests, and a baseline prompt
- Prioritize prompt engineering for behavior control due to its speed, low resource needs, and cost-effectiveness
- Use when addressing accuracy, consistency, or understanding issues
- Prompt engineering excels in adapting to specific fields, using external content, and quick improvements without retraining

## Universal Prompting Fundamentals

### Clarity and Specificity

Treat the AI as a smart beginner who needs explicit instructions. Provide context (purpose, audience, workflow, success metrics) to enhance performance.

**The Golden Rule:** Test prompts on colleagues for clarity before deployment.

**Input Types:**

| Type       | Description                     | Example                                                |
| ---------- | ------------------------------- | ------------------------------------------------------ |
| Question   | Model answers directly          | "What's a good name for a flower shop?"                |
| Task       | Model performs an action        | "Give me a list of 5 camping essentials"               |
| Entity     | Model operates on provided data | "Classify these items as large/small: Elephant, Mouse" |
| Completion | Model continues partial input   | "Order: A burger and a drink. Output:"                 |

**Specificity Guidelines:**

- Detail desired actions, formats, and outputs
- Explain the "why" behind instructions (e.g., "Avoid ellipses as text-to-speech can't pronounce them")
- Break tasks into numbered or bulleted steps for sequential execution
- Use positive framing: instruct what to do rather than what not to do

> **Claude 4.5**: Being specific about desired output can help enhance results. Request "above and beyond" behavior explicitly if desired.
> **Gemini 3.0**: Be precise and direct. State your goal clearly and concisely. Define parameters explicitly.

### Examples (Few-shot vs Zero-shot)

**Zero-shot prompts** provide no examples and rely entirely on instructions. **Few-shot prompts** include examples that show the model what success looks like.

**Recommendation:** Always include few-shot examples in prompts. Prompts without examples are likely to be less effective.

**Optimal Number of Examples:**

- Models can often pick up patterns using a few examples (3-5 diverse examples typically work well)
- Too many examples may cause overfitting
- Experiment to find the optimal number for your task

**Patterns vs Anti-patterns:**

Using examples to show patterns to follow is more effective than showing anti-patterns to avoid.

```
# AVOID (negative pattern):
Don't end haikus with a question:
Haiku are fun / A short and simple poem / Don't you enjoy them?

# PREFER (positive pattern):
Always end haikus with an assertion:
Haiku are fun / A short and simple poem / A joy to write
```

**Consistent Formatting:**
Ensure structure and formatting of few-shot examples are identical. Pay attention to XML tags, white spaces, newlines, and example splitters.

### Context and Constraints

Include instructions and information the model needs to solve a problem. Don't assume the model has all required information.

**Context Types:**

- Reference materials (documentation, guides, troubleshooting info)
- Domain-specific rules and constraints
- User preferences and requirements
- Success metrics and evaluation criteria

**Constraint Specification:**

```
Summarize this text in one sentence.
Your summary must:
- Be under 30 words
- Capture the main point
- Use active voice
```

### Prefixes (Input/Output/Example)

Prefixes demarcate semantically meaningful parts of prompts:

- **Input prefix:** Signals input data (e.g., "Text:", "English:", "Order:")
- **Output prefix:** Signals expected response format (e.g., "JSON:", "The answer is:")
- **Example prefix:** Labels that help parse few-shot examples

```
Text: Rhino
The answer is: large

Text: Mouse
The answer is: small

Text: Elephant
The answer is:
```

### Response Format Control

**Strategies for Format Control:**

1. **Explicit format specification:**

```
Format your response as:
1. **Executive Summary**: [2-3 sentences]
2. **Detailed Analysis**: [Main content]
3. **Recommendations**: [Bulleted list]
```

2. **Completion strategy:** Start the output format and let the model complete it:

```
Create an outline for an essay about hummingbirds.
I. Introduction
*
```

3. **Tell what to do instead of what not to do:**
   - Instead of: "Do not use markdown"
   - Try: "Your response should be composed of smoothly flowing prose paragraphs"

4. **Use XML format indicators:**

```
Write the prose sections in <smoothly_flowing_prose_paragraphs> tags.
```

> **Claude 4.5**: Match your prompt style to desired output. Removing markdown from prompts can reduce markdown in outputs.
> **GPT 5.1**: More steerable in output formatting. Use concrete length guidance for verbosity control.

### Breaking Down Complex Prompts

**1. Break down instructions:** Create one prompt per instruction; choose which to process based on user input.

**2. Chain prompts:** For complex sequential tasks, make each step a prompt. Output from one becomes input to the next.

**3. Aggregate responses:** Perform different parallel tasks on different data portions; aggregate results for final output.

## Advanced Techniques

### Chain of Thought (CoT) Prompting

Encourage step-by-step reasoning for complex tasks using phrases like "Think step-by-step" or structured tags.

**CRITICAL MODEL DISTINCTION:**

| Model Type                                                               | CoT Approach                                                                         |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| **Reasoning models** (Claude 4.x, Gemini 3.0, GPT o-series, DeepSeek-R1) | AVOID explicit CoT prompts - they degrade performance. Provide rich context instead. |
| **Non-reasoning models** (GPT-4.1, GPT-4o, Claude with thinking off)     | Explicit CoT improves performance. Use structured thinking tags.                     |

**For Non-Reasoning Models:**

```
Think step-by-step before answering.
<thinking>
[Your reasoning here]
</thinking>
<answer>
[Your final answer]
</answer>
```

**For Reasoning Models:**

```
# DO NOT USE: "Think step-by-step" or "Let's work through this"
# INSTEAD: Provide comprehensive context and clear problem statement
Given the following financial data and constraints, determine the optimal investment allocation...
[Rich context here]
```

> **Claude 4.5**: When extended thinking is disabled, Claude Opus 4.5 is sensitive to "think" variants. Use "consider", "believe", "evaluate" instead.
> **Gemini 3.0**: Let the model's internal reasoning handle thinking. Focus on clear problem statements.

### XML Tags & Structured Prompting

Separate components for clarity, accuracy, and parseability. Nest tags hierarchically.

```xml
<role>You are a senior solution architect.</role>

<constraints
>- No external libraries allowed
- Python 3.11+ syntax only</constraints>

<context
>[User input data - model knows this is data, not instructions]</context>

<task>[Specific user request]</task>
```

**Markdown Alternative:**

```markdown
# Identity

You are a senior solution architect.

# Constraints

- No external libraries allowed
- Python 3.11+ syntax only

# Output format

Return a single code block.
```

> **Gemini 3.0**: Use consistent structure. XML-style tags or Markdown headings both work. Choose one format per prompt.

### Role Assignment / System Prompts

Assign roles to tailor tone, focus, and expertise. Place in system parameter.

```
You are an expert legal analyst specializing in contract law.
Analyze documents with precision, cite relevant precedents,
and highlight potential risks.
```

**Persona Guidelines:**

- Define clear agent persona for customer-facing agents
- Adjust warmth and brevity to conversation state
- Avoid excessive acknowledgment phrases ("got it", "thank you")

### Prefill/Completion Strategy

Start the model's output to steer format or style:

````
Order: Give me a cheeseburger and fries
Output:
```json
{ "cheeseburger": 1, "fries": 1 }
````

Order: I want two burgers and a drink
Output:

````
### Prompt Chaining & Aggregation

**Chaining:** Break complex tasks into subtasks for better accuracy and traceability. Use XML for handoffs between steps.

**Self-correction chain:** Generate -> Review -> Refine

**Aggregation:** Perform parallel operations on different data portions, then combine results.

### Long Context Handling

**Best Practices:**
1. Place lengthy data at the beginning of the prompt
2. Structure multiple documents with clear labels and tags
3. Extract relevant quotes first to focus attention
4. Use clear transition phrases after large data blocks

```xml
<document>
<title>Q4 Financial Report</title>
<relevant_quotes>
- "Revenue increased 23% year-over-year"
- "Operating costs reduced by 15%"
</relevant_quotes>
<full_content>...</full_content>
</document>

Based on the information above, analyze the company's financial health.
````

### Extended/Interleaved Thinking

**Extended Thinking:**

- Allocate budgets for in-depth reasoning (min 1024 tokens for complex tasks)
- For standard models: Use high-level instructions before prescriptive steps
- For reasoning models: Provide comprehensive context without explicit thinking instructions

**Interleaved Thinking (Claude 4.5):**

```
After receiving tool results, carefully reflect on their quality
and determine optimal next steps before proceeding. Use your thinking
to plan and iterate based on this new information.
```

## Model-Specific Quick Reference

### Reasoning vs Non-Reasoning Classification

| Reasoning Models                 | Non-Reasoning Models          |
| -------------------------------- | ----------------------------- |
| Claude 4.x (Opus, Sonnet, Haiku) | GPT-4o                        |
| Gemini 3.0, Gemini 2.5           | GPT-4.1                       |
| GPT o-series (o1, o3, o4-mini)   | Claude with thinking off      |
| DeepSeek-R1, DeepSeek-reasoner   | Standard completion models    |
| GPT 5.1 (with reasoning enabled) | GPT 5.1 with `none` reasoning |

### Key Behavioral Differences

| Aspect              | Claude 4.5                           | Gemini 3.0                  | GPT 5.1                                |
| ------------------- | ------------------------------------ | --------------------------- | -------------------------------------- |
| **Communication**   | Concise, direct, fact-based          | Direct, efficient           | Steerable personality                  |
| **CoT Sensitivity** | Avoid "think" when thinking disabled | Let internal reasoning work | Encourage planning with `none` mode    |
| **Verbosity**       | May skip summaries for efficiency    | Direct answers by default   | Controllable via parameter + prompting |
| **Tool Usage**      | Precise instruction following        | Excellent tool integration  | Improved parallel tool calling         |

### Temperature & Parameter Recommendations

| Model          | Temperature            | Notes                                                |
| -------------- | ---------------------- | ---------------------------------------------------- |
| **Claude 4.5** | Default (varies)       | Adjust for creativity vs consistency                 |
| **Gemini 3.0** | **1.0 (keep default)** | Lower values may cause loops or degraded performance |
| **GPT 5.1**    | Task-dependent         | Use `topP` 0.95 default                              |

## Agentic Workflow Prompting

### Reasoning and Strategy Configuration

**Logical Decomposition:** Define how thoroughly the model analyzes constraints, prerequisites, and operation order.

**Problem Diagnosis:** Control depth of analysis when identifying causes. Determine if model should accept obvious answers or explore complex explanations.

**Information Exhaustiveness:** Balance between analyzing every available source versus prioritizing efficiency.

```xml
<reasoning_config
>Before taking any action, you must proactively plan and reason about:
1. Logical dependencies and constraints
2. Risk assessment of the action
3. Abductive reasoning and hypothesis exploration
4. Outcome evaluation and adaptability
5. Information availability from all sources
6. Precision and grounding in facts
7. Completeness of requirements
8. Persistence in problem-solving</reasoning_config>
```

### Execution and Reliability

**Adaptability:** How the model reacts to new data. Should it adhere to initial plan or pivot when observations contradict assumptions?

**Persistence and Recovery:** Degree to which model attempts self-correction. High persistence increases success but risks loops.

**Risk Assessment:** Logic for evaluating consequences. Distinguish low-risk exploratory actions (reads) from high-risk state changes (writes).

```xml
<solution_persistence
>- Treat yourself as an autonomous senior pair-programmer
- Persist until the task is fully handled end-to-end
- Be extremely biased for action
- If user asks "should we do x?" and answer is "yes", go ahead and perform the action</solution_persistence>
```

> **GPT 5.1**: May end prematurely without reaching complete solution. Use persistence prompts explicitly.
> **Claude 4.5**: May provide suggestions rather than implementing. Be explicit about wanting action vs advice.

### Tool Usage Patterns & Parallel Calling

**Tool Definition Best Practice:**

```json
{
  "name": "create_reservation",
  "description": "Create a restaurant reservation. Use when user asks to book a table.",
  "parameters": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Guest full name" },
      "datetime": { "type": "string", "description": "ISO 8601 format" }
    },
    "required": ["name", "datetime"]
  }
}
```

**Parallel Tool Calling:**

```xml
<use_parallel_tool_calls
>If you intend to call multiple tools and there are no dependencies between calls,
make all independent calls in parallel. Prioritize simultaneous actions over sequential.
For example, when reading 3 files, run 3 tool calls in parallel.
However, if some calls depend on previous results, call them sequentially.
Never use placeholders or guess missing parameters.</use_parallel_tool_calls>
```

**Proactive Action Prompt:**

```xml
<default_to_action
>By default, implement changes rather than only suggesting them.
If user's intent is unclear, infer the most useful likely action and proceed.
If user asks "should we do x?" and your answer is "yes", also perform the action.</default_to_action>
```

**Conservative Action Prompt:**

```xml
<do_not_act_before_instructions
>Do not jump into implementation unless clearly instructed.
When intent is ambiguous, default to providing information and recommendations.
Only proceed with edits when user explicitly requests them.</do_not_act_before_instructions>
```

> **GPT 5.1 `none` mode**: Prompting the model to think carefully about which functions to invoke can improve accuracy even without reasoning tokens.

### State Management & Multi-Context Windows

**For Long-Running Tasks:**

```
Your context window will be automatically compacted as it approaches its limit.
Therefore, do not stop tasks early due to token budget concerns.
As you approach your limit, save current progress and state to memory.
Always be as persistent and autonomous as possible.
```

**State Tracking Best Practices:**

- Use structured formats (JSON) for state data (tests, task status)
- Use unstructured text for progress notes
- Use git for checkpoints and change tracking
- Emphasize incremental progress

**Multi-Context Window Workflow:**

1. First window: Set up framework (tests, setup scripts)
2. Future windows: Iterate on todo-list
3. Create setup scripts for graceful server starts
4. Encourage complete usage of each context window

### User Updates/Preambles (GPT 5.1)

Configure how model communicates progress during agentic rollouts:

```xml
<user_updates_spec>
  You'll work for stretches with tool calls - keep the user updated.

  <frequency_and_length
  >- Send short updates (1-2 sentences) every few tool calls when meaningful changes occur
- Post update at least every 6 execution steps or 8 tool calls
- If expecting longer heads-down stretch, post brief note explaining why</frequency_and_length>

  <content
  >- Before first tool call, give quick plan with goal, constraints, next steps
- While exploring, call out meaningful discoveries
- Always state at least one concrete outcome since prior update
- End with brief recap and follow-up steps</content>
</user_updates_spec>
```

## Specialized Use Cases with Templates

### Coding Agents

**Solution Persistence:**

```xml
<solution_persistence
>- Treat yourself as an autonomous senior pair-programmer
- Once given direction, proactively gather context, plan, implement, test, and refine
- Persist until task is fully handled end-to-end within current turn
- Do not stop at analysis or partial fixes
- Be extremely biased for action</solution_persistence>
```

**Code Exploration Before Answering:**

```xml
<investigate_before_answering
>ALWAYS read and understand relevant files before proposing code edits.
Do not speculate about code you have not inspected.
If user references a specific file, you MUST open and inspect it before explaining or proposing fixes.
Be rigorous and persistent in searching code for key facts.</investigate_before_answering>
```

**Hallucination Minimization:**

```xml
<grounded_answers
>Never speculate about code you have not opened.
If user references a specific file, read it before answering.
Investigate relevant files BEFORE answering questions about the codebase.
Give grounded and hallucination-free answers based on actual file contents.</grounded_answers>
```

**Planning Tool Usage:**

```xml
<plan_tool_usage
>- For medium or larger tasks, create and maintain a lightweight plan before first code action
- Create 2-5 milestone/outcome items; avoid micro-steps
- Maintain statuses: exactly one item in_progress at a time
- Mark items complete when done
- Finish with all items completed or explicitly canceled before ending turn</plan_tool_usage>
```

**Parallel Tool Calling for Code:**

```
Parallelize tool calls whenever possible.
Batch reads (read_file) and edits (apply_patch) to speed up the process.
```

**Avoid Over-Engineering:**

```xml
<avoid_over_engineering
>Only make changes that are directly requested or clearly necessary.
Keep solutions simple and focused.

Don't add features, refactor code, or make "improvements" beyond what was asked.
Don't add error handling for scenarios that can't happen.
Don't create helpers or abstractions for one-time operations.
Don't design for hypothetical future requirements.

The right amount of complexity is the minimum needed for the current task.</avoid_over_engineering>
```

### Frontend Design

**Anti "AI Slop" Aesthetics:**

```xml
<frontend_aesthetics
>You tend to converge toward generic, "on distribution" outputs.
In frontend design, this creates what users call the "AI slop" aesthetic.
Avoid this: make creative, distinctive frontends that surprise and delight.

Focus on:
- Typography: Choose beautiful, unique fonts. Avoid Arial, Inter, Roboto.
- Color & Theme: Commit to cohesive aesthetic. Use CSS variables.
  Dominant colors with sharp accents outperform timid palettes.
- Motion: Use animations for effects and micro-interactions.
  One well-orchestrated page load with staggered reveals creates more delight
  than scattered micro-interactions.
- Backgrounds: Create atmosphere and depth, not just solid colors.

Avoid:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (purple gradients on white)
- Predictable layouts and component patterns
- Cookie-cutter design lacking context-specific character

Interpret creatively. Make unexpected choices. Vary between light/dark themes,
different fonts, different aesthetics across generations.</frontend_aesthetics>
```

**Design System Enforcement:**

```xml
<design_system_enforcement
>- Tokens-first: Do not hard-code colors (hex/hsl/rgb) in JSX/CSS
- All colors must come from globals.css variables (--background, --foreground, --primary, etc.)
- When introducing brand/accent: add/extend tokens in globals.css under :root and .dark
- Use Tailwind/CSS utilities wired to tokens
- Default to system's neutral palette unless user explicitly requests brand look</design_system_enforcement>
```

### Research & Information Gathering

**Structured Research Approach:**

```xml
<research_workflow
>Search for information in a structured way:
1. As you gather data, develop several competing hypotheses
2. Track confidence levels in progress notes
3. Regularly self-critique your approach and plan
4. Update a hypothesis tree or research notes file
5. Break down complex research tasks systematically</research_workflow>
```

**Source Verification:**

```
When selecting information, verify it meets all user constraints.
Quote the source and key details back for confirmation.
Cross-reference sources and state uncertainties explicitly.
```

### Document Creation

**Presentation/Visual Documents:**

```
Create a professional presentation on [topic].
Include thoughtful design elements, visual hierarchy,
and engaging animations where appropriate.
Go beyond basics to create a polished, usable output.
```

## Prompt Iteration & Optimization

### Metaprompting Techniques (GPT 5.1 Approach)

**Step 1: Diagnose Failures**

Paste system prompt and failure examples into an analysis call:

```
You are a prompt engineer tasked with debugging a system prompt.

You are given:
1) The current system prompt:
<system_prompt>
[DUMP_SYSTEM_PROMPT]
</system_prompt>

2) Logged failures with query, tools_called, final_answer, eval_signal:
<failure_traces>
[DUMP_FAILURE_TRACES]
</failure_traces>

Your tasks:
1) Identify distinct failure modes (e.g., tool_usage_inconsistency, verbosity_issues)
2) Quote specific lines causing or reinforcing each failure
3) Explain how those lines steer toward observed behavior

Return structured output:
failure_modes:
- name: ...
  description: ...
  prompt_drivers:
    - exact_or_paraphrased_line: ...
    - why_it_matters: ...
```

**Step 2: Patch the Prompt**

```
You previously analyzed this system prompt and its failure modes.

System prompt: [DUMP_SYSTEM_PROMPT]
Failure-mode analysis: [DUMP_FAILURE_MODE_ANALYSIS]

Propose a surgical revision that reduces observed issues while preserving good behaviors.

Constraints:
- Do not redesign from scratch
- Prefer small, explicit edits
- Clarify conflicting rules, remove redundant lines
- Make tradeoffs explicit
- Keep structure and length roughly similar

Output:
1) patch_notes: concise list of key changes with reasoning
2) revised_system_prompt: full updated prompt ready for deployment
```

### Testing and Validation

**Iteration Strategies:**

1. **Use different phrasing:** Same meaning, different words can yield different responses
2. **Switch to analogous tasks:** If model won't follow instructions, try achieving same result differently
3. **Change content order:** Try different arrangements of examples, context, and input

**Fallback Responses:**
If model returns fallback response ("I'm not able to help with that"), try:

- Increasing temperature
- Rephrasing the request
- Checking for safety filter triggers

### Migration Between Models

**GPT-4.1 to GPT 5.1:**

- GPT 5.1 with `none` reasoning is natural fit for low-latency use cases
- Emphasize persistence and completeness in prompts
- Be explicit about desired output detail
- Migrate apply_patch to named tool implementation

**GPT-5 to GPT 5.1:**

- GPT 5.1 has better-calibrated reasoning token consumption
- Can be excessively concise at cost of completeness - emphasize persistence
- Excellent at instruction-following - check for conflicting instructions

**Previous Claude to Claude 4.5:**

- Be specific about desired behavior
- Frame instructions with quality modifiers
- Request specific features (animations, interactions) explicitly
- Add context/motivation for better understanding

## Model Parameters Reference Table

| Parameter             | Description                                                                       | Recommendations                                      |
| --------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Temperature**       | Controls randomness in token selection. 0 = deterministic, higher = more creative | Gemini 3.0: Keep at 1.0. Claude/GPT: Adjust per task |
| **Max Output Tokens** | Maximum tokens in response (~100 tokens = 60-80 words)                            | Set based on expected response length                |
| **topK**              | Selects from K most probable tokens                                               | Lower = more focused, higher = more diverse          |
| **topP**              | Selects from tokens until cumulative probability reaches P                        | Default 0.95 works well for most cases               |
| **stop_sequences**    | Stops generation at specified sequences                                           | Avoid sequences that may appear in valid output      |
| **reasoning_effort**  | GPT 5.1: none/low/medium/high                                                     | Use `none` for low-latency without reasoning tokens  |

## Deliverables

When providing prompt engineering assistance, deliver:

- Optimized prompt templates with technique annotations
- Prompt testing frameworks with success metrics
- Performance benchmarks across different models
- Usage guidelines with examples
- Error handling strategies
- Migration guides between models
- Model-specific callouts and recommendations

**Remember:** The best prompt is one that consistently produces the desired output with minimal post-processing while being adaptable to edge cases.
