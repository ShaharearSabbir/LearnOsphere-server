# LearnOsphere - Backend

This repository contains the backend for the LearnOsphere online learning platform. It provides the API endpoints and handles data management for the frontend application.

---

## ✨ Top Features

* **Robust User Authentication & Authorization:** Implements secure user registration, login, and access control leveraging **JSON Web Tokens (JWT)**, specifically setting JWTs as HTTP-only cookies. Includes a dedicated `varifyToken` middleware for route protection.
* **Atomic Enrollment & Unenrollment with MongoDB Transactions:** Manages user enrollment and unenrollment in courses using **MongoDB transactions**. This ensures critical data consistency across `enrollments`, `courses` (updating `totalEnrollment` and `RemainingSeat`), and `user` collections (modifying `totalEnrolled` and `enrolledCourseIds`) in a single, all-or-nothing operation.
* **Advanced Course Management & Data Aggregation:** Offers sophisticated course retrieval with comprehensive filtering (by `free`/`price`, `category`), sorting (`createdAt`), and pagination options using a powerful **aggregation pipeline**. Detailed course information includes aggregated `numberOfReview` and `averageRating` through `$lookup` operations with the `reviews` collection.
* **Dynamic User & Review Data Enrichment:** Enhances user profiles by aggregating `enrolledCourseIds` from the `enrollments` collection and enriches course reviews by incorporating reviewer `displayName` and `photoURL` via `$lookup` with the `user` collection.
* **Mentor-Specific Course Access Control:** Provides secure retrieval of courses posted by a specific mentor, with access protected by the `varifyToken` middleware.

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

| Method | Endpoint | Description | Authentication |
| :------- | :----------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| `POST` | `/jwt` | Generates and sets a JWT cookie for authenticated users. | Public |
| `POST` | `/logout` | Clears the JWT cookie, effectively logging out the user. | Public |
| `POST` | `/user` | Creates a new user in the database. | Public |
| `GET` | `/user/:uid` | Retrieves user details, including a list of enrolled course IDs from the `enrollments` collection. | Public |
| `PUT` | `/user/:uid` | Updates an existing user's data. | Public |
| `POST` | `/category` | Adds a new course category. | Public |
| `GET` | `/categories` | Retrieves a list of course categories. Supports query parameters: `limit`, `sortBy`, `orderBy`. | Public |
| `POST` | `/course` | Creates a new course entry in the database. | Public |
| `GET` | `/course/:id` | Retrieves details for a specific course by its `_id`, including aggregated review count and average rating. | Public |
| `GET` | `/course` | Retrieves all courses, with aggregated review count and average rating for each. | Public |
| `GET` | `/courses/:uid` | Retrieves courses posted by a specific mentor (`mentorUID`). | Requires JWT |
| `GET` | `/courses` | Retrieves courses with advanced filtering, sorting, and limiting options. Query parameters: `filterBy` (e.g., "free", "price", or category name), `limit`, `sortBy`, `orderBy`. | Public |
| `PUT` | `/course/:id` | Updates an existing course by its `_id`. | Public |
| `DELETE` | `/course/:id` | Deletes a course by its `_id`. | Public |
| `POST` | `/review` | Adds a new review for a course. | Public |
| `GET` | `/reviewsByCourseId/:id` | Retrieves all reviews for a given `courseId`, including reviewer's display name and photo. | Public |
| `DELETE` | `/review/:id` | Deletes a specific review by its `_id`. | Public |
| `POST` | `/enrollment` | Handles user enrollment and unenrollment in courses. Requires `uid`, `courseId`, and `enroll` status in the body. Utilizes **MongoDB Transactions** for atomic operations across multiple collections. | Public |
| `GET` | `/enrollments/:uid` | Retrieves all enrollments for a specific user, including details of the enrolled courses. | Requires JWT |
| `DELETE` | `/enrollment/:id` | Deletes a specific enrollment record by its `_id`. | Public |
| `POST` | `/blog` | Creates a new blog post. | Public |
| `GET` | `/blogs` | Retrieves all blog posts, including the author's display name and photo. | Public |
| `GET` | `/` | Basic root endpoint to confirm the server is running. | Public |

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
