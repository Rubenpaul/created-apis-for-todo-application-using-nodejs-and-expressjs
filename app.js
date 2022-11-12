const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDBAndServer();

//ADD GET Todos API
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority } = request.query;

  let result = null;
  let getTodosQuery = "";

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT 
                * 
            FROM
                todo
            WHERE
                todo LIKE "%${search_q}%"
                AND status = "${status}"
                AND priority = "${priority}"
        `;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT
                * 
            FROM 
                todo 
            WHERE 
                todo LIKE "%${search_q}%"
                AND priority = "${priority}"
            `;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT
                * 
            FROM 
                todo 
            WHERE 
                todo LIKE "%${search_q}%"
                AND status = "${status}"
        `;
      break;
    default:
      getTodosQuery = `
            SELECT
                * 
            FROM 
                todo 
            WHERE 
                todo LIKE "%${search_q}%"
        `;
      break;
  }

  result = await db.all(getTodosQuery);
  response.send(result);
});

//ADD GET todo API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT 
            * 
        FROM
            todo 
        WHERE
            id = ${todoId}
    `;
  const todoItem = await db.get(getTodoQuery);
  response.send(todoItem);
});

//ADD POST todo API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoQuery = `
        INSERT INTO 
            todo (id, todo, priority, status)
        VALUES (
            ${id},
            "${todo}",
            "${priority}",
            "${status}"
        )
    `;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//ADD DELETE Todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM
            todo
        WHERE 
            id =${todoId}
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

//ADD UPDATE Todo API

const hasPriorityBody = (requestBody) => {
  return requestBody.priority !== undefined;
};
const hasStatusBody = (requestBody) => {
  return requestBody.status !== undefined;
};
const hasTodoBody = (requestBody) => {
  return requestBody.todo !== undefined;
};

app.put("/todos/:todoId", async (request, response) => {
  const { status = "", priority = "", todo = "" } = request.body;
  const { todoId } = request.params;
  let updateTodoQuery = "";
  let result = null;

  switch (true) {
    case hasStatusBody(request.body):
      updateTodoQuery = `
      UPDATE 
            todo 
        SET 
            status = "${status}"
        WHERE
            id = ${todoId}
        `;
      result = "Status Updated";
      break;
    case hasPriorityBody(request.body):
      updateTodoQuery = `
      UPDATE 
            todo 
        SET 
            priority = "${priority}"
        WHERE
            id = ${todoId}
        `;
      result = "Priority Updated";
      break;
    case hasTodoBody(request.body):
      updateTodoQuery = `
      UPDATE 
            todo 
        SET 
            todo = "${todo}"
        WHERE
            id = ${todoId}
        `;
      result = "Todo Updated";
      break;
    default:
      break;
  }

  await db.run(updateTodoQuery);
  response.send(result);
});

module.exports = app;
