# Prompts Log

Actual user prompts used in this assignment:

> Note: Personal identifiers and local paths have been redacted for privacy.

## Prompt 1

```text
I am starting a new Prodesk assignment.

Project: Dog Walking Service — Static Landing Page
Ticket ID: ENG-11833
Assignee: Assigned Engineer

Act as a senior frontend engineer and technical mentor.

First, inspect this newly opened project folder.

Technical constraints:
- Use semantic HTML5 and pure vanilla CSS only for the application.
- Do not use React, Next.js, Tailwind CSS, Bootstrap, or external UI libraries.
- Build a responsive Dog Walking Service landing page.
- Follow a clean monochromatic corporate design system.
- Use consistent spacing based on 16px and 32px.
- Ensure keyboard accessibility and appropriate ARIA labels.
- Handle form validation, empty states, and loading indicators where asynchronous operations are used.
- Sanitize text input before storing it in application state.
- Log exactly this message when the primary action completes:
  [Analytics] User interacted with Static Landing Page

TDD workflow:
1. Inspect the empty project.
2. Recommend a suitable test setup using Jest or Vitest.
3. List test cases for all acceptance criteria and edge cases.
4. Do not write application code yet.
5. Do not overwrite or generate unnecessary files.
6. Wait for my approval before proceeding.

Also explain each technical decision in beginner-friendly language.

For now, only inspect the project and provide your implementation plan.
```

## Prompt 2

```text
Approved. Proceed with creating the project directory at:

<project-root>/dog-walking-service

Initialize the Vitest + jsdom test setup and write the test suite first, following TDD.

Requirements:
- Write tests before application implementation.
- Cover the assignment acceptance criteria, accessibility, form validation, empty states, loading states where applicable, sanitization, and analytics logging.
- Use pure HTML5 and vanilla CSS for the application. Do not use React, Tailwind, Bootstrap, or external UI libraries.
- Test tooling may use Vitest and jsdom.
- Keep the scope aligned with the Static Landing Page assignment. Do not invent backend functionality.
- Keep the test setup simple and explain the purpose of each file.
- Do not implement the website yet.
- Run the tests and show that the relevant tests fail because the application implementation is not yet present, rather than because the test configuration is broken.
- Create or update PROMPTS.md only with the actual prompts used.
- Do not overwrite unnecessary files or introduce unrelated dependencies.

After writing the test suite, show me:
1. The folder structure.
2. Files created.
3. Test cases.
4. Actual test execution output.

Stop and wait for my review before implementing the website.
```

## Prompt 3

```text
The TDD test suite has been reviewed and approved.

Now implement the Dog Walking Service Static Landing Page to make all 15 existing tests pass.

Create only the required application files:
- index.html
- styles.css
- app.js

Requirements:

1. Use semantic HTML5 and pure vanilla CSS/JavaScript. No React, Tailwind, Bootstrap, or UI libraries.
2. Create a professional, responsive Dog Walking Service landing page with:
   - Header and navigation
   - Hero section with a clear call to action
   - Services section
   - About section
   - Walk request form
   - Empty state for requests
   - Footer with contact information
3. Follow a monochromatic corporate design system and consistent 16px/32px spacing.
4. Ensure keyboard navigation, visible focus styles, semantic landmarks, accessible labels, ARIA attributes, and a skip link.
5. Validate required fields and email format. Highlight invalid fields in red and set aria-invalid correctly.
6. Treat whitespace-only values as empty.
7. Implement sanitizeInput and sanitize all text inputs before storing them in application state. Never insert untrusted input using innerHTML.
8. Show a loading indicator during the asynchronous request simulation and prevent duplicate submissions.
9. Display the submitted request and remove the initial "No data found" empty state when a request is successfully submitted.
10. Log exactly:
[Analytics] User interacted with Static Landing Page
only after a successful primary action.
11. Do not invent real backend or booking functionality. Clearly treat the form as a frontend demonstration.
12. Preserve the existing tests and test configuration.
13. Update PROMPTS.md with the actual successful prompts, including the implementation prompt.

After implementation:
- Run all 15 existing tests.
- Fix genuine implementation failures without weakening or deleting tests.
- Run the project checks and report actual results.
- Show the final file structure and explain each file.

Do not claim success unless the commands actually pass.
```

## Prompt 4

```text
Review the current Dog Walking Service landing page against ENG-11833.

Keep the existing professional monochromatic design and layout.

Make these corrections:
1. Remove or clearly label unsupported business claims such as "99.4% On-Time Arrival", "100% Background Checked", "Bonded & Insured", and "Certified Handlers".
2. Do not invent real company credentials, statistics, or guarantees.
3. Keep the page clearly presented as a frontend demonstration.
4. Preserve all existing functionality and the 15 passing Vitest tests.
5. Do not introduce any framework or external UI library.

After changes, run npm test and report the actual result.
```

## Prompt 5

```text
Perform the final manual QA for ENG-11833.

1. Submit the walk request form with valid sample data and verify the request appears in the Scheduled Walk Requests (Demo State) panel.
2. Verify the loading indicator and disabled submit button while the request is processing.
3. Verify the success feedback is accessible to screen readers.
4. Submit invalid data and verify clear error feedback.
5. Scroll to the bottom and verify the footer is visible and properly styled.
6. Check the page at mobile width and verify there is no horizontal overflow.
7. Check the browser console for errors.

Do not use real personal information. Use fictional test data only.
Do not weaken or delete tests.
Run npm test again and report the actual results.

Also show the final project file structure and confirm whether PROMPTS.md contains the actual prompts used for this assignment.
```
