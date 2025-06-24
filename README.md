# LearnOsphere - Backend

This repository contains the backend for the LearnOsphere online learning platform. It provides the API endpoints and handles data management for the frontend application.

---

## ✨ Features

* **User Authentication & Authorization:** Secure user registration, login, and access control using JSON Web Tokens (JWT).
    * **JWT Creation (`/jwt`):** Issues a JWT token upon successful authentication, setting it as an HTTP-only cookie.
    * **User Logout (`/logout`):** Clears the authentication cookie to log users out.
    * **Token Verification (`varifyToken` middleware):** Protects routes by validating the JWT from incoming requests.
* **User Management (`/user`):**
    * **User Creation:** Allows new users to be registered in the database.
    * **User Retrieval:** Fetches user details, including an aggregated list of `enrolledCourseIds` by performing a `$lookup` with the `enrollments` collection.
    * **User Update:** Updates existing user profiles.
* **Category Management (`/category`, `/categories`):**
    * **Category Creation:** Adds new course categories.
    * **Category Retrieval:** Fetches all categories, with options for `limit`, `sortBy`, and `orderBy` (e.g., `createdAt` for sorting).
* **Course Management (`/course`, `/courses`):**
    * **Course Creation:** Adds new courses to the platform.
    * **Single Course Retrieval (`/course/:id`):** Fetches detailed information for a specific course, including aggregated `numberOfReview` and `averageRating` by performing a `$lookup` with the `reviews` collection.
    * **All Courses Retrieval (`/course` or `/courses`):** Fetches a list of all courses.
    * **Filtered/Sorted Courses (`/courses` with query parameters):** Supports filtering by `free`/`price` or `category`, and allows sorting by various fields (e.g., `createdAt`) with `limit` and `orderBy` options. This uses a comprehensive aggregation pipeline.
    * **Mentor-Specific Courses (`/courses/:uid`):** Retrieves courses posted by a specific mentor, protected by `varifyToken` to ensure authorized access.
    * **Course Update:** Modifies existing course details.
    * **Course Deletion:** Removes courses from the database.
* **Review Management (`/review`, `/reviewsByCourseId/:id`):**
    * **Review Creation:** Allows users to submit reviews for courses.
    * **Reviews by Course ID:** Fetches all reviews for a specific course, including reviewer `displayName` and `photoURL` by performing a `$lookup` with the `user` collection.
    * **Review Deletion:** Deletes a specific review.
* **Enrollment Management (`/enrollment`, `/enrollments/:uid`):**
    * **Enroll/Unenroll (`/enrollment` with `enroll` status):** Handles both enrollment and unenrollment of users in courses using **MongoDB transactions** to ensure data consistency across `enrollments`, `courses` (incrementing/decrementing `totalEnrollment` and `RemainingSeat`), and `user` collections (incrementing/decrementing `totalEnrolled` and adding/removing `enrolledCourseIds`).
    * **User Enrollments (`/enrollments/:uid`):** Fetches all enrollments for a specific user, including details of the enrolled courses.
    * **Enrollment Deletion:** Allows the removal of an enrollment record.
* **Blog Management (`/blog`, `/blogs`):**
    * **Blog Post Creation:** Allows the addition of new blog posts.
    * **Blog Post Retrieval:** Fetches all blog posts, including the author's display name and photo.

---

## 🛠️ Technologies Used

The LearnOsphere backend is built with a focus on efficiency, scalability, and security.

* **Node.js:** The JavaScript runtime environment.
* **Express.js:** A fast, unopinionated, minimalist web framework for Node.js, used for building robust APIs.
* **MongoDB:** A NoSQL database used for storing all application data.
    * **`MongoClient` & `ServerApiVersion`:** Directly interacts with MongoDB for database operations.
    * **`ObjectId`:** Used for handling MongoDB's unique document identifiers.
    * **Transactions:** Employed for critical operations like enrollment/unenrollment to maintain data integrity across multiple collections.
* **JSON Web Token (`jsonwebtoken`):** For secure authentication and authorization, handling token signing and verification.
* **CORS (`cors`):** Middleware configured to allow Cross-Origin Resource Sharing from specified frontend origins (`http://localhost:5173`, `https://learn-osphere.web.app`).
* **Dotenv (`dotenv`):** For loading environment variables (like `PORT`, `MONGODB_URI`, `JWT_ACCESS_SECRET`) from a `.env` file, keeping sensitive information out of the codebase.
* **Cookie-parser (`cookie-parser`):** Middleware for parsing cookies attached to the client request object, essential for handling JWTs stored as HTTP-only cookies.

---

## 🚀 Getting Started

To get the backend server up and running on your local machine, follow these simple steps.

### Prerequisites

Make sure you have **Node.js** and **npm** installed. **MongoDB** should also be installed and running.

