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

    app.listen(3001, () =>
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
    case hasPriorityAndStatusProperties(request.query):
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
       WHERE 
       todo LIKE '%${search_q}%'`;
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
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";

      break;

    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateTodo = `UPDATE todo  SET todo = '${todo}',priority = '${priority}',status = '${status}' WHERE id = ${todoId}`;
  await db.run(updateTodo);
  response.send(`${updateColumn} Updated`);
});

//delete todo based on id
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
