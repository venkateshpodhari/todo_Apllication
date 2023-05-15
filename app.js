const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperties = (query) => {
  return query.priority !== undefined;
};

const hasStatusProperties = (query) => {
  return query.status !== undefined;
};

//get all todos based on query
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let data = null;
  let getQueryDetails = "";

  switch (true) {
    case hasPriorityAndStatusProperties(request.body):
      getQueryDetails = ` SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;

    case hasPriorityProperties(request.query):
      getQueryDetails = `SELECT *
       FROM 
       todo
        WHERE todo LIKE '%${search_q}%' 
        AND priority = '${priority}'`;
      break;
    case hasStatusProperties(request.query):
      getQueryDetails = `SELECT *
       FROM 
       todo 
       WHERE todo LIKE '%${search_q}%' 
       AND status = '${status}'`;
      break;
    default:
      getQueryDetails = `SELECT * 
      FROM
       todo 
       WHERE todo LIKE '%${search_q}%`;
      break;
  }
  data = await db.all(getQueryDetails);
  response.send(data);
});

//get todo based on id
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `SELECT * FROM todo WHERE id = ${todoId};`;
  const dbResponse = await db.get(getTodo);
  response.send(dbResponse);
});

// create todo in todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodo = `INSERT INTO todo(id,todo,priority,status)
    Values(${id},'${todo}','${priority}','${status}');`;
  await db.run(createTodo);
  response.send("Todo Successfully Added");
});

//updating todo based on id
app.put("/todos/:todoId/", async (request, response) => {
  const { status, priority, todo } = request.query;
  const { todoId } = request.params;
  const updateTodo = `UPDATE todo SET status = '${status}',
  priority = '${priority}',todo = '${todo}'
  WHERE id = ${todoId};`;
  await db.run(updateTodo);
  response.send("Status Updated");
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});