* **Node.js & npm:**
    ```bash
    npm install npm@latest -g
    ```
* **MongoDB:** [Install MongoDB](https://docs.mongodb.com/manual/installation/)

### Running the Server

1.  Create a **`.env`** file in the root of your project and add your environment variables:
    ```env
    PORT=3000
    DB_USER=your_mongodb_username
    DB_PASS=your_mongodb_password
    JWT_ACCESS_SECRET=your_jwt_secret_key
    NODE_ENV=development # or production
    ```
    * `PORT`: The port your backend server will run on (defaulting to 3000 if not specified).
    * `DB_USER` & `DB_PASS`: Your MongoDB Atlas cluster username and password.
    * `JWT_ACCESS_SECRET`: A strong, random string for signing JWTs. **Generate a complex one for production!**
    * `NODE_ENV`: Set to `production` in production environments for secure cookie handling (`secure` and `sameSite` settings).
2.  Start the backend server:
    ```bash
    npm start
    ```
    The server will typically run on the port specified in your `.env` file (e.g., `http://localhost:3000`).

---

## 🗺️ API Endpoints

Here's a detailed overview of the API endpoints provided by this backend:

| Method   | Endpoint                             | Description                                                                                                                                                                                                                                | Authentication |
| :------- | :----------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| `POST`   | `/jwt`                               | Generates and sets a JWT cookie for authenticated users.                                                                                                                                                                                   | Public         |
| `POST`   | `/logout`                            | Clears the JWT cookie, effectively logging out the user.                                                                                                                                                                                   | Public         |
| `POST`   | `/user`                              | Creates a new user in the database.                                                                                                                                                                                                        | Public         |
| `GET`    | `/user/:uid`                         | Retrieves user details, including a list of enrolled course IDs from the `enrollments` collection.                                                                                                                                         | Public         |
| `PUT`    | `/user/:uid`                         | Updates an existing user's data.                                                                                                                                                                                                           | Public         |
| `POST`   | `/category`                          | Adds a new course category.                                                                                                                                                                                                                | Public         |
| `GET`    | `/categories`                        | Retrieves a list of course categories. Supports query parameters: `limit`, `sortBy`, `orderBy`.                                                                                                                                            | Public         |
| `POST`   | `/course`                            | Creates a new course entry in the database.                                                                                                                                                                                                | Public         |
| `GET`    | `/course/:id`                        | Retrieves details for a specific course by its `_id`, including aggregated review count and average rating.                                                                                                                                | Public         |
| `GET`    | `/course`                            | Retrieves all courses, with aggregated review count and average rating for each.                                                                                                                                                           | Public         |
| `GET`    | `/courses/:uid`                      | Retrieves courses posted by a specific mentor (`mentorUID`).                                                                                                                                                                               | Requires JWT   |
| `GET`    | `/courses`                           | Retrieves courses with advanced filtering, sorting, and limiting options. Query parameters: `filterBy` (e.g., "free", "price", or category name), `limit`, `sortBy`, `orderBy`.                                                            | Public         |
| `PUT`    | `/course/:id`                        | Updates an existing course by its `_id`.                                                                                                                                                                                                   | Public         |
| `DELETE` | `/course/:id`                        | Deletes a course by its `_id`.                                                                                                                                                                                                             | Public         |
| `POST`   | `/review`                            | Adds a new review for a course.                                                                                                                                                                                                            | Public         |
| `GET`    | `/reviewsByCourseId/:id`             | Retrieves all reviews for a given `courseId`, including reviewer's display name and photo.                                                                                                                                                 | Public         |
| `DELETE` | `/review/:id`                        | Deletes a specific review by its `_id`.                                                                                                                                                                                                    | Public         |
| `POST`   | `/enrollment`                        | Handles user enrollment and unenrollment in courses. Requires `uid`, `courseId`, and `enroll` status in the body. Utilizes **MongoDB Transactions** for atomic operations across multiple collections.                                  | Public         |
| `GET`    | `/enrollments/:uid`                  | Retrieves all enrollments for a specific user, including details of the enrolled courses.                                                                                                                                                  | Requires JWT   |
| `DELETE` | `/enrollment/:id`                    | Deletes a specific enrollment record by its `_id`.                                                                                                                                                                                         | Public         |
| `POST`   | `/blog`                              | Creates a new blog post.                                                                                                                                                                                                                   | Public         |
| `GET`    | `/blogs`                             | Retrieves all blog posts, including the author's display name and photo.                                                                                                                                                                   | Public         |
| `GET`    | `/`                                  | Basic root endpoint to confirm the server is running.                                                                                                                                                                                      | Public         |

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📞 Contact

Shaharear Rahman Sabbir - imshaharear@gmail.com

