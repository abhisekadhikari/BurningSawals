# Analytics API Documentation

## Overview

The Analytics API provides comprehensive interaction tracking and analytics for questions in the Burning Sawals system. Users can like, super-like, or dislike questions, and the system tracks these interactions with real-time analytics.

## Authentication

All analytics endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Base URL

```
/api/analytics
```

---

## Question Interactions

### Add/Update Question Interaction

**POST** `/questions/:question_id/interact`

Add or update a user's interaction with a specific question.

**Parameters:**

-   `question_id` (path, required): Question ID (positive integer)

**Request Body:**

```json
{
  "interaction_type": "like" | "super_like" | "dislike"
}
```

**Response:**

```json
{
    "statusCode": 200,
    "message": "Interaction added successfully",
    "data": {
        "interaction_id": 123,
        "user_id": 456,
        "question_id": 789,
        "interaction_type": "like",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    }
}
```

### Remove Question Interaction

**DELETE** `/questions/:question_id/interact`

Remove a user's interaction with a specific question.

**Parameters:**

-   `question_id` (path, required): Question ID (positive integer)

**Request Body:**

```json
{
  "interaction_type": "like" | "super_like" | "dislike"
}
```

**Response:**

```json
{
    "statusCode": 200,
    "message": "Interaction removed successfully",
    "data": {
        "question_id": 789,
        "interaction_type": "like",
        "removed": true
    }
}
```

### Get User's Question Interactions

**GET** `/questions/:question_id/interactions`

Get all interactions a user has with a specific question.

**Parameters:**

-   `question_id` (path, required): Question ID (positive integer)

**Response:**

```json
{
    "statusCode": 200,
    "message": "User interactions retrieved successfully",
    "data": [
        {
            "interaction_id": 123,
            "user_id": 456,
            "question_id": 789,
            "interaction_type": "like",
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z"
        }
    ]
}
```

---

## Question Analytics

### Get Question Analytics

**GET** `/questions/:question_id`

Get comprehensive analytics for a specific question.

**Parameters:**

-   `question_id` (path, required): Question ID (positive integer)

**Response:**

```json
{
    "statusCode": 200,
    "message": "Question analytics retrieved successfully",
    "data": {
        "question_id": 789,
        "question": "What is the capital of France?",
        "prompt": "Think about European capitals",
        "created_at": "2024-01-10T08:00:00Z",
        "updated_at": "2024-01-10T08:00:00Z",
        "analytics": {
            "total_likes": 45,
            "total_super_likes": 12,
            "total_dislikes": 3,
            "total_interactions": 60,
            "last_updated": "2024-01-15T10:30:00Z"
        },
        "genres": [
            {
                "genre_id": 1,
                "name": "Geography",
                "type_id": 1,
                "type_name": "Multiple Choice"
            }
        ]
    }
}
```

### Get Questions with Analytics

**GET** `/questions`

Get all questions with their analytics, with pagination and sorting.

**Query Parameters:**

-   `page` (optional): Page number (default: 1)
-   `limit` (optional): Items per page (default: 20)
-   `sort_by` (optional): Sort field - `likes`, `super_likes`, `dislikes`, `total_interactions`, `created_at` (default: `total_interactions`)
-   `sort_order` (optional): Sort order - `asc`, `desc` (default: `desc`)

**Example Request:**

```
GET /api/analytics/questions?page=1&limit=10&sort_by=likes&sort_order=desc
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Questions with analytics retrieved successfully",
  "data": {
    "items": [
      {
        "question_id": 789,
        "question": "What is the capital of France?",
        "prompt": "Think about European capitals",
        "created_at": "2024-01-10T08:00:00Z",
        "updated_at": "2024-01-10T08:00:00Z",
        "analytics": {
          "total_likes": 45,
          "total_super_likes": 12,
          "total_dislikes": 3,
          "total_interactions": 60,
          "last_updated": "2024-01-15T10:30:00Z"
        },
        "genres": [...]
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 150,
    "total_pages": 15,
    "sort_by": "likes",
    "sort_order": "desc"
  }
}
```

---

## User Analytics

### Get User Analytics Summary

**GET** `/users/me`

Get the current user's analytics summary.

**Response:**

```json
{
    "statusCode": 200,
    "message": "User analytics retrieved successfully",
    "data": {
        "user_id": 456,
        "total_likes_given": 25,
        "total_super_likes_given": 8,
        "total_dislikes_given": 2,
        "total_interactions_given": 35,
        "last_updated": "2024-01-15T10:30:00Z"
    }
}
```

### Get User Interaction History

**GET** `/users/me/interactions`

Get the current user's interaction history with pagination.

**Query Parameters:**

-   `page` (optional): Page number (default: 1)
-   `limit` (optional): Items per page (default: 20)

**Response:**

```json
{
    "statusCode": 200,
    "message": "User interaction history retrieved successfully",
    "data": {
        "items": [
            {
                "interaction_id": 123,
                "user_id": 456,
                "question_id": 789,
                "interaction_type": "like",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z",
                "question": {
                    "question_id": 789,
                    "question": "What is the capital of France?",
                    "prompt": "Think about European capitals"
                }
            }
        ],
        "page": 1,
        "limit": 20,
        "total": 35,
        "total_pages": 2
    }
}
```

---

## Top Questions

### Get Top Questions

**GET** `/top-questions`

Get top questions by interaction type.

**Query Parameters:**

-   `type` (optional): Interaction type - `likes`, `super_likes`, `dislikes`, `total` (default: `total`)
-   `limit` (optional): Number of top questions to return (default: 10)

**Example Request:**

```
GET /api/analytics/top-questions?type=likes&limit=5
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Top questions retrieved successfully",
  "data": {
    "items": [
      {
        "question_id": 789,
        "question": "What is the capital of France?",
        "prompt": "Think about European capitals",
        "created_at": "2024-01-10T08:00:00Z",
        "updated_at": "2024-01-10T08:00:00Z",
        "analytics": {
          "total_likes": 45,
          "total_super_likes": 12,
          "total_dislikes": 3,
          "total_interactions": 60,
          "last_updated": "2024-01-15T10:30:00Z"
        },
        "genres": [...]
      }
    ],
    "type": "likes",
    "limit": 5
  }
}
```

---

## Error Responses

### Validation Error (400)

```json
{
    "status": 400,
    "message": "Validation error",
    "errors": [
        {
            "path": "interaction_type",
            "message": "interaction_type must be one of: like, super_like, dislike"
        }
    ]
}
```

### Not Found (404)

```json
{
    "statusCode": 404,
    "message": "Question not found",
    "error": null
}
```

### Unauthorized (401)

```json
{
    "error": "Missing token"
}
```

### Conflict (409)

```json
{
    "statusCode": 409,
    "message": "Interaction already exists",
    "error": null
}
```

---

## Usage Examples

### JavaScript/TypeScript

```javascript
// Add a like to a question
const response = await fetch("/api/analytics/questions/123/interact", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your-jwt-token",
    },
    body: JSON.stringify({
        interaction_type: "like",
    }),
});

const result = await response.json();
console.log(result);
```

### cURL

```bash
# Get question analytics
curl -X GET "http://localhost:8080/api/analytics/questions/123" \
  -H "Authorization: Bearer your-jwt-token"

# Get top liked questions
curl -X GET "http://localhost:8080/api/analytics/top-questions?type=likes&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

---

## Database Schema

The analytics system uses three main tables:

1. **question_interactions**: Stores individual user interactions
2. **question_analytics_summary**: Aggregated analytics per question
3. **user_analytics_summary**: Aggregated analytics per user

All tables are automatically maintained through database triggers for optimal performance.
