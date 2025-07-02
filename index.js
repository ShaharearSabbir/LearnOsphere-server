const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "https://learn-osphere.web.app",
];
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

const varifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access 1" });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access 2" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@leanosphere.0kndmfr.mongodb.net/?retryWrites=true&w=majority&appName=leanosphere`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully

    const userCollection = client.db("learnosphereDB").collection("user");
    const categoriesCollection = client
      .db("learnosphereDB")
      .collection("categories");
    const coursesCollection = client.db("learnosphereDB").collection("courses");
    const reviewsCollection = client.db("learnosphereDB").collection("reviews");
    const blogsCollection = client.db("learnosphereDB").collection("blogs");
    const enrollmentsCollection = client
      .db("learnosphereDB")
      .collection("enrollments");

    app.post("/jwt", async (req, res) => {
      const userData = req.body;
      const token = jwt.sign(userData, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "1d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      });

      res.send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
      res.status(200).json({ message: "Logged out successfully" });
    });

    app.post("/user", async (req, res) => {
      try {
        const userData = req.body;
        const result = await userCollection.insertOne(userData);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to create user." });
      }
    });

    app.get("/user/:uid", async (req, res) => {
      try {
        const uid = req.params.uid;

        const pipeline = [
          {
            $match: { uid: uid },
          },
          {
            $lookup: {
              from: "enrollments",
              localField: "uid",
              foreignField: "uid",
              as: "userEnrollments",
            },
          },
          {
            $addFields: {
              enrolledCourseIds: {
                $map: {
                  input: "$userEnrollments",
                  as: "enroll",
                  in: "$$enroll.courseId",
                },
              },
            },
          },
          {
            $project: {
              userEnrollments: 0,
            },
          },
        ];

        const result = await userCollection.aggregate(pipeline).toArray();

        if (result.length > 0) {
          res.send(result[0]);
        } else {
          res.status(404).send({ message: "User not found." });
        }
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to fetch user with enrolled course IDs." });
      }
    });

    app.put("/user/:uid", async (req, res) => {
      try {
        const uid = req.params.uid;
        const userData = req.body;
        const filter = { uid: uid };
        const updateDoc = {
          $set: {
            ...userData,
          },
        };
        const option = { upsert: true };
        const result = await userCollection.updateOne(
          filter,
          updateDoc,
          option
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to update user." });
      }
    });

    app.post("/category", async (req, res) => {
      try {
        const newCategory = req.body;
        const result = await categoriesCollection.insertOne(newCategory);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to add category." });
      }
    });

    app.get("/categories", async (req, res) => {
      const { limit, sortBy, orderBy } = req.query;
      let dataLimit = 0;
      let sortOptions = {};

      const parsedLimit = parseInt(limit);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        dataLimit = parsedLimit;
      }

      let order = orderBy === "asc" ? 1 : -1;

      if (sortBy) {
        sortOptions[sortBy] = order;
      } else {
        sortOptions.createdAt = order;
      }

      try {
        let cursor = categoriesCollection.find();

        cursor = cursor.sort(sortOptions);

        if (dataLimit > 0) {
          cursor = cursor.limit(dataLimit);
        }

        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Error fetching categories from database." });
      }
    });

    app.post("/course", async (req, res) => {
      const newCourse = req.body;
      newCourse.createdAt = new Date();
      try {
        const result = await coursesCollection.insertOne(newCourse);
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Error fetching courses from database." });
      }
    });

    app.get("/course/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const objectId = new ObjectId(id);

        const result = await coursesCollection
          .aggregate([
            {
              $match: { _id: objectId },
            },
            {
              $addFields: {
                courseIdString: { $toString: "$_id" },
              },
            },
            {
              $lookup: {
                from: "reviews",
                localField: "courseIdString",
                foreignField: "courseId",
                as: "courseReviews",
              },
            },
            {
              $addFields: {
                numberOfReview: { $size: "$courseReviews" },
                averageRating: {
                  $round: [{ $avg: "$courseReviews.rating" }, 2],
                },
              },
            },
            {
              $project: {
                courseIdString: 0,
                courseReviews: 0,
              },
            },
          ])
          .toArray();

        if (result.length > 0) {
          res.send(result[0]);
        } else {
          res.status(404).send({ message: "Course not found." });
        }
      } catch (error) {
        res
          .status(500)
          .send({ message: "Error fetching course details from database." });
      }
    });

    app.get("/course", async (req, res) => {
      try {
        const result = await coursesCollection
          .aggregate([
            {
              $addFields: {
                courseIdString: { $toString: "$_id" },
              },
            },
            {
              $lookup: {
                from: "reviews",
                localField: "courseIdString",
                foreignField: "courseId",
                as: "courseReviews",
              },
            },
            {
              $addFields: {
                numberOfReview: { $size: "$courseReviews" },
                averageRating: {
                  $round: [{ $avg: "$courseReviews.rating" }, 2],
                },
              },
            },
            {
              $project: {
                courseIdString: 0,
                courseReviews: 0,
              },
            },
          ])
          .toArray();

        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Error fetching courses from database." });
      }
    });

    app.get("/courses/:uid", varifyToken, async (req, res) => {
      try {
        const uid = req.params.uid;

        if (uid !== req.decoded.uid) {
          return res.status(403).send({ message: "forbidden access" });
        }

        const query = { mentorUID: uid };
        const result = await coursesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to fetch courses by mentor UID." });
      }
    });

    // app.get("/courses", async (req, res) => {
    //   const { filterBy, limit, sortBy, orderBy } = req.query;

    //   let aggregationPipeline = [];
    //   let matchQuery = {};

    //   if (filterBy) {
    //     if (filterBy === "free") {
    //       matchQuery.free = true;
    //     } else if (filterBy === "price") {
    //       matchQuery.free = { $ne: true };
    //     } else {
    //       matchQuery.category = filterBy;
    //     }
    //   }

    //   if (Object.keys(matchQuery).length > 0) {
    //     aggregationPipeline.push({ $match: matchQuery });
    //   }

    //   aggregationPipeline.push({
    //     $addFields: {
    //       courseIdString: { $toString: "$_id" },
    //     },
    //   });

    //   aggregationPipeline.push({
    //     $lookup: {
    //       from: "reviews",
    //       localField: "courseIdString",
    //       foreignField: "courseId",
    //       as: "courseReviews",
    //     },
    //   });

    //   aggregationPipeline.push({
    //     $addFields: {
    //       numberOfReview: { $size: "$courseReviews" },
    //       averageRating: { $round: [{ $avg: "$courseReviews.rating" }, 2] },
    //     },
    //   });

    //   aggregationPipeline.push({
    //     $project: {
    //       courseIdString: 0,
    //       courseReviews: 0,
    //     },
    //   });

    //   let sortField = sortBy || "createdAt";
    //   let sortOrder = orderBy === "asc" ? 1 : -1;

    //   aggregationPipeline.push({
    //     $sort: { [sortField]: sortOrder },
    //   });

    //   const parsedLimit = parseInt(limit);
    //   if (!isNaN(parsedLimit) && parsedLimit > 0) {
    //     aggregationPipeline.push({ $limit: parsedLimit });
    //   }

    //   try {
    //     const result = await coursesCollection
    //       .aggregate(aggregationPipeline)
    //       .toArray();
    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).send("Error fetching courses from database.");
    //   }
    // });


    app.get("/courses", async (req, res) => {
      const { filterBy, limit, sortBy, orderBy, search } = req.query;


      let aggregationPipeline = [];
      let matchQuery = {};

      if (filterBy) {
        if (filterBy === "free") {
          matchQuery.free = true;
        } else if (filterBy === "price") {
          matchQuery.free = { $ne: true };
        } else {
          matchQuery.category = filterBy;
        }
      }

      if (search) {
        const searchCondition = {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
            { topics: { $regex: search, $options: "i" } },
          ],
        };

        if (Object.keys(matchQuery).length > 0) {
          matchQuery = { $and: [matchQuery, searchCondition] };
        } else {
          matchQuery = searchCondition;
        }
      }

      if (Object.keys(matchQuery).length > 0) {
        aggregationPipeline.push({ $match: matchQuery });
      }

      aggregationPipeline.push({
        $addFields: {
          courseIdString: { $toString: "$_id" },
        },
      });

      aggregationPipeline.push({
        $lookup: {
          from: "reviews",
          localField: "courseIdString",
          foreignField: "courseId",
          as: "courseReviews",
        },
      });

      aggregationPipeline.push({
        $addFields: {
          numberOfReview: { $size: "$courseReviews" },
          averageRating: { $round: [{ $avg: "$courseReviews.rating" }, 2] },
        },
      });

      aggregationPipeline.push({
        $project: {
          courseIdString: 0,
          courseReviews: 0,
        },
      });

      let sortField = sortBy || "createdAt";
      let sortOrder = orderBy === "asc" ? 1 : -1;

      aggregationPipeline.push({
        $sort: { [sortField]: sortOrder },
      });

      const parsedLimit = parseInt(limit);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        aggregationPipeline.push({ $limit: parsedLimit });
      }

      try {
        const result = await coursesCollection
          .aggregate(aggregationPipeline)
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send("Error fetching courses from database.");
      }
    });

    app.put("/course/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateCourse = req.body;
        updateCourse.UpdatedAt = new Date();
        const updateDoc = {
          $set: { ...updateCourse },
        };
        const option = { upsert: true };
        const result = await coursesCollection.updateOne(
          filter,
          updateDoc,
          option
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to update course." });
      }
    });

    app.delete("/course/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await coursesCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to delete course." });
      }
    });

    app.post("/review", async (req, res) => {
      try {
        const reviewData = req.body;
        const result = await reviewsCollection.insertOne(reviewData);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to add review." });
      }
    });

    app.get("/reviewsByCourseId/:id", async (req, res) => {
      try {
        const courseId = req.params.id;
        const result = await reviewsCollection
          .aggregate([
            { $match: { courseId: courseId } },
            {
              $lookup: {
                from: "user",
                localField: "uid",
                foreignField: "uid",
                as: "user",
              },
            },
            {
              $unwind: { path: "$user" },
            },
            {
              $project: {
                _id: 1,
                reviewText: 1,
                rating: 1,
                reviewerName: "$user.displayName",
                reviewerPhotoURL: "$user.photoURL",
              },
            },
          ])
          .toArray();
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to fetch reviews by course ID." });
      }
    });

    app.delete("/review/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const result = await reviewsCollection.deleteOne(query);
        res.send(result);
      } catch {
        res.status(500).send({ message: "Failed to delete review." });
      }
    });

    app.post("/enrollment", async (req, res) => {
      const { enroll, uid, courseId } = req.body;

      if (!uid || !courseId || enroll === undefined) {
        return res.status(400).send({
          message:
            "uid, courseId, and enroll status are required in the request body.",
        });
      }

      let courseObjectId;
      try {
        courseObjectId = new ObjectId(courseId);
      } catch (err) {
        return res.status(400).send({ message: "Invalid courseId format." });
      }

      const session = client.startSession();

      try {
        session.startTransaction();

        if (enroll) {
          const enrollmentResult = await enrollmentsCollection.insertOne(
            {
              uid: uid,
              courseId: courseObjectId,
              enrollmentDate: new Date(),
            },
            { session }
          );

          const courseUpdateResult = await coursesCollection.updateOne(
            { _id: courseObjectId },
            { $inc: { totalEnrollment: 1, RemainingSeat: -1 } },
            { session }
          );

          if (courseUpdateResult.matchedCount === 0) {
            throw new Error(
              "Course not found or no seats available for enrollment."
            );
          }

          const userUpdateResult = await userCollection.updateOne(
            { uid: uid },
            {
              $inc: { totalEnrolled: 1 },
              $addToSet: { enrolledCourseIds: courseObjectId },
            },
            { session }
          );

          if (userUpdateResult.matchedCount === 0) {
            throw new Error("User not found for enrollment.");
          }

          await session.commitTransaction();
          res.status(200).send({
            message: "Enrollment successful!",
            enrollmentId: enrollmentResult.insertedId,
          });
        } else {
          const deleteEnrollmentResult = await enrollmentsCollection.deleteOne(
            { uid: uid, courseId: courseObjectId },
            { session }
          );

          if (deleteEnrollmentResult.deletedCount === 0) {
            throw new Error("Enrollment record not found for unenrollment.");
          }

          const courseUnenrollUpdateResult = await coursesCollection.updateOne(
            { _id: courseObjectId },
            { $inc: { RemainingSeat: 1 } },
            { session }
          );

          if (courseUnenrollUpdateResult.matchedCount === 0) {
            throw new Error("Course not found for unenrollment update.");
          }

          const userUnenrollUpdateResult = await userCollection.updateOne(
            { uid: uid },
            {
              $inc: { totalEnrolled: -1 },
              $pull: { enrolledCourseIds: courseObjectId },
            },
            { session }
          );

          if (userUnenrollUpdateResult.matchedCount === 0) {
            throw new Error("User not found for unenrollment update.");
          }

          await session.commitTransaction();
          res.status(200).send({ message: "Unenrollment successful!" });
        }
      } catch (error) {
        console.error("Transaction aborted:", error);
        await session.abortTransaction();
        res.status(500).send({
          message: `Transaction failed: ${
            error.message || "An unexpected error occurred."
          }`,
        });
      } finally {
        session.endSession();
      }
    });

    app.get("/enrollments/:uid", varifyToken, async (req, res) => {
      const uid = req.params.uid;

      if (uid !== req.decoded.uid) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const pipeline = [
        {
          $match: { uid: uid },
        },
        {
          $lookup: {
            from: "courses",
            localField: "courseId",
            foreignField: "_id",
            as: "courseDetails",
          },
        },
        {
          $unwind: "$courseDetails",
        },
        {
          $project: {
            _id: 1,
            courseId: 1,
            enrollmentDate: 1,
            courseTitle: "$courseDetails.title",
            coursePhotoURL: "$courseDetails.photoURL",
            courseCategory: "$courseDetails.category",
          },
        },
      ];

      try {
        const result = await enrollmentsCollection
          .aggregate(pipeline)
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(404).send({ message: "Data Not Found or Server Error" });
      }
    });

    app.delete("/enrollment/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const result = await enrollmentsCollection.deleteOne(query);
        res.send(result);
      } catch {
        res.status(500).send({ message: "Failed to delete review." });
      }
    });

    app.post("/blog", async (req, res) => {
      try {
        const newPost = req.body;
        const createdAt = new Date();
        newPost.createdAt = createdAt;
        const result = await blogsCollection.insertOne(newPost);
        res.send(result);
      } catch (err) {
        return res
          .status(400)
          .send({ message: "Server Problem, try again later" });
      }
    });

    app.get("/blogs", async (req, res) => {
      try {
        const result = await blogsCollection
          .aggregate([
            {
              $lookup: {
                from: "user",
                localField: "PostedBy",
                foreignField: "uid",
                as: "user",
              },
            },
            { $unwind: "$user" },
            {
              $project: {
                _id: 1,
                title: 1,
                photoURL: 1,
                content: 1,
                createdAt: 1,
                postCreatorName: "$user.displayName",
                postCreatorPhoto: "$user.photoURL",
              },
            },
          ])
          .toArray();
        res.send(result);
      } catch (err) {
        return res
          .status(400)
          .send({ message: "Server Problem, try again later" });
      }
    });
  } finally {
  }
};
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Tutorials are being cooked");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
