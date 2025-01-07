
const express = require("express");
const path = require("path");


const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "microInsta.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(10000, () => {
      console.log("Server Running at http://localhost:10000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();


// Get Users API
app.get("/users", async (request, response) => {
    const getUsersQuery = `
      SELECT
        *
      FROM
        users
      ORDER BY
        id;`;
    const usersArray = await db.all(getUsersQuery);
    response.send(usersArray);
  });

  // Get Posts API
  app.get("/posts", async (request, response) => {
    const getPostsQuery = `
      SELECT
        *
      FROM
        posts
      ORDER BY
        id;`;
    const postsArray = await db.all(getPostsQuery);
    response.send(postsArray);
  });
  // Create a Post 
  
  app.post("/posts/", async (request, response) => {
    const postDetails = request.body;
    
    const { title, description, user_id, images } = postDetails;
  
    const addPostQuery = `
      INSERT INTO posts (title, description, user_id, images)
      VALUES ('${title}','${description}','${user_id}','${images}');
    `;
  
    try {
      const dbResponse = await db.run(addPostQuery);
      const id = dbResponse.lastID;
       const updatePostCountQuery =
      `UPDATE users SET post_count = post_count + 1 WHERE id = ${user_id};`;
      await db.run(updatePostCountQuery);


      response.send({ id:id});
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: 'Failed to create post' });
    }
  });

  // Delete a Post
   
  app.delete("/posts/:id/", async (request, response) => {
    const { id } = request.params;
    const deletePostQuery = `
      DELETE FROM
        posts
      WHERE
        id = ${id};`;
    await db.run(deletePostQuery);
    response.send("Post Deleted Successfully");
  });

  // Edit a post of a User

  app.put("/posts/:id/", async (request, response) => {
    const { id } = request.params;
    const postDetails = request.body;
    const {
      title,
      description,
      user_id,
      images,
    } = postDetails;
    const updatePostQuery = `
      UPDATE
        posts
      SET
        title='${title}',
        description='${description}',
        user_id=${user_id},
        images='${images}'
      WHERE
        user_id = ${user_id};`;
    await db.run(updatePostQuery);
    response.send("Post Updated Successfully");
  });

  // Get all the Posts of Users

  
  app.get("/users/:id/posts", async (request, response) => {
    const { id } = request.params;
    const {user_id} = request.params;
    const getUserPostCountQuery = `SELECT post_count FROM users WHERE users.id = ${id};`;
    
    const getUserPostsQuery = `SELECT * FROM posts WHERE posts.user_id = ${id};`;
    
    try {
    const postCountResponse = await db.get(getUserPostCountQuery);
    const userPostsResponse = await db.all(getUserPostsQuery);
    
    response.send({
      postCount: postCountResponse.post_count,
      posts: userPostsResponse,
    });
    
    } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to fetch user posts" });
    }
    });
 
