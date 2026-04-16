# Task Approval Service

## Context

Build a small backend service for a team workflow system where tasks are created and approved.

This exercise is intended to evaluate:

- Hands-on coding capability
- Code structure and quality
- System design approach
- Engineering decision-making

## Problem Statement

Build a Task Approval API service with the following capabilities:

### 1. Create Task

A user can create a task.

Fields:
- `title` (required)
- `description` (optional)
- `createdBy`

### 2. Approve Task

A task can be approved by another user.

Only users with roles:
- `TEAM_LEAD`
- `MANAGER`

Once approved:
- The task cannot be modified

### 3. List Tasks

Retrieve all tasks.

### 4. Audit Logs

Every action must be logged:
- Task created
- Task approved

## Business Rules

- Title cannot be empty
- Task status should support:
  - `PENDING`
  - `APPROVED`
  - `REJECTED` (optional)
- Once a task is approved:
  - It cannot be re-approved
  - It cannot be modified
- Approval by an unauthorized role must fail

## Technical Expectations

You may use any language or framework of your choice.

Your solution must clearly demonstrate:

### 1. Code Structure

Clear separation of:
- API layer
- Business logic
- Data layer

### 2. Validation

- Proper input validation
- Proper error handling

### 3. Testing

- Minimum 3–5 meaningful test cases
- Focus on business rules, not just happy paths

### 4. Storage

- In-memory storage is acceptable
- Bonus: Database integration

### 5. Documentation

Please include:
- Steps to run the project
- API documentation (Postman / curl / OpenAPI)

## Mandatory Explanation (Important)

Along with your code submission, include a brief note covering:

- How your code is structured and why
- How you would scale this solution to production
- How you would handle:
  - Concurrency (e.g., double approval scenarios)
  - Audit logging at scale
- What improvements you would make with additional time

## Time Expectation

- Approx. 2–4 hours effort
- Focus on clarity, correctness, and design quality

## Important Note

- Please do not rely on auto-generated code without understanding
- You should be able to explain your implementation in detail during discussion
- Kindly share your submission within the agreed timeline
